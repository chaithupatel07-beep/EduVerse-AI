import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { QuickRoleSwitcher } from './QuickRoleSwitcher';
import { educationService } from '../services/educationService';
import { NotificationItem } from '../types';
import {
  GraduationCap,
  LogOut,
  User,
  Menu,
  Bell,
  Check,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      const items = await educationService.listNotifications();
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.is_read).length);
    } catch {
      // Gracefully silent on initial poll
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await educationService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Sidebar toggle */}
          <div className="flex items-center gap-3">
            {isAuthenticated && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
              >
                <Menu size={20} />
              </button>
            )}

            <div
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <GraduationCap size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                    EduVerse
                  </span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                  Intelligent Educational Ecosystem
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Instant Role Switcher */}
                <QuickRoleSwitcher onRoleSwitched={() => onNavigate('dashboard')} />

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileOpen(false);
                    }}
                    className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
                    title="Notifications"
                  >
                    <Bell size={19} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {unreadCount} Unread
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-1.5">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2.5 rounded-xl text-xs transition border ${
                                notif.is_read
                                  ? 'bg-white border-slate-100 text-slate-600'
                                  : 'bg-blue-50/50 border-blue-100 text-slate-800 font-medium'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-900 text-xs leading-snug">
                                    {notif.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 leading-tight">
                                    {notif.message}
                                  </p>
                                  <p className="text-[9px] text-slate-400">
                                    {new Date(notif.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                {!notif.is_read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                    title="Mark as read"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Pill */}
                <div className="hidden sm:block">
                  <RoleBadge role={user.role} />
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left text-xs">
                      <p className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 hidden md:block" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          onNavigate('profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <User size={15} className="text-slate-500" />
                        <span>Account Profile</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          onNavigate('login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
                    currentView === 'login'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
