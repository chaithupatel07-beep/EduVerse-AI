import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_study_materials_flow(client: AsyncClient, admin_headers):
    # Setup: Create a course
    c_res = await client.post(
        "/api/v1/courses",
        json={"title": "Data Structures", "code": "DS101", "credits": 3},
        headers=admin_headers,
    )
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    # 1. Upload Study Material (as teacher/admin)
    dummy_pdf_content = b"%PDF-1.4\nTest Study Material Body\n%%EOF"
    files = {
        "file": ("lecture1_notes.pdf", io.BytesIO(dummy_pdf_content), "application/pdf")
    }
    data = {
        "title": "Introduction to Vector Space",
        "course_id": course_id,
        "description": "Essential reading for vector indexing and cosine distance.",
    }

    upload_res = await client.post(
        "/api/v1/materials",
        data=data,
        files=files,
        headers=admin_headers,
    )
    assert upload_res.status_code == 201
    material = upload_res.json()
    assert material["title"] == "Introduction to Vector Space"
    material_id = material["id"]

    # 2. List materials
    list_res = await client.get("/api/v1/materials", headers=admin_headers)
    assert list_res.status_code == 200
    assert any(m["id"] == material_id for m in list_res.json())

    # 3. Download study material
    download_res = await client.get(f"/api/v1/materials/{material_id}/download", headers=admin_headers)
    assert download_res.status_code == 200
    assert b"%PDF-1.4" in download_res.content
