/**
 * EduVerse AI - Offline Study Vault & Low-Connectivity Service (Phase 6.5)
 * Caches essential academic content (scanned notes, mock exams, revision guides)
 * locally and provides an offline action synchronization queue.
 */

import api from './api';

export interface CachedVaultItem {
  id: string;
  type: 'note' | 'mock_exam' | 'timetable' | 'summary';
  title: string;
  payload: any;
  cachedAt: number;
}

export interface OfflineActionQueueItem {
  id: string;
  action: 'complete_session' | 'submit_exam';
  data: any;
  timestamp: number;
}

const VAULT_STORAGE_KEY = 'eduverse_offline_vault_v1';
const QUEUE_STORAGE_KEY = 'eduverse_offline_action_queue_v1';

class OfflineVaultService {
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineStatus = true;
        this.processSyncQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnlineStatus = false;
      });
    }
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Cache academic material into the Offline Study Vault
   */
  public saveItem(item: Omit<CachedVaultItem, 'cachedAt'>): void {
    if (typeof window === 'undefined') return;
    try {
      const items = this.getAllItems();
      const existingIdx = items.findIndex((i) => i.id === item.id);
      const vaultItem: CachedVaultItem = { ...item, cachedAt: Date.now() };

      if (existingIdx >= 0) {
        items[existingIdx] = vaultItem;
      } else {
        items.unshift(vaultItem);
      }

      // Limit to 30 most recent items to avoid quota limits
      const trimmed = items.slice(0, 30);
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save to Offline Vault:', e);
    }
  }

  /**
   * Retrieve all items currently saved in the offline vault
   */
  public getAllItems(): CachedVaultItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Enqueue an action when student is offline
   */
  public queueAction(action: OfflineActionQueueItem['action'], data: any): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getQueue();
      queue.push({
        id: `offline_action_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        action,
        data,
        timestamp: Date.now(),
      });
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to enqueue offline action:', e);
    }
  }

  public getQueue(): OfflineActionQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sync queued actions once internet connectivity is restored
   */
  public async processSyncQueue(): Promise<number> {
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    let processed = 0;
    const remaining: OfflineActionQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.action === 'complete_session' && item.data?.session_id) {
          await api.patch(`/scheduling/sessions/${item.data.session_id}/complete`);
          processed++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        // Keep in queue for next sync attempt
        remaining.push(item);
      }
    }

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    return processed;
  }
}

export const offlineVaultService = new OfflineVaultService();
export default offlineVaultService;
