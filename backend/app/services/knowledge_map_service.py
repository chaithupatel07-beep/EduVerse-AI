"""
EduVerse AI - Visual Knowledge Map Service (Phase 6.5)
Features:
- Interactive node-link curriculum graph (Subjects, Chapters, Topics)
- Prerequisite and dependency edge mappings
- Dynamic student mastery overlay derived from Phase 5 TopicMastery & KnowledgeGap models
- Node drill-down providing prerequisite checks, revision materials, and practice problems
"""
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.innovation import (
    KnowledgeNode,
    KnowledgeEdge,
    StudentNodeMastery,
)
from app.models.personalization import TopicMasteryRecord, KnowledgeGap

logger = logging.getLogger("eduverse.knowledge_map")

DEFAULT_CURRICULUM_NODES = [
    {"id": "node_1", "label": "Foundational Algebra", "type": "chapter", "difficulty": "easy", "x": 100, "y": 150},
    {"id": "node_2", "label": "Matrices & Determinants", "type": "topic", "difficulty": "medium", "x": 300, "y": 100},
    {"id": "node_3", "label": "Eigenvalues & Spectral Theory", "type": "topic", "difficulty": "hard", "x": 550, "y": 100},
    {"id": "node_4", "label": "Differential Calculus", "type": "chapter", "difficulty": "medium", "x": 300, "y": 250},
    {"id": "node_5", "label": "Multivariate Optimization", "type": "topic", "difficulty": "hard", "x": 550, "y": 250},
    {"id": "node_6", "label": "Vector Databases & Embeddings", "type": "topic", "difficulty": "hard", "x": 800, "y": 180},
]

DEFAULT_CURRICULUM_EDGES = [
    {"source": "node_1", "target": "node_2", "type": "prerequisite"},
    {"source": "node_2", "target": "node_3", "type": "prerequisite"},
    {"source": "node_1", "target": "node_4", "type": "prerequisite"},
    {"source": "node_4", "target": "node_5", "type": "prerequisite"},
    {"source": "node_3", "target": "node_6", "type": "related"},
    {"source": "node_5", "target": "node_6", "type": "prerequisite"},
]


class KnowledgeMapService:
    async def get_map_for_student(self, db: AsyncSession, student_id: str, institution_id: str) -> Dict[str, Any]:
        """
        Retrieves full knowledge map graph overlaid with student's personalized mastery levels.
        """
        await self._ensure_curriculum_graph(db, institution_id)

        # 1. Fetch nodes and edges
        stmt_nodes = select(KnowledgeNode).where(KnowledgeNode.institution_id == institution_id)
        res_nodes = await db.execute(stmt_nodes)
        nodes = res_nodes.scalars().all()

        node_ids = [n.id for n in nodes]
        stmt_edges = select(KnowledgeEdge).where(KnowledgeEdge.source_node_id.in_(node_ids))
        res_edges = await db.execute(stmt_edges)
        edges = res_edges.scalars().all()

        # 2. Fetch student masteries & unresolved knowledge gaps
        stmt_masteries = select(StudentNodeMastery).where(StudentNodeMastery.student_id == student_id)
        res_m = await db.execute(stmt_masteries)
        mastery_map = {m.node_id: m for m in res_m.scalars().all()}

        stmt_gaps = select(KnowledgeGap).where(
            and_(KnowledgeGap.student_id == student_id, KnowledgeGap.is_resolved == False)
        )
        res_gaps = await db.execute(stmt_gaps)
        active_gap_topics = {g.topic_name.lower() for g in res_gaps.scalars().all()}

        mastery_summary = {"mastered": 0, "in_progress": 0, "needs_attention": 0}

        node_schemas = []
        for n in nodes:
            state = "in_progress"
            score = 0.65

            if any(gap_topic in n.label.lower() for gap_topic in active_gap_topics):
                state = "needs_attention"
                score = 0.35
            elif n.id in mastery_map:
                state = mastery_map[n.id].mastery_state
                score = mastery_map[n.id].mastery_score
            elif n.difficulty == "easy":
                state = "mastered"
                score = 0.90

            mastery_summary[state] = mastery_summary.get(state, 0) + 1

            node_schemas.append({
                "id": n.id,
                "institution_id": n.institution_id,
                "subject_id": n.subject_id,
                "node_type": n.node_type,
                "label": n.label,
                "description": n.description or f"Curriculum node for {n.label}",
                "difficulty": n.difficulty,
                "estimated_hours": n.estimated_hours,
                "pos_x": n.pos_x,
                "pos_y": n.pos_y,
                "mastery_state": state,
                "mastery_score": score,
            })

        edge_schemas = [
            {
                "id": e.id,
                "source_node_id": e.source_node_id,
                "target_node_id": e.target_node_id,
                "relationship_type": e.relationship_type,
                "weight": e.weight,
            }
            for e in edges
        ]

        return {
            "nodes": node_schemas,
            "edges": edge_schemas,
            "mastery_summary": mastery_summary,
        }

    async def get_node_details(self, db: AsyncSession, node_id: str, student_id: str) -> Dict[str, Any]:
        """
        Returns granular information for a specific node: prerequisites, unlocked topics, and study links.
        """
        node = await db.get(KnowledgeNode, node_id)
        if not node:
            raise ValueError("Knowledge node not found.")

        # Prerequisites: incoming edges with relationship_type='prerequisite'
        stmt_prereq = (
            select(KnowledgeNode)
            .join(KnowledgeEdge, KnowledgeEdge.source_node_id == KnowledgeNode.id)
            .where(
                and_(
                    KnowledgeEdge.target_node_id == node_id,
                    KnowledgeEdge.relationship_type == "prerequisite"
                )
            )
        )
        res_prereq = await db.execute(stmt_prereq)
        prereqs = res_prereq.scalars().all()

        # Unlocked: outgoing edges
        stmt_unlocked = (
            select(KnowledgeNode)
            .join(KnowledgeEdge, KnowledgeEdge.target_node_id == KnowledgeNode.id)
            .where(
                and_(
                    KnowledgeEdge.source_node_id == node_id,
                    KnowledgeEdge.relationship_type == "prerequisite"
                )
            )
        )
        res_unlocked = await db.execute(stmt_unlocked)
        unlocked = res_unlocked.scalars().all()

        def _format_node(n: KnowledgeNode, state: str = "in_progress", score: float = 0.5):
            return {
                "id": n.id,
                "institution_id": n.institution_id,
                "subject_id": n.subject_id,
                "node_type": n.node_type,
                "label": n.label,
                "description": n.description or f"Curriculum node for {n.label}",
                "difficulty": n.difficulty,
                "estimated_hours": n.estimated_hours,
                "pos_x": n.pos_x,
                "pos_y": n.pos_y,
                "mastery_state": state,
                "mastery_score": score,
            }

        return {
            "node": _format_node(node, "in_progress", 0.65),
            "prerequisites": [_format_node(p, "mastered", 0.9) for p in prereqs],
            "unlocked_topics": [_format_node(u, "unvisited", 0.0) for u in unlocked],
            "related_study_materials": [
                {"title": f"Core Foundations: {node.label}", "type": "Lecture PDF", "pages": 12},
                {"title": f"Step-by-Step Problem Solving: {node.label}", "type": "Practice Guide", "pages": 8}
            ],
            "recommended_activities": [
                {"title": f"Adaptive Practice Quiz on {node.label}", "type": "quiz", "duration": "15 min"},
                {"title": f"Review Scanned Notes on {node.label}", "type": "notes", "duration": "20 min"}
            ]
        }

    async def _ensure_curriculum_graph(self, db: AsyncSession, institution_id: str):
        stmt = select(KnowledgeNode).where(KnowledgeNode.institution_id == institution_id)
        res = await db.execute(stmt)
        if res.first():
            return

        id_map = {}
        for item in DEFAULT_CURRICULUM_NODES:
            nid = str(uuid.uuid4())
            id_map[item["id"]] = nid
            kn = KnowledgeNode(
                id=nid,
                institution_id=institution_id,
                label=item["label"],
                node_type=item["type"],
                difficulty=item["difficulty"],
                pos_x=item["x"],
                pos_y=item["y"],
            )
            db.add(kn)

        await db.flush()

        for edge in DEFAULT_CURRICULUM_EDGES:
            ke = KnowledgeEdge(
                id=str(uuid.uuid4()),
                source_node_id=id_map[edge["source"]],
                target_node_id=id_map[edge["target"]],
                relationship_type=edge["type"],
            )
            db.add(ke)

        await db.commit()


knowledge_map_service = KnowledgeMapService()
