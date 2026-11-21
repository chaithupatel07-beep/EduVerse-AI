import React, { useState, useEffect } from 'react';
import innovationService, {
  MockExam,
  ExamAttempt,
  CreateExamRequest,
} from '../../services/innovationService';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const ExamSimulatorTab: React.FC = () => {
  const [exams, setExams] = useState<MockExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<ExamAttempt | null>(null);

  // New Exam Form
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [formSubject, setFormSubject] = useState('Physics');
  const [formTopic, setFormTopic] = useState('Kinematics & Newton Laws');
  const [formNumQuestions, setFormNumQuestions] = useState(5);
  const [formDuration, setFormDuration] = useState(20);
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard' | 'adaptive'>('medium');
  const [formLanguage, setFormLanguage] = useState('en');

  useEffect(() => {
    loadExams();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!activeAttempt || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAttempt, remainingSeconds]);

  const loadExams = async () => {
    try {
      const data = await innovationService.getMyExams();
      setExams(data);
    } catch (e) {
      console.error('Failed to load mock exams', e);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const req: CreateExamRequest = {
        title: `${formSubject}: ${formTopic} Mock Exam`,
        subject: formSubject,
        chapter_or_topic: formTopic,
        num_questions: formNumQuestions,
        total_marks: formNumQuestions * 5,
        duration_minutes: formDuration,
        difficulty: formDifficulty,
        question_types: ['multiple_choice', 'true_false', 'short_answer'],
        language: formLanguage,
      };
      const created = await innovationService.generateMockExam(req);
      setExams((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setSelectedExam(created);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate mock exam.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartExam = async (exam: MockExam) => {
    try {
      const details = await innovationService.getExamDetails(exam.id);
      setSelectedExam(details);
      const attempt = await innovationService.startExamAttempt(exam.id);
      setActiveAttempt(attempt);
      setRemainingSeconds(details.duration_minutes * 60);
      setCurrentQuestionIdx(0);
      setUserAnswers({});
      setExamResult(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to start examination.');
    }
  };

  const handleSubmitAttempt = async () => {
    if (!activeAttempt || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qid, ans]) => ({
        question_id: qid,
        student_answer: ans,
      }));
      const timeSpent = (selectedExam?.duration_minutes || 20) * 60 - remainingSeconds;
      const res = await innovationService.submitExamAttempt(
        activeAttempt.id,
        formattedAnswers,
        Math.max(10, timeSpent)
      );
      setExamResult(res);
      setActiveAttempt(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit examination attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render Active Exam View
  if (activeAttempt && selectedExam && selectedExam.questions) {
    const currentQ = selectedExam.questions[currentQuestionIdx];
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Live Mock Examination
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">{selectedExam.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-mono font-bold text-sm border border-amber-200">
              <Clock size={16} className="text-amber-600" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
            <button
              onClick={handleSubmitAttempt}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>

        {/* Question Area */}
        {currentQ && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Question {currentQuestionIdx + 1} of {selectedExam.questions.length}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {currentQ.marks} Marks • {currentQ.question_type.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-medium text-sm leading-relaxed">
              {currentQ.question_text}
            </div>

            {/* Answer Options / Text */}
            {currentQ.question_type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, oIdx) => {
                  const optChar = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
                  const isSelected = userAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {optChar}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.question_type === 'true_false' && (
              <div className="grid grid-cols-2 gap-3">
                {['True', 'False'].map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: choice }))}
                    className={`p-4 rounded-xl border text-xs font-bold transition text-center ${
                      userAnswers[currentQ.id] === choice
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {(currentQ.question_type === 'short_answer' || currentQ.question_type === 'descriptive') && (
              <div>
                <textarea
                  rows={4}
                  value={userAnswers[currentQ.id] || ''}
                  onChange={(e) =>
                    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                  }
                  placeholder="Type your structured solution or answer here..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Question Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
          >
            Previous
          </button>

          <div className="flex gap-1.5">
            {selectedExam.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  currentQuestionIdx === idx
                    ? 'bg-indigo-600 text-white'
                    : userAnswers[q.id]
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentQuestionIdx === selectedExam.questions.length - 1}
            onClick={() => setCurrentQuestionIdx((prev) => Math.min(selectedExam.questions!.length - 1, prev + 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Render Evaluation Result View
  if (examResult) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Automated Evaluation Complete
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">Examination Scorecard</h2>
          </div>
          <button
            onClick={() => {
              setExamResult(null);
              loadExams();
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Back to Exams
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
            <p className="text-xs text-indigo-600 font-semibold">Total Score</p>
            <p className="text-3xl font-black text-indigo-950 mt-1">
              {examResult.score} / {examResult.max_score}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
            <p className="text-xs text-emerald-600 font-semibold">Percentage</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{examResult.percentage}%</p>
          </div>
          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
            <p className="text-xs text-purple-600 font-semibold">Result Status</p>
            <p
              className={`text-2xl font-black mt-1 ${
                examResult.passed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {examResult.passed ? 'PASSED (Proficient)' : 'NEEDS REVISION'}
            </p>
          </div>
        </div>

        {examResult.topic_breakdown && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Topic Mastery Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(examResult.topic_breakdown).map(([topic, pct]) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{topic}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-900 text-white shadow-lg gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Phase 6.5 AI Smart Examination Simulator</span>
          </div>
          <h2 className="text-2xl font-black">AI Mock Examination Simulator</h2>
          <p className="text-blue-100 text-xs mt-1 max-w-xl">
            Generate customized practice examinations with instant automated grading, time-management
            simulation, and detailed topic mastery diagnostics.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Sparkles size={14} />
          <span>Create New Mock Exam</span>
        </button>
      </div>

      {/* Available Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200">
            <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No mock examinations generated yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Create New Mock Exam" to configure your first simulation.
            </p>
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 uppercase">
                    {exam.subject}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {exam.duration_minutes} min
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{exam.title}</h4>
                <p className="text-xs text-slate-500 mt-1">Topic: {exam.chapter_or_topic}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2 font-medium">
                  <span>{exam.num_questions} Questions</span>
                  <span>•</span>
                  <span>{exam.total_marks} Marks</span>
                  <span>•</span>
                  <span className="capitalize">{exam.difficulty}</span>
                </div>
              </div>

              <button
                onClick={() => handleStartExam(exam)}
                className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play size={13} />
                <span>Start Timed Exam</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                Configure Mock Examination
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chapter or Topic</label>
                <input
                  type="text"
                  required
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Questions</label>
                  <select
                    value={formNumQuestions}
                    onChange={(e) => setFormNumQuestions(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value={3}>3 Questions (Quick Sprint)</option>
                    <option value={5}>5 Questions (Standard Practice)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none capitalize"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="adaptive">Adaptive</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Language</label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="en">English</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5"
                >
                  {isGenerating ? 'Generating Exam...' : 'Generate Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSimulatorTab;
