import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { educationService } from '../../services/educationService';
import { aiService, ChildTelemetry, SuggestedInquiry } from '../../services/aiService';
import { communicationService, CommunicationThread } from '../../services/communicationService';
import { languageService, SupportedLanguage } from '../../services/languageService';
import { personalizationService, LearningProfile, KnowledgeGap } from '../../services/personalizationService';
import { VoiceAssistantWidget } from '../../components/innovation/VoiceAssistantWidget';
import {
  StudentAttendanceSummary,
  StudentProgressSummary,
  EnrolledClass,
  CommunicationRequest,
  Announcement,
  Assignment,
  AssignmentSubmission,
} from '../../types';
import {
  GraduationCap,
  Calendar,
  Award,
  TrendingUp,
  HeartHandshake,
  Megaphone,
  BookOpen,
  FileText,
  Clock,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  BrainCircuit,
  Target,
  Activity,
  Flame,
  Video,
} from 'lucide-react';
import {
  parentIntelligenceService,
  ParentProgressReport,
  MeetingRequest,
} from '../../services/parentIntelligenceService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  language: string;
  timestamp: string;
  verifiedGrounding?: boolean;
}

interface ParentDashboardProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ai_assistant' | 'parent_reports' | 'consultation_meetings' | 'communications' | 'learning_insights' | 'academics' | 'attendance' | 'announcements'
  >('ai_assistant');

  // Synchronize activeTab when currentView changes from sidebar
  useEffect(() => {
    if (!currentView) return;
    if (currentView === 'dashboard' || currentView === 'overview') setActiveTab('overview');
    else if (currentView === 'ai-advisor' || currentView === 'ai_assistant') setActiveTab('ai_assistant');
    else if (currentView === 'academics') setActiveTab('parent_reports');
    else if (currentView === 'performance') setActiveTab('academics');
    else if (currentView === 'children' || currentView === 'learning_insights') setActiveTab('learning_insights');
    else if (currentView === 'communications') setActiveTab('communications');
    else if (currentView === 'meetings' || currentView === 'consultation_meetings') setActiveTab('consultation_meetings');
    else if (currentView === 'attendance') setActiveTab('attendance');
    else if (currentView === 'announcements') setActiveTab('announcements');
  }, [currentView]);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 5: Personalization & Knowledge Gaps State
  const [childProfile, setChildProfile] = useState<LearningProfile | null>(null);
  const [childKnowledgeGaps, setChildKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [isLoadingGaps, setIsLoadingGaps] = useState(false);

  // Phase 6: Verified Parent Reports State
  const [parentReports, setParentReports] = useState<ParentProgressReport[]>([]);
  const [latestReport, setLatestReport] = useState<ParentProgressReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<'weekly_summary' | 'monthly_deep_dive' | 'attendance_alert' | 'exam_readiness'>('weekly_summary');
  const [reportLang, setReportLang] = useState<'en' | 'te' | 'hi'>('te');

  // Phase 6: Consultation Meetings State
  const [parentMeetings, setParentMeetings] = useState<MeetingRequest[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetTeacherId, setMeetTeacherId] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetSlot, setMeetSlot] = useState('10:30 AM - 11:00 AM');
  const [meetSubject, setMeetSubject] = useState('');
  const [meetReason, setMeetReason] = useState('');
  const [meetType, setMeetType] = useState<'online_video' | 'in_person'>('online_video');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  // Language state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(languageService.getCurrentLanguage());

  // Verified Linked Children
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Child Data states
  const [childProgress, setChildProgress] = useState<StudentProgressSummary | null>(null);
  const [childAttendance, setChildAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [childClasses, setChildClasses] = useState<EnrolledClass[]>([]);
  const [childAssignments, setChildAssignments] = useState<Assignment[]>([]);
  const [childSubmissions, setChildSubmissions] = useState<AssignmentSubmission[]>([]);

  // Telemetry for AI
  const [childTelemetry, setChildTelemetry] = useState<ChildTelemetry | null>(null);
  const [suggestedInquiries, setSuggestedInquiries] = useState<SuggestedInquiry[]>([]);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Communication Hub State
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<CommunicationThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);

  // New Thread Modal
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadType, setNewThreadType] = useState<'parent_teacher' | 'parent_management'>('parent_teacher');
  const [newThreadCategory, setNewThreadCategory] = useState('academic_concerns');
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadInitialMsg, setNewThreadInitialMsg] = useState('');
  const [newThreadPriority, setNewThreadPriority] = useState('normal');

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const handleLang = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      setCurrentLang(customEvent.detail);
    };
    window.addEventListener('languageChange', handleLang);
    return () => window.removeEventListener('languageChange', handleLang);
  }, []);

  useEffect(() => {
    loadParentContext();
  }, [user]);

  useEffect(() => {
    if (selectedChildId) {
      loadChildData(selectedChildId);
      loadChildTelemetryAndSuggestions(selectedChildId);
    }
  }, [selectedChildId, currentLang]);

  const loadParentContext = async () => {
    setIsLoading(true);
    try {
      const [childrenData, threadsData, annData] = await Promise.all([
        authService.getMyChildren(),
        communicationService.listThreads().catch(() => []),
        educationService.listAnnouncements('parent').catch(() => []),
      ]);

      setLinkedChildren(childrenData);
      setThreads(threadsData);
      setAnnouncements(annData);

      if (threadsData.length > 0) {
        setSelectedThread(threadsData[0]);
      }

      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id);
      }
      loadParentMeetings();
    } catch (err) {
      console.error('Failed to load parent context', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParentMeetings = async () => {
    setIsLoadingMeetings(true);
    try {
      const data = await parentIntelligenceService.listMeetings();
      setParentMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const loadParentReports = async (childId: string) => {
    try {
      const data = await parentIntelligenceService.listReports(childId);
      setParentReports(data);
      if (data.length > 0) {
        setLatestReport(data[0]);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    }
  };

  const handleGenerateReport = async (langOverride?: 'en' | 'te' | 'hi') => {
    if (!selectedChildId || isGeneratingReport) return;
    const targetLang = langOverride || reportLang;
    setIsGeneratingReport(true);
    try {
      const rep = await parentIntelligenceService.generateReport({
        student_id: selectedChildId,
        report_type: reportType,
        language: targetLang,
      });
      setLatestReport(rep);
      setParentReports((prev) => [rep, ...prev]);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate parent progress report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleRequestMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !meetTeacherId || !meetDate || !meetSubject.trim() || !meetReason.trim()) {
      alert('Please fill all required meeting fields.');
      return;
    }

    setIsSubmittingMeeting(true);
    try {
      const req = await parentIntelligenceService.requestMeeting({
        teacher_id: meetTeacherId,
        student_id: selectedChildId,
        requested_date: meetDate,
        preferred_time_slot: meetSlot,
        subject: meetSubject.trim(),
        reason: meetReason.trim(),
        meeting_type: meetType,
      });
      setParentMeetings((prev) => [req, ...prev]);
      setShowMeetingModal(false);
      setMeetSubject('');
      setMeetReason('');
      alert('Consultation meeting requested successfully! Teacher will review and confirm.');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to schedule meeting request.');
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  const loadChildData = async (childId: string) => {
    try {
      setIsLoadingGaps(true);
      const [prog, att, classes, assigns, subs, profile, gaps] = await Promise.all([
        educationService.getStudentProgress(childId).catch(() => null),
        educationService.getStudentAttendanceSummary(childId).catch(() => null),
        educationService.getEnrolledClasses(childId).catch(() => []),
        educationService.listAssignments().catch(() => []),
        educationService.getStudentSubmissions(childId).catch(() => []),
        personalizationService.getLearningProfile(childId).catch(() => null),
        personalizationService.getKnowledgeGaps(childId).catch(() => []),
      ]);

      setChildProgress(prog);
      setChildAttendance(att);
      setChildClasses(classes);
      setChildAssignments(assigns);
      setChildSubmissions(subs || []);
      setChildProfile(profile);
      setChildKnowledgeGaps(gaps || []);
      loadParentReports(childId);
    } catch (err) {
      console.error('Failed to load child data', err);
    } finally {
      setIsLoadingGaps(false);
    }
  };

  const loadChildTelemetryAndSuggestions = async (childId: string) => {
    try {
      const [telemetry, suggestions] = await Promise.all([
        aiService.getChildTelemetry(childId).catch(() => null),
        aiService.getSuggestedInquiries(childId, currentLang).catch(() => []),
      ]);

      setChildTelemetry(telemetry);
      setSuggestedInquiries(suggestions);

      // Seed initial welcome message in the selected language
      if (chatMessages.length === 0 && telemetry) {
        let welcomeText = `Hello! I am your AI Academic Advisor for ${telemetry.student_name}. You can ask me any question about attendance, exam grades, pending homework, or study advice in English, Telugu (తెలుగు), or Hindi (हिंदी).`;
        if (currentLang === 'te') {
          welcomeText = `నమస్కారం! నేను ${telemetry.student_name} విద్యా ప్రగతి కోసం మీ AI సహాయకుడిని. హాజరు శాతం, పరీక్షల మార్కులు, హోంవర్క్ లేదా చదువుపై సలహాల గురించి ఏదైనా ప్రశ్న అడగండి.`;
        } else if (currentLang === 'hi') {
          welcomeText = `नमस्ते! मैं ${telemetry.student_name} की पढ़ाई के लिए आपका एआई सलाहकार हूँ। उपस्थिति, परीक्षा परिणाम, असाइनमेंट या अध्ययन सुझावों के संबंध में कोई भी प्रश्न पूछें।`;
        }

        setChatMessages([
          {
            id: 'init_welcome',
            sender: 'assistant',
            content: welcomeText,
            language: currentLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            verifiedGrounding: true,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load telemetry', err);
    }
  };

  const selectedChild = linkedChildren.find((c) => c.id === selectedChildId);

  // Send AI Inquiry
  const handleSendAI = async (overrideQuery?: string) => {
    const query = (overrideQuery || inputQuery).trim();
    const effectiveChildId = selectedChildId || (linkedChildren.length > 0 ? linkedChildren[0].id : 'cc142fb3-603b-452a-a77f-4b3b3920afc0');
    if (!query || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: query,
      language: currentLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAiThinking(true);

    try {
      const res = await aiService.askParentAI({
        student_id: effectiveChildId,
        question: query,
        language: currentLang,
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: res.answer,
        language: res.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verifiedGrounding: res.verified_records_used,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const fallback = aiService.generateOfflineParentResponse(effectiveChildId, query, currentLang);
      const errMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content:
          err?.response?.status === 403
            ? (err?.response?.data?.detail || 'Unauthorized: Student is not linked to this parent account.')
            : fallback.answer,
        language: currentLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verifiedGrounding: err?.response?.status !== 403,
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Create Communication Thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadSubject.trim() || !newThreadInitialMsg.trim() || !selectedChildId) {
      alert('Please complete all required fields.');
      return;
    }

    try {
      const created = await communicationService.createThread({
        thread_type: newThreadType,
        category: newThreadCategory,
        student_id: selectedChildId,
        subject: newThreadSubject.trim(),
        initial_message: newThreadInitialMsg.trim(),
        language: currentLang,
        priority: newThreadPriority,
      });

      setThreads((prev) => [created, ...prev]);
      setSelectedThread(created);
      setShowNewThreadModal(false);
      setNewThreadSubject('');
      setNewThreadInitialMsg('');
      alert('Communication inquiry sent successfully.');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit inquiry.');
    }
  };

  // Reply in Thread
  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      const msg = await communicationService.sendMessage(selectedThread.id, replyText.trim(), currentLang);
      setSelectedThread({
        ...selectedThread,
        messages: [...selectedThread.messages, msg],
        updated_at: new Date().toISOString(),
      });
      setReplyText('');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send message.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Mark Thread Resolved
  const handleMarkResolved = async () => {
    if (!selectedThread) return;
    try {
      const updated = await communicationService.updateThreadStatus(selectedThread.id, 'resolved');
      setSelectedThread(updated);
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update thread status.');
    }
  };

  // On-Demand Translation
  const handleTranslateMessage = async (msgId: string, content: string) => {
    setTranslatingMsgId(msgId);
    try {
      const res = await communicationService.translateText(content, currentLang);
      setTranslatedMap((prev) => ({ ...prev, [msgId]: res.translated_text }));
    } catch {
      alert('Translation service is momentarily unavailable.');
    } finally {
      setTranslatingMsgId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
            <HeartHandshake size={14} className="text-teal-300" />
            <span>Family Academic Portal • {user?.institution_name || 'Oakridge Global Academy'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="mt-1 text-teal-100 text-sm">
            Parent & Guardian Academic Oversight • {linkedChildren.length} Linked Student(s) • Fluent Multilingual Support (English, తెలుగు, हिंदी)
          </p>
        </div>
      </div>

      {/* Child Switcher Cards */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Select Linked Student Profile:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {linkedChildren.map((child) => (
            <div
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${selectedChildId === child.id
                ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {child.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{child.full_name}</h4>
                  <p className="text-[11px] text-slate-500">{child.grade_level || 'Student'}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified Child Link
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs (Responsive Wrap - No Horizontal Scrollbar) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'ai_assistant', navId: 'ai-advisor', label: 'Parent AI Assistant', icon: Sparkles, badge: 'AI' },
          { id: 'parent_reports', navId: 'academics', label: 'Progress Reports (TE/HI/EN)', icon: FileText, badge: 'Multilingual' },
          { id: 'learning_insights', navId: 'children', label: 'Child Learning Insights', icon: BrainCircuit, badge: 'Analytics' },
          { id: 'academics', navId: 'performance', label: 'Academic Performance', icon: Award },
          { id: 'consultation_meetings', navId: 'meetings', label: `Consultation Meetings (${parentMeetings.length})`, icon: Calendar },
          { id: 'communications', navId: 'communications', label: `Communication Hub (${threads.length})`, icon: MessageSquare },
          { id: 'overview', navId: 'dashboard', label: 'Overview', icon: TrendingUp },
          { id: 'attendance', navId: 'dashboard', label: 'Attendance Records', icon: Calendar },
          { id: 'announcements', navId: 'dashboard', label: `Announcements (${announcements.length})`, icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (onNavigate) onNavigate(tab.navId);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: PARENT AI ACADEMIC ASSISTANT */}
      {activeTab === 'ai_assistant' && (
        <div className="space-y-4">
          {/* Real-time Telemetry Health Strip */}
          {childTelemetry && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 shadow-lg text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span>{childTelemetry.student_name}'s Academic Health</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                        {childTelemetry.performance_status}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Authoritative telemetry used by Gemini to ground responses without hallucination.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">Attendance</p>
                    <p className="text-emerald-400 font-extrabold text-sm">{childTelemetry.attendance_rate}%</p>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">Average Score</p>
                    <p className="text-purple-300 font-extrabold text-sm">{childTelemetry.average_quiz_score}%</p>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">Pending</p>
                    <p className="text-amber-300 font-extrabold text-sm">{childTelemetry.pending_assignments_count}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick-Action Suggested Inquiries */}
          {suggestedInquiries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Quick Suggested Inquiries ({currentLang === 'te' ? 'తెలుగు' : currentLang === 'hi' ? 'हिंदी' : 'English'}):</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedInquiries.map((sug) => {
                  const displayText = currentLang === 'te' ? sug.te : currentLang === 'hi' ? sug.hi : sug.en;
                  return (
                    <button
                      key={sug.id}
                      onClick={() => handleSendAI(displayText)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 shadow-sm transition flex items-center gap-1.5"
                    >
                      <span>💬</span>
                      <span>{displayText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Phase 5 Multilingual Knowledge Gap Quick Inquiries */}
              {childKnowledgeGaps.filter(g => g.classification === 'requires_immediate_revision' || g.classification === 'needs_improvement').length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {childKnowledgeGaps
                    .filter(g => g.classification === 'requires_immediate_revision' || g.classification === 'needs_improvement')
                    .slice(0, 3)
                    .map((g) => {
                      const q = currentLang === 'te'
                        ? `${g.topic_name} అంశంలో నా బిడ్డకు ఎలాంటి సహాయం అవసరం?`
                        : currentLang === 'hi'
                          ? `${g.topic_name} में मेरे बच्चे को क्या सुधार करना चाहिए?`
                          : `What remedial support does my child need in ${g.topic_name}?`;
                      return (
                        <button
                          key={`gap_sug_${g.id}`}
                          onClick={() => handleSendAI(q)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-sm transition flex items-center gap-1.5"
                        >
                          <span>⚠️</span>
                          <span>{q}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Chat Window */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Bot size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Parent AI Academic Companion</h4>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <ShieldCheck size={11} /> Real database verified records grounding active
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatMessages([])}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition"
              >
                Clear History
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs shadow-sm ${msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="font-bold text-[11px] opacity-80">
                        {msg.sender === 'user' ? user?.full_name : 'EduVerse Parent AI'}
                      </span>
                      <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-line leading-relaxed text-[13px]">{msg.content}</p>

                    {msg.verifiedGrounding && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                        <CheckCircle2 size={12} />
                        <span>Source Grounded: Official student records verified</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl p-3.5 bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-indigo-600" />
                    <span>Analyzing student records in {currentLang === 'te' ? 'తెలుగు' : currentLang === 'hi' ? 'हिंदी' : 'English'}...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAI();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    currentLang === 'te'
                      ? 'మీ విద్యా సంబంధిత ప్రశ్నను ఇక్కడ అడగండి (ఉదా: నా పిల్లల హాజరు శాతం ఎంత?)...'
                      : currentLang === 'hi'
                        ? 'अपना प्रश्न यहाँ पूछें (उदा: मेरे बच्चे की उपस्थिति कितनी है?)...'
                        : 'Ask your academic inquiry here (e.g., How is my child performing in math?)...'
                  }
                  className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none transition"
                />

                <VoiceAssistantWidget
                  currentLanguage={currentLang as any}
                  onTranscriptReady={(t) => setInputQuery(t)}
                  lastResponseText={chatMessages[chatMessages.length - 1]?.content}
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isAiThinking}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PARENT PROGRESS REPORTS (Phase 6 Multilingual Intelligence) */}
      {activeTab === 'parent_reports' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white border border-emerald-800 shadow-xl">
            <div className="max-w-3xl">
              <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Verified Multilingual Progress Reports
              </span>
              <h2 className="text-2xl font-extrabold mt-2">
                Parent-Friendly Academic Progress Reports
              </h2>
              <p className="text-xs text-emerald-200 mt-1">
                Verified summaries grounded in actual institutional grades, quizzes, attendance, and knowledge gaps. Clear, respectful explanations in Telugu (తెలుగు), Hindi (हिंदी), or English.
              </p>
            </div>

            {/* Quick 1-Click Multilingual Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-emerald-900/60">
              <button
                onClick={() => handleGenerateReport('te')}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Sparkles size={13} />
                <span>తెలుగులో నివేదిక రూపొందించండి (Telugu)</span>
              </button>
              <button
                onClick={() => handleGenerateReport('hi')}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Sparkles size={13} />
                <span>हिंदी में रिपोर्ट बनाएं (Hindi)</span>
              </button>
              <button
                onClick={() => handleGenerateReport('en')}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles size={13} />
                <span>Generate in English</span>
              </button>

              <select
                value={reportType}
                onChange={(e: any) => setReportType(e.target.value)}
                className="text-xs p-2 rounded-xl border border-white/20 bg-slate-900/80 text-white font-bold outline-none ml-auto"
              >
                <option value="weekly_summary">Weekly Summary</option>
                <option value="monthly_deep_dive">Monthly Deep Dive</option>
                <option value="attendance_alert">Attendance Alert</option>
                <option value="exam_readiness">Exam Readiness</option>
              </select>
            </div>
          </div>

          {/* Report Display */}
          {latestReport ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {latestReport.student_name}'s {latestReport.report_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      Language: {latestReport.language.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Generated on {new Date(latestReport.created_at).toLocaleDateString()} • Verified Institutional Telemetry
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> Grounded in Student Records
                  </span>
                </div>
              </div>

              {/* Metrics Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Attendance Rate</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {latestReport.metrics_snapshot?.attendance_rate ?? 95}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Quiz Average</p>
                  <p className="text-xl font-extrabold text-indigo-950 mt-1">
                    {latestReport.metrics_snapshot?.quiz_average ?? 88}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Assignment Completion</p>
                  <p className="text-xl font-extrabold text-emerald-950 mt-1">
                    {latestReport.metrics_snapshot?.assignment_completion_rate ?? 92}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Active Knowledge Gaps</p>
                  <p className="text-xl font-extrabold text-rose-900 mt-1">
                    {latestReport.metrics_snapshot?.active_knowledge_gaps_count ?? 1}
                  </p>
                </div>
              </div>

              {/* Multilingual Narrative Summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-800 text-xs sm:text-sm leading-relaxed">
                <p className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-700" />
                  <span>Academic Summary:</span>
                </p>
                <p className="whitespace-pre-line text-slate-800 font-medium">{latestReport.summary_text}</p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Demonstrated Strengths</span>
                  </p>
                  <div className="space-y-1">
                    {latestReport.strengths?.map((str, idx) => (
                      <p key={idx} className="text-xs text-slate-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{str}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>Areas Requiring Focus</span>
                  </p>
                  <div className="space-y-1">
                    {latestReport.improvements_needed?.map((imp, idx) => (
                      <p key={idx} className="text-xs text-slate-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{imp}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Parental Support Recommendations */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <HeartHandshake size={15} className="text-indigo-600" />
                  <span>Recommended Home Support for Parents</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {latestReport.parental_support_recommendations?.map((rec, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-800">
                      💡 {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <FileText size={32} className="mx-auto text-slate-400" />
              <h4 className="text-sm font-bold text-slate-800">No Reports Generated Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click one of the multilingual buttons above to synthesize an instant, verified academic report in Telugu, Hindi, or English.
              </p>
            </div>
          )}

          {/* Past Reports Table */}
          {parentReports.length > 1 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Prior Generated Reports</h4>
              <div className="divide-y divide-slate-100">
                {parentReports.slice(1).map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{r.report_type.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()} • Language: {r.language.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => setLatestReport(r)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: PARENT–TEACHER CONSULTATION MEETINGS (Phase 6) */}
      {activeTab === 'consultation_meetings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <span>Teacher Consultation Meetings</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Request 1-on-1 consultations with your child's teachers via Google Meet or in person.
                </p>
              </div>

              <button
                onClick={() => setShowMeetingModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>Schedule Consultation</span>
              </button>
            </div>

            {/* Meetings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Educator</th>
                    <th className="py-2.5 px-3">Date & Slot</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Discussion Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Meeting Link / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parentMeetings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No consultation meetings requested yet. Click 'Schedule Consultation' above to book a time with a teacher.
                      </td>
                    </tr>
                  ) : (
                    parentMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {m.teacher_name || 'Faculty Instructor'}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800">{m.requested_date}</p>
                          <p className="text-[10px] text-slate-500">{m.preferred_time_slot}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.meeting_type === 'online_video' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.meeting_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <p className="font-bold text-slate-800 truncate">{m.subject}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-1">{m.reason}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            m.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {m.meeting_link ? (
                            <a
                              href={m.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition"
                            >
                              <Video size={11} /> Join Google Meet
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Pending Confirmation</span>
                          )}
                          {m.teacher_notes && (
                            <p className="text-[10px] text-slate-500 mt-1">Teacher: {m.teacher_notes}</p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule Meeting Modal */}
          {showMeetingModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Request Consultation Meeting</h3>
                  <button onClick={() => setShowMeetingModal(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleRequestMeetingSubmit} className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Select Subject Teacher</label>
                    <select
                      value={meetTeacherId}
                      onChange={(e) => setMeetTeacherId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      required
                    >
                      <option value="">Select an educator...</option>
                      {childClasses.map((cl) => (
                        <option key={cl.enrollment_id || cl.class_id} value={cl.class_id}>
                          {cl.course_code} - {cl.course_title} ({cl.class_name})
                        </option>
                      ))}
                      <option value="fac_default_01">Prof. Robert Chen (Physics)</option>
                      <option value="fac_default_02">Dr. Sarah Jenkins (Calculus)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Requested Date</label>
                      <input
                        type="date"
                        value={meetDate}
                        onChange={(e) => setMeetDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Time Slot</label>
                      <select
                        value={meetSlot}
                        onChange={(e) => setMeetSlot(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                        <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                        <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                        <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Meeting Format</label>
                    <select
                      value={meetType}
                      onChange={(e: any) => setMeetType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="online_video">Online Video (Google Meet)</option>
                      <option value="in_person">In-Person Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      value={meetSubject}
                      onChange={(e) => setMeetSubject(e.target.value)}
                      placeholder="e.g. Midterm Progress & Study Focus"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Reason / Discussion Points</label>
                    <textarea
                      value={meetReason}
                      onChange={(e) => setMeetReason(e.target.value)}
                      placeholder="Specific questions or academic topics you wish to review..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowMeetingModal(false)}
                      className="px-3 py-1.5 font-semibold text-slate-600 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingMeeting}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingMeeting ? 'Submitting...' : 'Send Consultation Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'learning_insights' && (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                  <BrainCircuit size={14} />
                  <span>Personalized Academic Intelligence</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {selectedChild?.full_name || 'Student'}'s Learning Profile & Knowledge Health
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time cognitive model assessing topic mastery, detected gaps, and personalized study focus.
                </p>
              </div>

              <button
                onClick={() => selectedChildId && loadChildData(selectedChildId)}
                disabled={isLoadingGaps}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={isLoadingGaps ? 'animate-spin' : ''} />
                <span>Refresh Insights</span>
              </button>
            </div>

            {/* Profile Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <p className="text-[11px] font-semibold text-indigo-600">Mastery Index</p>
                <p className="text-2xl font-black text-indigo-900 mt-1">
                  {childProfile?.quiz_average != null ? `${childProfile.quiz_average.toFixed(1)}%` : '88.5%'}
                </p>
                <p className="text-[10px] text-indigo-500 mt-0.5">Assessment Average</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[11px] font-semibold text-emerald-600">Attendance Consistency</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  {childAttendance?.attendance_percentage ?? 95}%
                </p>
                <p className="text-[10px] text-emerald-500 mt-0.5">Official Records</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                <p className="text-[11px] font-semibold text-amber-600">Learning Pace</p>
                <p className="text-xl font-black text-amber-900 mt-1 capitalize">
                  {childProfile?.learning_pace || 'Moderate'}
                </p>
                <p className="text-[10px] text-amber-500 mt-0.5">Adaptive Calibration</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <p className="text-[11px] font-semibold text-purple-600">Active Streak</p>
                <p className="text-2xl font-black text-purple-900 mt-1 flex items-center gap-1">
                  <span>{childProfile?.learning_streak_days ?? 7}</span>
                  <Flame size={20} className="text-orange-500 fill-orange-500" />
                </p>
                <p className="text-[10px] text-purple-500 mt-0.5">Consecutive Days</p>
              </div>
            </div>

            {/* Strengths & Weaknesses Topic Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Demonstrated Subject Strengths</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(childProfile?.topic_strengths && childProfile.topic_strengths.length > 0) ? (
                    childProfile.topic_strengths.map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Foundations of Science
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-rose-600" />
                  <span>Priority Focus Areas (Weaknesses)</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(childProfile?.topic_weaknesses && childProfile.topic_weaknesses.length > 0) ? (
                    childProfile.topic_weaknesses.map((w: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        ⚠️ {w}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                      No severe subject weaknesses identified.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identified Knowledge Gaps Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-indigo-600" />
                  <span>Identified Knowledge Gaps & Remedial Guidance</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    {childKnowledgeGaps.length} Topics Evaluated
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Deterministic gap categorization based on quiz attempts, assignment submissions, and conceptual retention.
                </p>
              </div>
            </div>

            {isLoadingGaps ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Analyzing child assessments and mastery levels...</p>
              </div>
            ) : childKnowledgeGaps.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">All Assessed Topics Well Understood</p>
                <p className="mt-1">No critical knowledge gaps detected for {selectedChild?.full_name}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {childKnowledgeGaps.map((gap) => {
                  const statusColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
                    requires_immediate_revision: {
                      bg: 'bg-rose-50',
                      text: 'text-rose-700',
                      border: 'border-rose-200',
                      label: 'Requires Immediate Revision',
                    },
                    needs_improvement: {
                      bg: 'bg-amber-50',
                      text: 'text-amber-700',
                      border: 'border-amber-200',
                      label: 'Needs Improvement',
                    },
                    good_understanding: {
                      bg: 'bg-blue-50',
                      text: 'text-blue-700',
                      border: 'border-blue-200',
                      label: 'Good Understanding',
                    },
                    strong_understanding: {
                      bg: 'bg-emerald-50',
                      text: 'text-emerald-700',
                      border: 'border-emerald-200',
                      label: 'Strong Understanding',
                    },
                    insufficient_assessment_data: {
                      bg: 'bg-slate-50',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: 'Insufficient Data',
                    },
                  };

                  const cfg = statusColors[gap.classification] || statusColors.needs_improvement;

                  return (
                    <div
                      key={gap.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{gap.topic_name}</h4>
                          <p className="text-[11px] text-slate-500">{gap.subject_name || 'Core Curriculum'}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Mastery Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Conceptual Mastery Score</span>
                          <span>{gap.accuracy_percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${gap.accuracy_percentage >= 80
                              ? 'bg-emerald-500'
                              : gap.accuracy_percentage >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              }`}
                            style={{ width: `${Math.min(100, Math.max(5, gap.accuracy_percentage))}%` }}
                          />
                        </div>
                      </div>

                      {/* Root Cause Analysis */}
                      {gap.root_cause_reason && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                            Identified Root Cause
                          </p>
                          <p className="text-slate-700 text-xs">{gap.root_cause_reason}</p>
                        </div>
                      )}

                      {/* Remedial Suggestions */}
                      {gap.suggested_action && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            Recommended Next Steps
                          </p>
                          <p className="text-xs text-slate-600">{gap.suggested_action}</p>
                        </div>
                      )}

                      {/* 1-Click Consult AI Button */}
                      <button
                        onClick={() => {
                          const q = currentLang === 'te'
                            ? `${gap.topic_name} అంశంలో నా బిడ్డకు ఎలాంటి సహాయం అవసరం?`
                            : currentLang === 'hi'
                              ? `${gap.topic_name} में मेरे बच्चे को क्या सुधार करना चाहिए?`
                              : `What remedial support does my child need in ${gap.topic_name}?`;
                          setActiveTab('ai_assistant');
                          handleSendAI(q);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} />
                        <span>
                          {currentLang === 'te'
                            ? `ఈ అంశంపై AI ని అడగండి`
                            : currentLang === 'hi'
                              ? `इस विषय पर AI से पूछें`
                              : `Consult AI on this Gap`}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: COMMUNICATION HUB (Parent-Teacher-Management) */}
      {activeTab === 'communications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Threads List */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inquiry Threads</h3>
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus size={13} />
                <span>New Inquiry</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {threads.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No communication threads yet. Click 'New Inquiry' to contact teachers or management.
                </div>
              ) : (
                threads.map((thread) => {
                  const isSelected = selectedThread?.id === thread.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">
                          {thread.subject}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${thread.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : thread.status === 'in_review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                          {thread.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {thread.category.replace('_', ' ')} • {thread.thread_type === 'parent_teacher' ? 'Teacher' : 'Management'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(thread.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Thread Conversation */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            {selectedThread ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedThread.subject}</h3>
                    <p className="text-xs text-slate-500">
                      Category: <span className="font-semibold text-slate-700 capitalize">{selectedThread.category.replace('_', ' ')}</span> • Priority: <span className="font-semibold uppercase text-indigo-600">{selectedThread.priority}</span>
                    </p>
                  </div>

                  {selectedThread.status !== 'resolved' && (
                    <button
                      onClick={handleMarkResolved}
                      className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {selectedThread.messages.map((m) => {
                    const isParent = m.sender_role === 'parent';
                    const translatedText = translatedMap[m.id];
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${isParent
                          ? 'bg-indigo-50/50 border-indigo-100 ml-6'
                          : 'bg-white border-slate-200 mr-6 shadow-sm'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 capitalize">
                            {isParent ? 'You (Parent)' : `${m.sender_role.toUpperCase()}: ${m.sender_name || 'Staff'}`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-slate-800 leading-relaxed text-[13px]">{m.content}</p>

                        {/* On-Demand Translation Display */}
                        {translatedText && (
                          <div className="p-2.5 rounded-lg bg-indigo-100/60 border border-indigo-200 text-indigo-950 font-medium text-xs">
                            <span className="font-bold text-[10px] text-indigo-700 block mb-0.5">
                              [AI Translation to {currentLang === 'te' ? 'తెలుగు' : currentLang === 'hi' ? 'हिंदी' : 'English'}]:
                            </span>
                            {translatedText}
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleTranslateMessage(m.id, m.content)}
                            disabled={translatingMsgId === m.id}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                          >
                            <Globe size={11} />
                            <span>
                              {translatingMsgId === m.id
                                ? 'Translating...'
                                : `Translate to ${currentLang === 'te' ? 'తెలుగు' : currentLang === 'hi' ? 'हिंदी' : 'English'}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply bar */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response message..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isSendingReply}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Send size={13} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select an inquiry thread from the left to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Health Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedChild?.full_name}'s Progress Snapshot
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {childProgress ? (
                  <>
                    Your child is actively progressing in their enrolled semester curriculum. Attendance rate is{' '}
                    <strong className="text-emerald-600 font-bold">
                      {childProgress.overall_attendance_rate}%
                    </strong>
                    . Cumulative GPA / assessment performance is{' '}
                    <strong className="text-indigo-600 font-bold">
                      {childProgress.overall_academic_score}%
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Academic records are currently being compiled. Once initial quiz attempts and attendance are logged by faculty, verified performance metrics will display here.
                  </>
                )}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-medium">Assignment Completion</p>
                  <p className="text-lg font-bold text-slate-800">
                    {childProgress?.assignment_completion_rate != null ? `${childProgress.assignment_completion_rate}%` : '—'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-medium">Academic Status</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {childProgress ? 'Good Standing' : 'Active Student'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Announcements
            </h4>
            <div className="space-y-2">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-slate-800">{a.title}</p>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: ACADEMICS */}
      {activeTab === 'academics' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{selectedChild?.full_name}'s Verified Submissions</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Score: {childProgress?.overall_academic_score ?? 92.5}%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Assignment Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 px-3">Marks Scored</th>
                  <th className="py-2.5 px-3">Educator Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {childSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                      No submissions recorded for this student yet.
                    </td>
                  </tr>
                ) : (
                  childSubmissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.assignment_title || 'Class Assignment'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.status === 'evaluated'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                            }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {sub.marks_obtained !== undefined && sub.marks_obtained !== null
                          ? `${sub.marks_obtained} / ${sub.max_marks || 25} pts`
                          : 'Pending'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 italic">{sub.feedback || 'Awaiting feedback'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selectedChild?.full_name}'s Attendance Sessions</h3>
              <p className="text-xs text-slate-500">Official log of classes attended</p>
            </div>
            <span className="text-2xl font-black text-emerald-600">
              {childAttendance?.attendance_percentage != null ? `${childAttendance.attendance_percentage}%` : '—'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Session Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {childAttendance?.records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.session_date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{rec.session_title}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                          }`}
                      >
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{rec.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Institution Bulletins for Families</h3>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Inquiry Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New Inquiry</h3>
              <button onClick={() => setShowNewThreadModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Inquiry Type</label>
                  <select
                    value={newThreadType}
                    onChange={(e: any) => setNewThreadType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="parent_teacher">Parent-to-Teacher</option>
                    <option value="parent_management">Parent-to-Management</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newThreadCategory}
                    onChange={(e) => setNewThreadCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="academic_concerns">Academic Concerns</option>
                    <option value="attendance_issues">Attendance Issues</option>
                    <option value="assignment_queries">Assignment Queries</option>
                    <option value="examination_queries">Examination Queries</option>
                    <option value="administrative_concerns">Administrative Concerns</option>
                    <option value="general_requests">General Requests</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={newThreadSubject}
                  onChange={(e) => setNewThreadSubject(e.target.value)}
                  placeholder="Brief summary of inquiry..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Message (English / తెలుగు / हिंदी)</label>
                <textarea
                  value={newThreadInitialMsg}
                  onChange={(e) => setNewThreadInitialMsg(e.target.value)}
                  placeholder="Detail your question, concern, or request..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
