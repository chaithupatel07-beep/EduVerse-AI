import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { Server, Database, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  version: string;
  database: {
    status: string;
    dialect: string;
  };
  uptime_seconds?: number;
}

export const ConnectionStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const response = await apiClient.get<HealthData>('/health');
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      setHealth(response.data);
    } catch (err: any) {
      setError(err.message || 'Cannot reach FastAPI backend server');
      setHealth(null);
      setLatency(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Live Backend Connectivity</h3>
        </div>
        <button
          onClick={checkConnection}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="Re-ping Backend"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading && !health && !error && (
        <div className="py-4 text-center text-xs text-slate-500">
          Pinging FastAPI server at <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">/api/v1/health</code>...
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Backend Offline or Unreachable</p>
            <p className="text-[11px] text-red-600/90 mt-0.5">{error}</p>
            <p className="text-[10px] text-slate-500 mt-1">Run: <code className="font-mono bg-white px-1 rounded">py -3.13 main.py</code> inside <code className="font-mono bg-white px-1 rounded">backend/</code></p>
          </div>
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Server status */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Server size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-800">FastAPI API v1</p>
                <p className="text-[10px] text-slate-500">Port 8000 • {latency ? `${latency}ms latency` : 'Connected'}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={11} />
              ONLINE
            </span>
          </div>

          {/* Database status */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Database Engine</p>
                <p className="text-[10px] text-slate-500">
                  Dialect: <span className="font-semibold uppercase">{health.database?.dialect || 'SQL'}</span>
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              health.database?.status === 'connected'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              <CheckCircle2 size={11} />
              {health.database?.status === 'connected' ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
