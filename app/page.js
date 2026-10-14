'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  BarChart2,
  Calendar as CalendarIcon,
  Plus,
  MessageSquare,
  Settings as SettingsIcon,
  Facebook,
  Globe,
  Moon,
  Sun,
  Bell,
  Grid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  TrendingUp,
  Share2,
  ThumbsUp,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  ExternalLink,
  Layers,
  Film,
  Camera,
  Play,
  Upload,
  Paperclip,
  DollarSign,
  Eye,
  ArrowUpRight,
  Award
} from 'lucide-react';

export default function BlogbioDashboard() {
  const [activeNav, setActiveNav] = useState('Home');
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // App Data
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({
    pageId: '',
    pageAccessToken: '',
    pageName: 'My Facebook Page',
    pageAvatar: '',
    isConnected: false,
    followersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Composer State
  const [postType, setPostType] = useState('FEED'); // 'FEED' | 'REEL' | 'STORY'
  const [composerContent, setComposerContent] = useState('');
  const [composerMediaUrl, setComposerMediaUrl] = useState('');
  const [composerVideoUrl, setComposerVideoUrl] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoComment, setHasAutoComment] = useState(false);
  const [autoCommentsList, setAutoCommentsList] = useState(['']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = async (e, type = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    // Instant local preview in UI before upload finishes!
    const objectUrl = URL.createObjectURL(file);
    if (type === 'video') {
      setComposerVideoUrl(objectUrl);
    } else {
      setComposerMediaUrl(objectUrl);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'video') {
          setComposerVideoUrl(data.url);
        } else {
          setComposerMediaUrl(data.url);
        }
        showToast(`✅ "${file.name}" যুক্ত হয়েছে!`, 'success');
      } else {
        showToast(`Upload failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Upload error: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    pageId: '',
    pageAccessToken: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Calendar State
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(14);

  // Insights State
  const [insightsData, setInsightsData] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedInsightsPageId, setSelectedInsightsPageId] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchInsights = async (targetId) => {
    setLoadingInsights(true);
    try {
      const url = targetId ? `/api/insights?pageId=${targetId}` : '/api/insights';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setInsightsData(data);
        if (!selectedInsightsPageId && data.page?.id) {
          setSelectedInsightsPageId(data.page.id);
        }
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchData = async () => {
    try {
      const [postsRes, settingsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/settings'),
      ]);
      const postsData = await postsRes.json();
      const settingsData = await settingsRes.json();

      if (postsData.success) setPosts(postsData.posts);
      if (settingsData.success) {
        setSettings(settingsData.settings);
        setSettingsForm({
          pageId: settingsData.settings.pageId || '',
          pageAccessToken: settingsData.settings.pageAccessToken || '',
        });
      }
      fetchInsights();
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingInsights(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check for query parameters from Facebook OAuth redirect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('connected') === 'true') {
        const pageName = urlParams.get('pageName') || 'Facebook Page';
        showToast(`🎉 Facebook Page "${pageName}" connected successfully!`, 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('error')) {
        showToast(`❌ Connection Error: ${urlParams.get('error')}`, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Default scheduled time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledDateTime(localISOTime);

    // Auto-Scheduler interval
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/scheduler');
        const data = await res.json();
        if (data.publishedCount > 0) {
          showToast(`⚡ ${data.publishedCount} scheduled post(s) automatically published to Facebook!`, 'success');
          fetchData();
        }
      } catch (e) {
        // silent check
      }
    }, 35000);

    return () => clearInterval(interval);
  }, []);

  const handleCreatePost = async (publishNow = false) => {
    if (postType === 'FEED' && !composerContent.trim() && !composerMediaUrl.trim()) {
      showToast('পোস্টের টেক্সট লিখুন অথবা ছবি সিলেক্ট করুন!', 'error');
      return;
    }

    if (postType === 'STORY' && !composerMediaUrl.trim()) {
      showToast('Photo Story-র জন্য ছবি নির্বাচন করুন বা লিংক দিন!', 'error');
      return;
    }

    if (postType === 'REEL' && !composerVideoUrl.trim() && !composerMediaUrl.trim()) {
      showToast('Reel-এর জন্য ভিডিও নির্বাচন করুন বা লিংক দিন!', 'error');
      return;
    }

    if (!publishNow && !scheduledDateTime) {
      showToast('শিডিউল করার জন্য তারিখ ও সময় নির্বাচন করুন!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: composerContent,
          mediaUrl: composerMediaUrl,
          videoUrl: composerVideoUrl,
          postType,
          scheduledAt: isScheduled && !publishNow && scheduledDateTime ? new Date(scheduledDateTime).toISOString() : null,
          publishNow,
          platforms: ['facebook'],
          autoComments: hasAutoComment ? autoCommentsList.filter((c) => c.trim() !== '') : [],
          targetPageId: settings.pageId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setComposerContent('');
        setComposerMediaUrl('');
        setComposerVideoUrl('');
        setUploadedFileName('');
        setAutoCommentsList(['']);
        setHasAutoComment(false);
        setIsScheduled(false);
        setPostType('FEED');
        setShowNewPostModal(false);
        fetchData();
      } else {
        showToast(data.error || 'Failed to create post', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast(data.message || 'Facebook Page connected successfully!', 'success');
        setShowConnectModal(false);
      } else {
        showToast(data.error || 'Connection failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Post deleted', 'success');
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const scheduledCount = posts.filter((p) => p.status === 'SCHEDULED').length;
  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length;
  const failedCount = posts.filter((p) => p.status === 'FAILED').length;

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex font-sans antialiased">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-rose-600 border-rose-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. SLIM LEFT SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-[78px] bg-white border-r border-slate-200/80 flex-col items-center py-4 justify-between z-20 flex-shrink-0">
        <div className="flex flex-col items-center w-full gap-7">
          {/* Cyan/Blue Blogbio Logo */}
          <div className="w-11 h-11 rounded-2xl bg-[#00A8E8] flex items-center justify-center text-white font-extrabold text-2xl shadow-sm tracking-tighter">
            b
          </div>

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center w-full gap-3">
            {[
              { id: 'Home', icon: Home, label: 'Home' },
              { id: 'Analytics', icon: BarChart2, label: 'Analytics' },
              { id: 'Plan', icon: CalendarIcon, label: 'Plan' },
              { id: 'Create', icon: Plus, label: 'Create' },
              { id: 'Messages', icon: MessageSquare, label: 'Messages' },
              { id: 'Settings', icon: SettingsIcon, label: 'Settings' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.id === 'Analytics') fetchInsights(selectedInsightsPageId || settings.pageId);
                    if (item.id === 'Create') setShowNewPostModal(true);
                    if (item.id === 'Settings') setShowConnectModal(true);
                  }}
                  className={`group relative w-12 h-12 flex flex-col items-center justify-center rounded-2xl transition ${
                    isActive
                      ? 'bg-[#E8F2FF] text-[#2563EB] shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  <span className="text-[9px] font-semibold mt-0.5 tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Facebook Connection Status indicator on sidebar bottom */}
        <div
          onClick={() => setShowConnectModal(true)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition border ${
            settings.isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-amber-50 border-amber-200 text-amber-500 animate-pulse'
          }`}
          title={settings.isConnected ? `Connected: ${settings.pageName}` : 'Facebook Disconnected'}
        >
          <Facebook className="w-4 h-4" />
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 flex items-center justify-around px-2 shadow-lg">
        {[
          { id: 'Home', icon: Home, label: 'Home' },
          { id: 'Analytics', icon: BarChart2, label: 'Insights' },
          { id: 'Create', icon: Plus, label: 'Create', isSpecial: true },
          { id: 'Plan', icon: CalendarIcon, label: 'Plan' },
          { id: 'Settings', icon: SettingsIcon, label: 'Settings' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => setShowNewPostModal(true)}
                className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition"
                title="Create Post"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (item.id === 'Analytics') fetchInsights(selectedInsightsPageId || settings.pageId);
                if (item.id === 'Settings') setShowConnectModal(true);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-[#2563EB] font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP NAVBAR */}
        <header className="h-16 sm:h-20 bg-white/90 backdrop-blur border-b border-slate-200/70 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            {/* Mobile Logo */}
            <div className="md:hidden w-8 h-8 rounded-xl bg-[#00A8E8] flex items-center justify-center text-white font-extrabold text-base shadow-sm">
              b
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-[#043873] tracking-tight">
                {activeNav === 'Analytics' ? 'Insights' : 'Dashboard'}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                {activeNav === 'Analytics'
                  ? 'Facebook Page Reach & Earnings'
                  : '14 October 2026'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>EN</span>
            </button>

            {/* Dark Mode Icon */}
            <button className="hidden sm:flex w-9 h-9 rounded-lg border border-slate-200 items-center justify-center text-slate-600 hover:bg-slate-50 transition">
              <Moon className="w-4 h-4" />
            </button>

            {/* + NEW BUTTON (WITH DROPDOWN) */}
            <div className="relative">
              <button
                onClick={() => setShowNewDropdown(!showNewDropdown)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm shadow-sm transition"
              >
                <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                <span>New</span>
              </button>

              {/* Dropdown Menu */}
              {showNewDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setShowNewDropdown(false);
                      setShowNewPostModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>New Post</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowNewDropdown(false);
                      showToast('User invitation dialog', 'success');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>New User</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowNewDropdown(false);
                      setShowConnectModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition border-t border-slate-100"
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>New Facebook Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Workspace Grid Switcher */}
            <button className="hidden sm:flex w-9 h-9 rounded-lg border border-slate-200 items-center justify-center text-slate-600 hover:bg-slate-50 transition">
              <Grid className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition">
                <Bell className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                EI
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline">Account</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        {activeNav !== 'Analytics' && (
          <div className="p-4 sm:p-8 pb-24 md:pb-8 space-y-5 sm:space-y-7 max-w-[1550px] w-full mx-auto">
          {/* ROW 1: WELCOME BANNER + MINI CALENDAR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Welcome Banner (Left 8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="max-w-md z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Welcome To
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-[#043873] tracking-tight leading-snug">
                  Your Task Management Area
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal">
                  Track scheduled posts, team performance, and KPI progress in one place. Stay on top of
                  pages, publishing flow, and Adsconex activity every day.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowNewPostModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#00A8E8] hover:bg-[#0092c9] text-white font-bold text-xs shadow-sm transition"
                  >
                    + Create Content
                  </button>
                  <button
                    onClick={() => {
                      setActiveNav('Analytics');
                      fetchInsights(selectedInsightsPageId || settings.pageId);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#043873] border border-slate-200 font-bold text-xs shadow-2xs transition flex items-center gap-1.5"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Page Insights (Reach, Country, Earning)</span>
                  </button>
                </div>
              </div>

              {/* Graphic Illustration on the Right */}
              <div className="hidden sm:flex absolute right-6 bottom-4 top-4 items-center justify-center pointer-events-none">
                <div className="w-56 h-48 bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100/80 p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center font-bold text-sm">
                      📅
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active Flow
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2 rounded bg-slate-200 animate-pulse" />
                    <div className="w-1/2 h-2 rounded bg-slate-100" />
                    <div className="w-5/6 h-2 rounded bg-blue-100" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#043873]">
                    <span>Social Workflow</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Calendar Card (Right 4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-extrabold text-[#043873]">October 2026</span>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="text-[11px] font-bold text-slate-400">
                    {d}
                  </span>
                ))}
                {/* Dummy previous days */}
                <span className="text-slate-300">27</span>
                <span className="text-slate-300">28</span>
                <span className="text-slate-300">29</span>
                <span className="text-slate-300">30</span>
                <span className="font-semibold text-slate-700">1</span>
                <span className="font-semibold text-slate-700">2</span>
                <span className="font-semibold text-slate-700">3</span>
                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(
                  (day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={`h-7 w-7 mx-auto rounded-full text-xs flex items-center justify-center transition font-semibold ${
                        selectedCalendarDay === day
                          ? 'bg-[#00A8E8] text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: 4 METRIC STATS CARDS (Page, Post, Adsconex, Team) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Page */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center font-bold text-xl">
                <Facebook className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#043873] tracking-tight">
                  {settings.pages && settings.pages.length > 0
                    ? settings.pages.length < 10
                      ? `0${settings.pages.length}`
                      : settings.pages.length
                    : settings.isConnected
                    ? '01'
                    : '00'}
                </p>
                <p className="text-xs font-bold text-slate-400">Pages Connected</p>
              </div>
            </div>

            {/* Card 2: Post */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#043873] tracking-tight">
                  {posts.length < 10 ? `0${posts.length}` : posts.length}
                </p>
                <p className="text-xs font-bold text-slate-400">Post</p>
              </div>
            </div>

            {/* Card 3: Adsconex */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#043873] tracking-tight">00</p>
                <p className="text-xs font-bold text-slate-400">Adsconex</p>
              </div>
            </div>

            {/* Card 4: Team */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#043873] tracking-tight">01</p>
                <p className="text-xs font-bold text-slate-400">Team</p>
              </div>
            </div>
          </div>

          {/* CONNECTED FACEBOOK PAGE BANNER (WITH MULTI-PAGE SELECTOR) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {settings.isConnected ? (
                settings.pageAvatar ? (
                  <img
                    src={settings.pageAvatar}
                    alt="Page Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-2xl shadow-xs flex-shrink-0">
                    {settings.pageName ? settings.pageName.charAt(0) : 'F'}
                  </div>
                )
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-7 h-7" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black text-[#043873]">
                    {settings.isConnected ? settings.pageName : 'Facebook Page Disconnected'}
                  </h4>
                  {settings.isConnected ? (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active & Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {settings.isConnected
                    ? `Page ID: ${settings.pageId} · Total Followers: ${
                        settings.followersCount ? settings.followersCount.toLocaleString() : '0'
                      }`
                    : 'আপনার ফেসবুক পেজ কানেক্ট করতে ডানপাশের বাটনে ক্লিক করুন।'}
                </p>

                {/* Multi-Page Switcher Dropdown */}
                {settings.pages && settings.pages.length > 1 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold text-slate-500">Switch Page:</span>
                    <select
                      value={settings.pageId}
                      onChange={async (e) => {
                        const targetId = e.target.value;
                        try {
                          const res = await fetch('/api/settings/switch-page', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ pageId: targetId }),
                          });
                          const d = await res.json();
                          if (d.success) {
                            setSettings(d.settings);
                            showToast(`Switched to page: ${d.settings.pageName}`, 'success');
                          }
                        } catch (err) {
                          showToast(err.message, 'error');
                        }
                      }}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {settings.pages.map((p) => (
                        <option key={p.pageId} value={p.pageId}>
                          {p.pageName} (ID: {p.pageId})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowConnectModal(true)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex-shrink-0 ${
                settings.isConnected
                  ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-[#1877F2] hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              {settings.isConnected ? 'Manage / Sync All Pages' : '+ Connect Facebook Page'}
            </button>
          </div>

          {/* ROW 3: POST OVERVIEW CHART + TEAM KPI STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* POST OVERVIEW (Left 8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                    POST OVERVIEW
                  </p>
                  <h3 className="text-lg font-black text-[#043873]">
                    Schedule, Published, Failed
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">10/01/2026 - 10/31/2026</p>
                </div>

                {/* Status Counter Badges (Matching Screenshot) */}
                <div className="flex items-center gap-3">
                  <div className="bg-[#FFF8E7] px-3.5 py-1.5 rounded-xl text-center border border-amber-200/50">
                    <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                      SCHEDULED
                    </span>
                    <span className="text-sm font-black text-amber-700">{scheduledCount}</span>
                  </div>
                  <div className="bg-[#E9FBF3] px-3.5 py-1.5 rounded-xl text-center border border-emerald-200/50">
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                      PUBLISHED
                    </span>
                    <span className="text-sm font-black text-emerald-700">{publishedCount}</span>
                  </div>
                  <div className="bg-[#F8FAFC] px-3.5 py-1.5 rounded-xl text-center border border-slate-200">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      FAILED
                    </span>
                    <span className="text-sm font-black text-slate-600">{failedCount}</span>
                  </div>
                </div>
              </div>

              {/* Realistic Smooth Wave SVG Line Chart (Replicating Screenshot Wave) */}
              <div className="h-56 w-full relative mt-4">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 600 200"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00A8E8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00A8E8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="195" x2="600" y2="195" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Shaded Area under wave */}
                  <path
                    d="M 20 195 
                       C 50 195, 70 30, 90 30 
                       C 110 30, 130 195, 160 195 
                       C 190 195, 210 30, 230 30 
                       C 250 30, 270 195, 300 195 
                       C 330 195, 350 30, 370 30 
                       C 390 30, 410 195, 440 195 
                       C 470 195, 490 80, 510 80 
                       C 530 80, 560 195, 590 195 
                       L 590 195 L 20 195 Z"
                    fill="url(#waveGradient)"
                  />

                  {/* Wave Stroke Line */}
                  <path
                    d="M 20 195 
                       C 50 195, 70 30, 90 30 
                       C 110 30, 130 195, 160 195 
                       C 190 195, 210 30, 230 30 
                       C 250 30, 270 195, 300 195 
                       C 330 195, 350 30, 370 30 
                       C 390 30, 410 195, 440 195 
                       C 470 195, 490 80, 510 80 
                       C 530 80, 560 195, 590 195"
                    fill="none"
                    stroke="#00A8E8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Scheduled
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Published
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Failed
                  </span>
                </div>
              </div>
            </div>

            {/* TEAM KPI STATUS (Right 4 cols with Circular Gauge) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center">
              <div className="w-full text-left">
                <h3 className="text-base font-extrabold text-[#043873]">Team KPI Status</h3>
                <p className="text-xs text-slate-400 mt-0.5">Employees reached vs not reached</p>
              </div>

              {/* Radial Donut Progress Chart (Exact match from screenshot) */}
              <div className="my-6 relative flex items-center justify-center">
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                  {/* Yellow base track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#FFE492"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Cyan progress bar */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#00A8E8"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset="180"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#043873]">0%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                    REACHED KPI
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400">
                1 active team member in workspace
              </p>
            </div>
          </div>

          {/* ROW 4: RECENT POSTS LIST */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#043873]">Recent Posts & Campaigns</h3>
                <p className="text-xs text-slate-400">
                  ফেসবুক পেজে যাওয়া ও শিডিউল হওয়া সকল পোস্টের তালিকা
                </p>
              </div>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition"
              >
                + Create New Post
              </button>
            </div>

            {posts.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">কোনো পোস্ট পাওয়া যায়নি।</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <div key={post.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {post.mediaUrl ? (
                        <img
                          src={post.mediaUrl}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1877F2] flex items-center justify-center flex-shrink-0">
                          <Facebook className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{post.content || 'Photo Post'}</p>
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-[11px] text-slate-400">
                          {/* Target Page Badge */}
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <span>📄</span>
                            <span>
                              {settings.pages?.find((p) => p.pageId === post.targetPageId)?.pageName ||
                                (post.targetPageId === settings.pageId ? settings.pageName : 'Facebook Page')}
                            </span>
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              post.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : post.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {post.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              post.postType === 'REEL'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : post.postType === 'STORY'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {post.postType === 'REEL' ? '🎬 Reel' : post.postType === 'STORY' ? '📸 Story' : '📰 Post'}
                          </span>
                          <span>·</span>
                          <span>
                            {post.scheduledAt
                              ? `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`
                              : `Created: ${new Date(post.createdAt).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.fbPostId && post.status === 'PUBLISHED' && post.fbPostId !== 'sample-post-id' && (
                        <a
                          href={`https://facebook.com/${post.fbPostId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1877F2] font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          <span>View on FB ↗</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2B. INSIGHTS & ANALYTICS VIEW */}
      {activeNav === 'Analytics' && (
        <div className="p-4 sm:p-8 pb-24 md:pb-8 space-y-5 sm:space-y-7 max-w-[1550px] w-full mx-auto animate-in fade-in duration-200">
          {/* Top Bar with Page Switcher & Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <BarChart2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-[#043873] tracking-tight">
                    {insightsData?.page?.name || settings.pageName || 'Facebook Page'} Insights
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Live Meta Sync
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  রিয়েল-টাইম পেজ রিচ, ফলোয়ার গ্রোথ, দেশভিত্তিক অডিয়েন্স ও আনুমানিক ইনকাম
                </p>
              </div>
            </div>

            {/* Page Switcher Dropdown */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {settings.pages && settings.pages.length > 0 && (
                <select
                  value={selectedInsightsPageId || settings.pageId}
                  onChange={(e) => {
                    setSelectedInsightsPageId(e.target.value);
                    fetchInsights(e.target.value);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 outline-none focus:border-blue-500 cursor-pointer transition shadow-2xs"
                >
                  {settings.pages.map((p) => (
                    <option key={p.pageId} value={p.pageId}>
                      📄 {p.pageName} ({p.followersCount ? p.followersCount.toLocaleString() : 0} followers)
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => fetchInsights(selectedInsightsPageId)}
                disabled={loadingInsights}
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold flex items-center gap-2 transition"
                title="Refresh Insights"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* ROW 1: 4 CORE KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1: Followers */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Followers
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-[#043873] tracking-tight">
                    {insightsData?.insights?.followers?.total?.toLocaleString() ?? '...'}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {insightsData?.insights?.followers?.growth28d || '+12.8%'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  +{insightsData?.insights?.followers?.newFollowers28d?.toLocaleString() || '0'} new followers this month
                </p>
              </div>
            </div>

            {/* Metric 2: 28-day Reach */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Post & Page Reach
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-[#043873] tracking-tight">
                    {insightsData?.insights?.reach?.total28d?.toLocaleString() ?? '...'}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {insightsData?.insights?.reach?.growth28d || '+24.5%'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {insightsData?.insights?.reach?.impressions?.toLocaleString() || '0'} total impressions
                </p>
              </div>
            </div>

            {/* Metric 3: Estimated Earnings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estimated Earnings
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-emerald-600 tracking-tight">
                    {insightsData?.insights?.earnings?.estimatedMonthly ?? '$0.00'}
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/60 text-emerald-800">
                    / Month
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>RPM: {insightsData?.insights?.earnings?.estimatedRpm}</span>
                  <span className="text-emerald-600 font-semibold">{insightsData?.insights?.earnings?.payoutStatus}</span>
                </p>
              </div>
            </div>

            {/* Metric 4: Post Engagements */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Engagement Rate
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-[#043873] tracking-tight">
                    {insightsData?.insights?.engagements?.rate || '8.4%'}
                  </p>
                  <span className="text-xs font-bold text-slate-500">
                    ({insightsData?.insights?.engagements?.total28d?.toLocaleString() || 0})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  👍 {insightsData?.insights?.engagements?.reactions?.toLocaleString() || 0} · 💬 {insightsData?.insights?.engagements?.comments?.toLocaleString() || 0} · ↗️ {insightsData?.insights?.engagements?.shares?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* ROW 2: AUDIENCE COUNTRY DEMOGRAPHICS + MONETIZATION & IN-STREAM EARNINGS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Audience Country Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#043873]">Audience Country Breakdown</h3>
                    {insightsData?.insights?.demographics?.isRealMetaDemographics && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        ✓ 100% Real Meta Data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">ফেসবুক মেটা গ্রাফ এপিআই থেকে সরাসরি সংগৃহীত অডিয়েন্স দেশসমূহ</p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                  {insightsData?.insights?.demographics?.trafficTier || 'Top Countries'}
                </span>
              </div>

              {insightsData?.insights?.demographics?.countries?.length > 0 ? (
                <div className="space-y-4 pt-1">
                  {insightsData.insights.demographics.countries.map((c) => (
                    <div key={c.code} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2 text-slate-800">
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-normal">{c.count?.toLocaleString()} followers</span>
                          <span className="text-[#2563EB] font-black">{c.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(2, parseFloat(c.percentage)))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Globe className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">দেশভিত্তিক ডেটা অপ্রতুল</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    {insightsData?.insights?.demographics?.countryNote ||
                      'মেটার প্রাইভেসি পলিসি অনুযায়ী ১০০টির কম ফলোয়ার থাকলে দেশভিত্তিক ইনসাইটস প্রদান করা হয় না।'}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Top Audience Region:</span>
                <span className="font-bold text-slate-800">
                  {insightsData?.insights?.demographics?.primaryRegion || 'United States'}
                </span>
              </div>
            </div>

            {/* Monetization & Earnings Breakdown Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-black text-[#043873]">Monetization & In-Stream Ads</h3>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-xs text-slate-400">ফেসবুক ভিডিও ও রিলস ইন-স্ট্রিম অ্যাড মনিটাইজেশন আর্নিং</p>

                {/* Status Banner */}
                <div className={`mt-5 p-4 rounded-2xl border ${
                  insightsData?.insights?.earnings?.isEligible
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/70 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2 font-black text-xs">
                    {insightsData?.insights?.earnings?.isEligible ? '🎉 APPROVED & ELIGIBLE' : '⚠️ PENDING CRITERIA'}
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    {insightsData?.insights?.earnings?.eligibilityReason}
                  </p>
                </div>

                {/* Earnings details */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                    <span className="text-slate-500 font-medium">Estimated Monthly Revenue</span>
                    <span className="font-black text-base text-emerald-600">
                      {insightsData?.insights?.earnings?.estimatedMonthly || '$0.00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                    <span className="text-slate-500 font-medium">Estimated Daily Earnings</span>
                    <span className="font-bold text-slate-800">
                      {insightsData?.insights?.earnings?.estimatedDaily || '$0.00'} / day
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                    <span className="text-slate-500 font-medium">Monetizable Video Views</span>
                    <span className="font-bold text-slate-800">
                      {insightsData?.insights?.earnings?.monetizableViews?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                    <span className="text-slate-500 font-medium">Average In-Stream RPM</span>
                    <span className="font-bold text-slate-800">
                      {insightsData?.insights?.earnings?.estimatedRpm || '$0.00'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed font-normal">
                💡 <strong>টিপস:</strong> নিয়মিত রিলস ও ৩ মিনিটের বড় ভিডিও পোস্ট করলে ইন-স্ট্রিম বিজ্ঞাপনের মাধ্যমে আপনার আয় বৃদ্ধি পাবে।
              </div>
            </div>
          </div>

          {/* ROW 3: 7-DAY REACH TREND & AGE/GENDER DEMOGRAPHICS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Daily Reach Trend (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#043873]">Daily Reach Performance (Last 7 Days)</h3>
                  <p className="text-xs text-slate-400">গত ৭ দিনের প্রতিদিনের রিচ এবং এনগেজমেন্ট ট্রেন্ড</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  📈 Active Growth
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-4 items-end h-44">
                {insightsData?.insights?.dailyReachHistory?.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end gap-2 group">
                    <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                      {day.reach.toLocaleString()}
                    </span>
                    <div className="w-full bg-slate-100 rounded-xl overflow-hidden h-28 flex flex-col justify-end p-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-lg transition-all duration-500"
                        style={{
                          height: `${Math.min(100, Math.max(20, (day.reach / (insightsData?.insights?.reach?.total28d / 15 || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age & Gender Distribution (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-black text-[#043873]">Age & Gender</h3>
                <p className="text-xs text-slate-400">দর্শকদের বয়স ও জেন্ডার অনুপাত</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {insightsData?.insights?.demographics?.genderAge?.map((g) => (
                  <div key={g.group} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{g.group} yrs</span>
                      <span className="text-[11px] text-slate-400">
                        👨 {g.male}% · 👩 {g.female}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full flex overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${g.male}%` }} title={`Male: ${g.male}%`} />
                      <div className="bg-rose-400 h-full" style={{ width: `${g.female}%` }} title={`Female: ${g.female}%`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Male (68%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span>Female (32%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 4: PAGE RECOMMENDATION STATUS, HEALTH & ACTIONABLE AI GROWTH STRATEGY */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#043873]">
                    Page Recommendation & Health Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    মেটা প্রফেশনাল ড্যাশবোর্ড অনুযায়ী পেজের রিকমেন্ডেবিলিটি ও হেলথ স্ট্যাটাস
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {insightsData?.insights?.recommendations?.pageStatusBadge || 'Recommendable'}
                </span>
                <span className="text-xs font-black text-slate-700 px-3 py-1.5 rounded-full bg-slate-100">
                  Health: {insightsData?.insights?.recommendations?.pageHealthScore || 98}/100
                </span>
              </div>
            </div>

            {/* Health & Recommendation Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Content is Recommendable</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    মেটা আপনার পেজের পোস্ট ও রিলস নতুন ইউজারদের ফিডে 'Suggested' হিসেবে অর্গানিকালি রিকমেন্ড করছে।
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Community Standards</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    পেজে কোনো কপিরাইট স্ট্রাইক বা পলিসি ভায়োলেশন নেই (Clean & Safe Profile)।
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Best Posting Times (পিক টাইম)</p>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5 font-medium">
                    {insightsData?.insights?.recommendations?.recommendedPostingTimes?.map((t, idx) => (
                      <p key={idx}>🕒 <span className="font-bold text-slate-900">{t.time}</span> <span className="text-[10px] text-slate-400">({t.label})</span></p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Recommendations List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Actionable AI Recommendations for {insightsData?.page?.name || 'Your Page'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightsData?.insights?.recommendations?.growthTips?.map((tip, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {tip.title}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tip.badgeColor === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tip.badgeColor === 'blue'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : tip.badgeColor === 'purple'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {tip.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                      {tip.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 3. MODAL: CREATE / SCHEDULE NEW POST (WITH LIVE FACEBOOK PREVIEW) */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-7 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowNewPostModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-[#043873] mb-1">Create Content</h3>
            <p className="text-xs text-slate-400 mb-4">
              ফেসবুক ফিড পোস্ট, রিলস (Reels) অথবা ফটো স্টোরি (Story) পাবলিশ বা শিডিউল করুন।
            </p>

            {/* Post Type Selector Tabs */}
            <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setPostType('FEED')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  postType === 'FEED'
                    ? 'bg-white text-[#043873] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Feed Post</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('REEL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  postType === 'REEL'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Film className="w-4 h-4 text-rose-500" />
                <span>Reel (Short Video)</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('STORY')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  postType === 'STORY'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-4 h-4 text-amber-500" />
                <span>Photo Story</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
              {/* Form Input (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {settings.pages && settings.pages.length > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Target Facebook Page
                    </label>
                    <select
                      value={settings.pageId}
                      onChange={async (e) => {
                        const targetId = e.target.value;
                        try {
                          const res = await fetch('/api/settings/switch-page', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ pageId: targetId }),
                          });
                          const d = await res.json();
                          if (d.success) setSettings(d.settings);
                        } catch (err) {
                          showToast(err.message, 'error');
                        }
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {settings.pages.map((p) => (
                        <option key={p.pageId} value={p.pageId}>
                          {p.pageName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* FORM FIELDS FOR FEED POST */}
                {postType === 'FEED' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Post Caption (Part 1)
                      </label>
                      <textarea
                        rows={4}
                        value={composerContent}
                        onChange={(e) => setComposerContent(e.target.value)}
                        placeholder="আপনার পোস্টের বার্তা এখানে লিখুন..."
                        className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Photo / Media (Optional)
                        </label>
                        <span className="text-[10px] font-semibold text-slate-400">PC, Mobile বা Web URL</span>
                      </div>

                      {/* Device File Upload Picker */}
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition ${
                          composerMediaUrl && (composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:'))
                            ? 'border-emerald-400 bg-emerald-50/60 text-emerald-700'
                            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 text-slate-600'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'image')}
                          />
                          <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce text-blue-600' : 'text-blue-500'}`} />
                          <span className="text-xs font-bold truncate">
                            {isUploading
                              ? 'ছবি আপলোড হচ্ছে...'
                              : uploadedFileName && (composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:'))
                              ? `Selected: ${uploadedFileName}`
                              : '📁 Choose Photo from PC / Mobile'}
                          </span>
                        </label>

                        {composerMediaUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setComposerMediaUrl('');
                              setUploadedFileName('');
                            }}
                            className="px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200 transition"
                            title="Remove Photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Alternative: URL input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="url"
                          value={composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:') ? '' : composerMediaUrl}
                          onChange={(e) => {
                            setComposerMediaUrl(e.target.value);
                            setUploadedFileName('');
                          }}
                          placeholder={composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:') ? "ডিভাইস থেকে ফাইল যুক্ত করা হয়েছে" : "বা ছবির সরাসরি URL পেস্ট করুন..."}
                          className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFileName('');
                            setComposerMediaUrl(
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
                            );
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap"
                        >
                          Sample
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* FORM FIELDS FOR REEL */}
                {postType === 'REEL' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Reel Video (9:16 Vertical Video)
                        </label>
                        <span className="text-[10px] font-semibold text-rose-500">PC, Mobile বা URL</span>
                      </div>

                      {/* Device File Upload Picker */}
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition ${
                          composerVideoUrl && (composerVideoUrl.startsWith('/uploads') || composerVideoUrl.startsWith('blob:'))
                            ? 'border-rose-400 bg-rose-50/60 text-rose-700'
                            : 'border-slate-300 hover:border-rose-400 hover:bg-rose-50/40 text-slate-600'
                        }`}>
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm,video/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'video')}
                          />
                          <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce text-rose-600' : 'text-rose-500'}`} />
                          <span className="text-xs font-bold truncate">
                            {isUploading
                              ? 'ভিডিও আপলোড হচ্ছে...'
                              : uploadedFileName && (composerVideoUrl.startsWith('/uploads') || composerVideoUrl.startsWith('blob:'))
                              ? `Selected: ${uploadedFileName}`
                              : '🎥 Choose Video from PC / Mobile'}
                          </span>
                        </label>

                        {composerVideoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setComposerVideoUrl('');
                              setUploadedFileName('');
                            }}
                            className="px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200 transition"
                            title="Remove Video"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Alternative: URL input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="url"
                          value={composerVideoUrl.startsWith('/uploads') || composerVideoUrl.startsWith('blob:') ? '' : composerVideoUrl}
                          onChange={(e) => {
                            setComposerVideoUrl(e.target.value);
                            setUploadedFileName('');
                          }}
                          placeholder={composerVideoUrl.startsWith('/uploads') || composerVideoUrl.startsWith('blob:') ? "ডিভাইস থেকে ভিডিও যুক্ত করা হয়েছে" : "বা ভিডিওর ডিরেক্ট URL (.mp4) পেস্ট করুন..."}
                          className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFileName('');
                            setComposerVideoUrl(
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                            );
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl whitespace-nowrap"
                        >
                          Sample Video
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        মোবাইল বা পিসি থেকে ৯:১৬ ভার্টিকাল এমপি৪ ভিডিও সিলেক্ট করুন অথবা ডিরেক্ট URL দিন।
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Reel Caption & Hashtags
                      </label>
                      <textarea
                        rows={3}
                        value={composerContent}
                        onChange={(e) => setComposerContent(e.target.value)}
                        placeholder="রিলসের ক্যাপশন ও হ্যাশট্যাগ দিন... #reels #viral"
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:border-rose-500 outline-none text-xs resize-none"
                      />
                    </div>
                  </>
                )}

                {/* FORM FIELDS FOR PHOTO STORY */}
                {postType === 'STORY' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Story Photo (9:16 Vertical Image)
                        </label>
                        <span className="text-[10px] font-semibold text-amber-500">PC, Mobile বা URL</span>
                      </div>

                      {/* Device File Upload Picker */}
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition ${
                          composerMediaUrl && (composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:'))
                            ? 'border-amber-400 bg-amber-50/60 text-amber-700'
                            : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 text-slate-600'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'image')}
                          />
                          <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce text-amber-600' : 'text-amber-500'}`} />
                          <span className="text-xs font-bold truncate">
                            {isUploading
                              ? 'স্টোরি ছবি আপলোড হচ্ছে...'
                              : uploadedFileName && (composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:'))
                              ? `Selected: ${uploadedFileName}`
                              : '📸 Choose Photo from PC / Mobile'}
                          </span>
                        </label>

                        {composerMediaUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setComposerMediaUrl('');
                              setUploadedFileName('');
                            }}
                            className="px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200 transition"
                            title="Remove Story Photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Alternative: URL input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="url"
                          value={composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:') ? '' : composerMediaUrl}
                          onChange={(e) => {
                            setComposerMediaUrl(e.target.value);
                            setUploadedFileName('');
                          }}
                          placeholder={composerMediaUrl.startsWith('/uploads') || composerMediaUrl.startsWith('blob:') ? "ডিভাইস থেকে ছবি যুক্ত করা হয়েছে" : "বা ছবির ডিরেক্ট URL পেস্ট করুন..."}
                          className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFileName('');
                            setComposerMediaUrl(
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
                            );
                          }}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl whitespace-nowrap"
                        >
                          Sample Story
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        মোবাইল বা পিসির গ্যালারি থেকে ছবি সিলেক্ট করুন। স্টোরি ২৪ ঘণ্টার জন্য পেজের স্টোরিতে লাইভ থাকবে।
                      </p>
                    </div>
                  </>
                )}

                {/* Auto Comment / First Comment (For both Feed Posts and Reels) */}
                {postType !== 'STORY' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={hasAutoComment}
                        onChange={(e) => setHasAutoComment(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        {postType === 'REEL'
                          ? 'Auto Comment on Reel (রিলস পোস্ট হওয়ার সাথে সাথে ১ম কমেন্ট / লিংক)'
                          : 'Auto Comments / Story Parts (পোস্টের কমেন্টে গল্পের পরবর্তী পর্বসমূহ)'}
                      </span>
                    </label>

                    {hasAutoComment && (
                      <div className="space-y-3 p-3 bg-emerald-50/20 rounded-2xl border border-emerald-100">
                        {autoCommentsList.map((comm, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <span>
                                {postType === 'REEL'
                                  ? `Reel Comment ${idx + 1}`
                                  : `Part ${idx + 2} (Comment ${idx + 1})`}
                              </span>
                              {autoCommentsList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAutoCommentsList(autoCommentsList.filter((_, i) => i !== idx))
                                  }
                                  className="text-rose-500 hover:text-rose-700 text-[10px]"
                                >
                                  Remove Comment
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={2}
                              value={comm}
                              onChange={(e) => {
                                const nextList = [...autoCommentsList];
                                nextList[idx] = e.target.value;
                                setAutoCommentsList(nextList);
                              }}
                              placeholder={
                                postType === 'REEL'
                                  ? 'রিলসের কমেন্টে যে লিংক বা মেসেজ দিতে চান তা লিখুন...'
                                  : `গল্পের ${idx + 2} নং পর্ব বা কমেন্টের লেখা এখানে লিখুন...`
                              }
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500 bg-white resize-none"
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setAutoCommentsList([...autoCommentsList, ''])}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          + Add Next Comment ({autoCommentsList.length + 1})
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Scheduling Option (Common for all) */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700">Schedule for Later</span>
                  </label>

                  {isScheduled && (
                    <div className="space-y-1">
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
                      />
                      <p className="text-[10px] text-slate-400 font-medium">
                        🕒 সময়টি আপনার ডিভাইসের বর্তমান সময় (Bangladesh Time GMT+6) অনুযায়ী কাজ করবে।
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  {isScheduled ? (
                    <button
                      onClick={() => handleCreatePost(false)}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-[#00A8E8] hover:bg-[#0092c9] text-white font-bold text-sm shadow transition"
                    >
                      {isSubmitting ? 'Scheduling...' : `Schedule ${postType === 'REEL' ? 'Reel' : postType === 'STORY' ? 'Story' : 'Post'}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCreatePost(true)}
                      disabled={isSubmitting}
                      className={`flex-1 py-3 rounded-xl text-white font-bold text-sm shadow transition ${
                        postType === 'REEL'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : postType === 'STORY'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#2563EB] hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Publishing...' : `Publish ${postType === 'REEL' ? 'Reel' : postType === 'STORY' ? 'Story' : 'Post'} Now`}
                    </button>
                  )}
                </div>
              </div>

              {/* DYNAMIC LIVE PREVIEW (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
                <span className="block w-full text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 text-left">
                  Live {postType === 'REEL' ? 'Reel' : postType === 'STORY' ? 'Story' : 'Facebook'} Preview
                </span>

                {/* 1. FEED POST PREVIEW */}
                {postType === 'FEED' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
                    <div className="p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">
                        {settings.pageName ? settings.pageName.charAt(0) : 'F'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {settings.pageName || 'My Facebook Page'}
                        </p>
                        <span className="text-[10px] text-slate-400">Just now · 🌍</span>
                      </div>
                    </div>

                    <p className="px-3 pb-2 text-xs text-slate-700 whitespace-pre-wrap">
                      {composerContent || <span className="text-slate-300 italic">Post text...</span>}
                    </p>

                    {composerMediaUrl && (
                      <div className="w-full h-40 bg-slate-100 overflow-hidden">
                        <img
                          src={composerMediaUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      </div>
                    )}

                    <div className="p-2 border-t border-slate-100 grid grid-cols-3 text-center text-[11px] font-semibold text-slate-500">
                      <span className="py-1 hover:bg-slate-50 rounded">👍 Like</span>
                      <span className="py-1 hover:bg-slate-50 rounded">💬 Comment</span>
                      <span className="py-1 hover:bg-slate-50 rounded">↗️ Share</span>
                    </div>

                    {/* Simulated Multi-Part Comments in Preview */}
                    {hasAutoComment &&
                      autoCommentsList
                        .filter((c) => c.trim())
                        .map((comm, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 border-t border-slate-100 flex items-start gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {settings.pageName ? settings.pageName.charAt(0) : 'F'}
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] flex-1 shadow-2xs">
                              <p className="font-bold text-slate-900 leading-none mb-1 flex items-center gap-1">
                                {settings.pageName}
                                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                                  Part {idx + 2} (Comment)
                                </span>
                              </p>
                              <p className="text-slate-700 whitespace-pre-wrap">{comm}</p>
                            </div>
                          </div>
                        ))}
                  </div>
                )}

                {/* 2. REEL PREVIEW (9:16 VERTICAL SMARTPHONE MOCKUP) */}
                {postType === 'REEL' && (
                  <div className="w-64 h-[440px] rounded-3xl bg-slate-900 border-4 border-slate-800 shadow-xl overflow-hidden relative flex flex-col justify-between text-white font-sans">
                    {/* Background Video / Mockup */}
                    {composerVideoUrl ? (
                      <video
                        src={composerVideoUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black flex items-center justify-center">
                        <Play className="w-12 h-12 text-white/40" />
                      </div>
                    )}

                    {/* Top Bar */}
                    <div className="relative z-10 p-3 flex items-center justify-between text-xs font-bold text-white/90">
                      <span>Reels</span>
                      <Camera className="w-4 h-4" />
                    </div>

                    {/* Right Action Bar */}
                    <div className="relative z-10 p-3 self-end flex flex-col items-center gap-3 text-white text-[10px] font-bold">
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-sm">
                          ❤️
                        </span>
                        <span>18.4K</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-sm">
                          💬
                        </span>
                        <span>420</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-sm">
                          ↗️
                        </span>
                        <span>Share</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white/50 animate-spin flex items-center justify-center text-[8px]">
                        🎵
                      </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="relative z-10 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[9px]">
                          {settings.pageName ? settings.pageName.charAt(0) : 'F'}
                        </div>
                        <span className="text-xs font-bold">{settings.pageName}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/40 bg-white/20">
                          Follow
                        </span>
                      </div>
                      <p className="text-[11px] text-white/90 line-clamp-2">
                        {composerContent || 'Your reel caption and description will appear here...'}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-white/70">
                        <span>♫ Original audio · {settings.pageName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PHOTO STORY PREVIEW (9:16 VERTICAL STORY MOCKUP) */}
                {postType === 'STORY' && (
                  <div className="w-64 h-[440px] rounded-3xl bg-slate-900 border-4 border-slate-800 shadow-xl overflow-hidden relative flex flex-col justify-between text-white font-sans">
                    {/* Story Photo */}
                    {composerMediaUrl ? (
                      <img
                        src={composerMediaUrl}
                        alt="Story"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white/40 text-xs">
                        <Camera className="w-10 h-10 mb-2" />
                        <span>Story Photo Preview</span>
                      </div>
                    )}

                    {/* Top Progress Bar & Header */}
                    <div className="relative z-10 p-3 bg-gradient-to-b from-black/80 to-transparent space-y-2">
                      {/* Segmented bar */}
                      <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden flex gap-1">
                        <div className="w-full h-full bg-white rounded-full"></div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs border border-white">
                          {settings.pageName ? settings.pageName.charAt(0) : 'F'}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">{settings.pageName}</p>
                          <span className="text-[9px] text-white/70">Just now</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Reply Bar */}
                    <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
                      <div className="flex-1 py-1.5 px-3 rounded-full border border-white/40 bg-black/30 text-[10px] text-white/70">
                        Send message...
                      </div>
                      <span className="text-sm">❤️</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: CONNECT FACEBOOK PAGE */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center">
                <Facebook className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#043873]">Connect Facebook Page</h3>
                <p className="text-xs text-slate-400">মেটা পেজ আইডি ও এক্সেস টোকেন দিয়ে কানেক্ট করুন</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-6">
              {/* DIRECT OAUTH LOGIN BUTTON */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 mb-5 text-center space-y-3">
                <p className="text-xs font-black text-[#043873] uppercase tracking-wider">
                  ⚡ Recommended: 1-Click Direct Login
                </p>
                <p className="text-[11px] text-slate-500">
                  কোনো টোকেন কপি করা ছাড়া সরাসরি ফেসবুক আইডিতে লগইন করে পেজ কানেক্ট করুন।
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    const appId = settingsForm.appId || settings.appId;
                    const appSecret = settingsForm.appSecret || settings.appSecret;
                    if (!appId || !appSecret) {
                      showToast('দয়া করে প্রথমে নিচে App ID এবং App Secret বক্সে লিখুন!', 'error');
                      return;
                    }
                    try {
                      await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ appId, appSecret }),
                      });
                      window.location.href = `/api/auth/facebook?app_id=${encodeURIComponent(appId)}`;
                    } catch (e) {
                      showToast(e.message, 'error');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-extrabold text-sm shadow-md transition cursor-pointer"
                >
                  <Facebook className="w-5 h-5 fill-current" />
                  <span>Continue with Facebook (Direct Login)</span>
                </button>

                {(!settings.appId || !settings.appSecret) && (
                  <div className="pt-2 text-left">
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      💡 ডিরেক্ট লগইনের জন্য আপনার Meta App-এর <strong>App ID</strong> এবং <strong>App Secret</strong> নিচে একবার সেভ করে নিন (Developers ড্যাশবোর্ডের Settings &gt; Basic-এ পাবেন)।
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="App ID"
                        value={settingsForm.appId || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, appId: e.target.value })}
                        className="p-2 text-xs border rounded-lg font-mono bg-white"
                      />
                      <input
                        type="password"
                        placeholder="App Secret"
                        value={settingsForm.appSecret || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, appSecret: e.target.value })}
                        className="p-2 text-xs border rounded-lg font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  অথবা টোকেন দিয়ে কানেক্ট করুন
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Facebook Page ID
                </label>
                <input
                  type="text"
                  value={settingsForm.pageId || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pageId: e.target.value })}
                  placeholder="e.g. 1049281948291"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Page Access Token
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.pageAccessToken || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, pageAccessToken: e.target.value })
                  }
                  placeholder="EAA..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow transition"
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
