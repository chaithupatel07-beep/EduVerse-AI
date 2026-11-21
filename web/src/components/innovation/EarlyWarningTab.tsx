import React, { useState, useEffect } from 'react';
import innovationService, {
  EarlyWarningAlert,
  InterventionRecord,
  StudentEarlyWarningSummary,
} from '../../services/innovationService';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Users,
  MessageSquare,
} from 'lucide-react';

export const EarlyWarningTab: React.FC = () => {
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<EarlyWarningAlert | null>(null);
  const [studentSummary, setStudentSummary] = useState<StudentEarlyWarningSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Intervention Creation Modal
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState('remedial_session');
  const [actionNotes, setActionNotes] = useState('Scheduled small-group targeted practice session.');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Status Update State
  const [statusUpdateActionId, setStatusUpdateActionId] = useState<string | null>(null);
  const [outcomeEval, setOutcomeEval] = useState('improved');
  const [outcomeNotes, setOutcomeNotes] = useState('Student demonstrated clear conceptual mastery in follow-up.');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await innovationService.listEarlyWarningAlerts();
      setAlerts(data);
      if (data.length > 0) {
        handleSelectAlert(data[0]);
      }
    } catch (e) {
      console.error('Failed to load early warning alerts', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlert = async (alert: EarlyWarningAlert) => {
    setSelectedAlert(alert);
    try {
      const summary = await innovationService.getStudentInterventionSummary(alert.student_id);
      setStudentSummary(summary);
    } catch (e) {
      console.error('Failed to load student intervention summary', e);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsSubmittingAction(true);
    try {
      await innovationService.createInterventionAction({
        alert_id: selectedAlert.id,
        student_id: selectedAlert.student_id,
        action_type: actionType,
        notes: actionNotes,
      });
      setShowActionModal(false);
      // Reload summary
      const summary = await innovationService.getStudentInterventionSummary(selectedAlert.student_id);
      setStudentSummary(summary);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create intervention action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateStatus = async (actionId: string) => {
    setIsUpdatingStatus(true);
    try {
      await innovationService.updateInterventionStatus(actionId, {
        status: 'completed',
        outcome_evaluation: outcomeEval,
        notes: outcomeNotes,
      });
      setStatusUpdateActionId(null);
      if (selectedAlert) {
        const summary = await innovationService.getStudentInterventionSummary(selectedAlert.student_id);
        setStudentSummary(summary);
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update intervention status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-rose-800 via-purple-900 to-slate-900 text-white shadow-xl gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2">
            <ShieldAlert size={14} className="text-rose-300" />
            <span>Phase 6.5 Intelligent Early-Warning & Intervention System</span>
          </div>
          <h2 className="text-2xl font-black">Early-Warning & Intervention Support</h2>
          <p className="text-rose-100 text-xs mt-1 max-w-xl">
            Detects students requiring academic revision or attendance guidance through verifiable
            telemetry, facilitates targeted teacher interventions, and generates supportive multilingual
            parent advice.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/20"
        >
          Refresh Alerts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Risk Alerts ({alerts.length})
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Scanning telemetry...</p>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No at-risk students detected. Telemetry is within optimal thresholds!
            </div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                onClick={() => handleSelectAlert(alt)}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                  selectedAlert?.id === alt.id
                    ? 'border-rose-500 bg-rose-50/40 shadow-sm ring-1 ring-rose-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${getRiskBadge(
                      alt.risk_level
                    )}`}
                  >
                    {alt.risk_level} Risk
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {alt.alert_category.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{alt.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {alt.evidence_summary}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Alert Detail, Action Scheduler, Parent Advice */}
        {selectedAlert ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Detail Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${getRiskBadge(
                      selectedAlert.risk_level
                    )}`}
                  >
                    {selectedAlert.risk_level} Risk • {selectedAlert.alert_category}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-1">{selectedAlert.title}</h3>
                </div>

                <button
                  onClick={() => setShowActionModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  <span>Assign Intervention</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-800">Verifiable Telemetry Evidence:</p>
                  <p className="text-slate-600 leading-relaxed">{selectedAlert.evidence_summary}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <p className="font-bold text-indigo-950">Recommended Academic Intervention:</p>
                  <p className="text-indigo-800 leading-relaxed">
                    {selectedAlert.recommended_intervention}
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Multilingual Supportive Advice */}
            {studentSummary && studentSummary.parent_supportive_advice && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users size={16} className="text-indigo-600" />
                  <span>Personalized Supportive Advice for Parents (EN / TE / HI)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Constructive, non-punitive guidance dispatched to the linked parent dashboard to reinforce
                  home study habits.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">English</span>
                    <p className="text-slate-800 leading-relaxed">
                      {studentSummary.parent_supportive_advice.en}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Telugu (తెలుగు)</span>
                    <p className="text-slate-900 leading-relaxed font-telugu">
                      {studentSummary.parent_supportive_advice.te}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Hindi (हिंदी)</span>
                    <p className="text-slate-900 leading-relaxed">
                      {studentSummary.parent_supportive_advice.hi}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recorded Interventions & Progress Outcomes */}
            {studentSummary && studentSummary.recent_interventions && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Recorded Intervention History ({studentSummary.recent_interventions.length})
                </h4>

                {studentSummary.recent_interventions.length === 0 ? (
                  <p className="text-xs text-slate-400">No intervention actions scheduled yet.</p>
                ) : (
                  <div className="space-y-3">
                    {studentSummary.recent_interventions.map((action) => (
                      <div
                        key={action.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 capitalize">
                              {action.action_type.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                action.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {action.status}
                            </span>
                          </div>
                          <p className="text-slate-600">{action.notes || 'No notes provided.'}</p>
                          {action.outcome_evaluation && (
                            <p className="text-emerald-700 font-semibold text-[11px]">
                              Outcome: {action.outcome_evaluation}
                            </p>
                          )}
                        </div>

                        {action.status !== 'completed' && (
                          <button
                            onClick={() => setStatusUpdateActionId(action.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            Select an active early-warning alert on the left to review details and schedule interventions.
          </div>
        )}
      </div>

      {/* Assign Intervention Modal */}
      {showActionModal && selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calendar size={16} className="text-rose-600" />
                Schedule Academic Intervention
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Intervention Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none capitalize"
                >
                  <option value="remedial_session">1-on-1 Remedial Session</option>
                  <option value="parent_conference">Parent-Teacher Conference</option>
                  <option value="adaptive_assignment">Targeted Adaptive Practice Set</option>
                  <option value="academic_advisory">Academic Advisory Check-in</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Intervention Notes / Plan
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5"
                >
                  {isSubmittingAction ? 'Scheduling...' : 'Confirm Intervention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Intervention Modal */}
      {statusUpdateActionId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Record Intervention Outcome
              </h3>
              <button
                onClick={() => setStatusUpdateActionId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Outcome</label>
                <select
                  value={outcomeEval}
                  onChange={(e) => setOutcomeEval(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none capitalize"
                >
                  <option value="improved">Significantly Improved</option>
                  <option value="stabilized">Performance Stabilized</option>
                  <option value="needs_followup">Needs Follow-up Session</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Outcome Evaluation Notes</label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusUpdateActionId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus(statusUpdateActionId)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                >
                  {isUpdatingStatus ? 'Recording...' : 'Save Outcome'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarlyWarningTab;
