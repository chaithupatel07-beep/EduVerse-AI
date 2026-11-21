import React, { useState, useEffect } from 'react';
import innovationService, {
  ScannedDocument,
  UploadScannedDocRequest,
} from '../../services/innovationService';
import {
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Edit3,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const NotesScannerTab: React.FC = () => {
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ScannedDocument | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Upload Form
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState('Kinematics & Newton Laws Notes');
  const [uploadText, setUploadText] = useState(
    'Chapter 1: Kinematics. Acceleration is defined as the rate of change of velocity: a = dv/dt. Constant acceleration yields v = u + at and s = ut + 0.5*a*t^2. Newton second law gives F = ma.'
  );
  const [uploadLang, setUploadLang] = useState('en');

  // Text Correction State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Grounded Doubt Solver State
  const [doubtQuestion, setDoubtQuestion] = useState<string>('');
  const [doubtAnswer, setDoubtAnswer] = useState<any | null>(null);
  const [isAskingDoubt, setIsAskingDoubt] = useState<boolean>(false);

  // Note-derived Quiz State
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await innovationService.getMyScannedNotes();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
        setEditText(
          data[0].extracted_text?.user_edited_text ||
            data[0].extracted_text?.cleaned_text ||
            ''
        );
      }
    } catch (e) {
      console.error('Failed to load scanned notes', e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const req: UploadScannedDocRequest = {
        title: uploadTitle,
        file_name: `${uploadTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        document_type: 'notes',
        language: uploadLang,
        raw_text: uploadText,
      };
      const created = await innovationService.uploadScannedNote(req);
      setDocuments((prev) => [created, ...prev]);
      setSelectedDoc(created);
      setEditText(
        created.extracted_text?.user_edited_text ||
          created.extracted_text?.cleaned_text ||
          ''
      );
      setShowUploadModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to upload scanned notes.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!selectedDoc) return;
    setIsSavingEdit(true);
    try {
      const updated = await innovationService.correctScannedText(selectedDoc.id, editText);
      setSelectedDoc(updated);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setIsEditing(false);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update OCR text.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAskDoubt = async () => {
    if (!selectedDoc || !doubtQuestion.trim()) return;
    setIsAskingDoubt(true);
    setDoubtAnswer(null);
    try {
      const res = await innovationService.askDoubtOnNote(
        selectedDoc.id,
        doubtQuestion,
        selectedDoc.language || 'en'
      );
      setDoubtAnswer(res);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to resolve doubt against scanned note.');
    } finally {
      setIsAskingDoubt(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedDoc) return;
    setIsGeneratingQuiz(true);
    setGeneratedQuiz(null);
    try {
      const res = await innovationService.generateQuizFromNote(
        selectedDoc.id,
        3,
        selectedDoc.language || 'en'
      );
      setGeneratedQuiz(res);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate quiz from scanned note.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-teal-700 via-cyan-800 to-slate-900 text-white shadow-lg gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Phase 6.5 Smart Notes Scanner & Grounded Doubt Solver</span>
          </div>
          <h2 className="text-2xl font-black">Smart Notes Scanner & Doubt Solver</h2>
          <p className="text-cyan-100 text-xs mt-1 max-w-xl">
            Digitize handwritten lecture notes and study guides with OCR, verify and correct formulas,
            and resolve doubts grounded directly in your scanned materials.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 bg-white text-teal-800 hover:bg-cyan-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Upload size={14} />
          <span>Upload Scanned Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Note Browser */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Digitized Course Notes ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No scanned notes yet. Upload your first note above!
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setEditText(
                    doc.extracted_text?.user_edited_text ||
                      doc.extracted_text?.cleaned_text ||
                      ''
                  );
                  setDoubtAnswer(null);
                  setGeneratedQuiz(null);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                  selectedDoc?.id === doc.id
                    ? 'border-teal-600 bg-teal-50/50 shadow-sm ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 uppercase">
                    {doc.document_type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {doc.ocr_confidence ? `${Math.round(doc.ocr_confidence * 100)}% Confidence` : 'Verified'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {doc.extracted_text?.user_edited_text || doc.extracted_text?.cleaned_text || 'No text extracted.'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Active Note Workspace */}
        {selectedDoc ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Note Preview & OCR Correction */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedDoc.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Status: <span className="capitalize font-semibold">{selectedDoc.ocr_status}</span> •
                    Language: <span className="uppercase font-semibold">{selectedDoc.language}</span>
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 size={13} />
                  <span>{isEditing ? 'Cancel Edit' : 'Review & Correct Text'}</span>
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Edit the extracted OCR text below to fix mathematical formulas or unclear handwriting.
                  </p>
                  <textarea
                    rows={6}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-teal-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSaveCorrection}
                      disabled={isSavingEdit}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      {isSavingEdit ? 'Saving Correction...' : 'Save & Re-Index Note'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedDoc.extracted_text?.user_edited_text ||
                    selectedDoc.extracted_text?.cleaned_text ||
                    'No extracted text.'}
                </div>
              )}
            </div>

            {/* Grounded Doubt Solver */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <HelpCircle size={16} className="text-teal-600" />
                <span>Ask Doubt Grounded in This Note</span>
              </div>
              <p className="text-xs text-slate-500">
                Ask any question strictly based on your scanned lecture note. The AI responds citing the
                exact section of your notes.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={doubtQuestion}
                  onChange={(e) => setDoubtQuestion(e.target.value)}
                  placeholder="e.g., What is the formula for velocity under constant acceleration?"
                  className="flex-1 p-3 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleAskDoubt}
                  disabled={isAskingDoubt || !doubtQuestion.trim()}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isAskingDoubt ? 'Solving...' : 'Resolve Doubt'}
                </button>
              </div>

              {doubtAnswer && (
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs space-y-2">
                  <div className="flex items-center justify-between text-teal-800 font-bold">
                    <span>Grounded Explanation</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-200/60">
                      {Math.round(doubtAnswer.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{doubtAnswer.answer}</p>
                  {doubtAnswer.citations && (
                    <div className="pt-2 border-t border-teal-100 text-[10px] text-teal-700 font-medium">
                      Citations: {doubtAnswer.citations.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Note-Derived Quiz Generator */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Sparkles size={16} className="text-teal-600" />
                  <span>Generate Quick Review Quiz from Note</span>
                </div>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {isGeneratingQuiz ? 'Generating...' : 'Generate 3-Question Quiz'}
                </button>
              </div>

              {generatedQuiz && generatedQuiz.questions && (
                <div className="space-y-3 pt-2">
                  {generatedQuiz.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                      <p className="font-bold text-slate-900">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs font-medium ${
                              opt === q.correct_answer
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        Explanation: {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            Select a digitized note on the left or upload a new one to begin.
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Upload size={16} className="text-teal-600" />
                Upload Course Notes for OCR Digitize
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Language</label>
                <select
                  value={uploadLang}
                  onChange={(e) => setUploadLang(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="en">English</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Note Content / OCR Text Sample
                </label>
                <textarea
                  rows={5}
                  required
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5"
                >
                  {isUploading ? 'Digitizing OCR...' : 'Digitize & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesScannerTab;
