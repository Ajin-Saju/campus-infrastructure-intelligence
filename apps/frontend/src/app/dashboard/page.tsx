'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import {
  fetchAdminDashboard,
  fetchStudentDashboard,
  fetchMaintenanceDashboard,
  fetchVendorDashboard,
  AdminDashboardData,
  StudentDashboardData,
  MaintenanceDashboardData,
  VendorDashboardData,
} from '../../lib/dashboard-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  MapPin,
  Briefcase,
  Wrench,
  Loader2,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  User,
  Star,
  FileText,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';

export default function DashboardAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'student' | 'maintenance' | 'vendor'>('admin');
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [maintData, setMaintData] = useState<MaintenanceDashboardData | null>(null);
  const [vendorData, setVendorData] = useState<VendorDashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole = typeof user?.role === 'object' && user?.role ? (user.role as any).name : String(user?.role || '');

  useEffect(() => {
    if (!user) return;

    let initialTab: 'admin' | 'student' | 'maintenance' | 'vendor' = 'student';
    if (userRole === 'ADMIN') initialTab = 'admin';
    else if (userRole === 'TECHNICIAN') initialTab = 'maintenance';
    else if (userRole === 'VENDOR') initialTab = 'vendor';
    else initialTab = 'student';

    setActiveRoleTab(initialTab);
    loadDashboardForTab(initialTab);
  }, [user]);

  const loadDashboardForTab = async (tab: 'admin' | 'student' | 'maintenance' | 'vendor') => {
    setIsLoading(true);
    setError('');
    try {
      if (tab === 'admin') {
        const data = await fetchAdminDashboard();
        setAdminData(data);
      } else if (tab === 'student') {
        const data = await fetchStudentDashboard();
        setStudentData(data);
      } else if (tab === 'maintenance') {
        const data = await fetchMaintenanceDashboard();
        setMaintData(data);
      } else if (tab === 'vendor') {
        const data = await fetchVendorDashboard();
        setVendorData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load role dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'admin' | 'student' | 'maintenance' | 'vendor') => {
    setActiveRoleTab(tab);
    if (
      (tab === 'admin' && !adminData) ||
      (tab === 'student' && !studentData) ||
      (tab === 'maintenance' && !maintData) ||
      (tab === 'vendor' && !vendorData)
    ) {
      loadDashboardForTab(tab);
    }
  };

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (authLoading || (isLoading && !adminData && !studentData && !maintData && !vendorData)) {
    return (
      <div className="min-h-screen p-6 bg-slate-950 text-slate-100 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading operational intelligence...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs font-medium text-slate-400 hover:text-indigo-400">
                Home
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-indigo-400">
                {activeRoleTab === 'admin'
                  ? 'Administrator Analytics'
                  : activeRoleTab === 'student'
                  ? 'Student & Faculty Portal'
                  : activeRoleTab === 'maintenance'
                  ? 'Maintenance Operations'
                  : 'Vendor Repair Hub'}
              </span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-400" />
              {activeRoleTab === 'admin'
                ? 'Administrator Executive Dashboard'
                : activeRoleTab === 'student'
                ? 'Student & Faculty Issue Dashboard'
                : activeRoleTab === 'maintenance'
                ? 'Maintenance Technician Workstation'
                : 'Vendor Repair & Invoicing Dashboard'}
            </h1>
            <p className="text-xs text-slate-400">
              Role-separated live database dashboard & operational intelligence.
            </p>
          </div>

          {/* Role Dashboard Selector Tabs (For ADMIN users to inspect all views) */}
          {userRole === 'ADMIN' ? (
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => handleTabChange('admin')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeRoleTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Administrator
              </button>
              <button
                onClick={() => handleTabChange('student')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeRoleTab === 'student'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Student / Faculty
              </button>
              <button
                onClick={() => handleTabChange('maintenance')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeRoleTab === 'maintenance'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Technician
              </button>
              <button
                onClick={() => handleTabChange('vendor')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeRoleTab === 'vendor'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vendor
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Role: {userRole}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* ROLE 1: ADMINISTRATOR DASHBOARD & CHARTS   */}
        {/* ========================================== */}
        {activeRoleTab === 'admin' && adminData && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Open Issues
                </span>
                <p className="text-2xl font-bold text-amber-300">{adminData.metrics.openIssues}</p>
                <span className="text-[11px] text-slate-500">Require triage & assignment</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Closed / Resolved Issues
                </span>
                <p className="text-2xl font-bold text-emerald-300">{adminData.metrics.closedIssues}</p>
                <span className="text-[11px] text-slate-500">Successfully resolved</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Critical Issues
                </span>
                <p className="text-2xl font-bold text-rose-400">{adminData.metrics.criticalIssues}</p>
                <span className="text-[11px] text-slate-500">High severity emergency SLA</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-indigo-400" /> Active Maintenance
                </span>
                <p className="text-2xl font-bold text-indigo-300">{adminData.metrics.activeMaintenance}</p>
                <span className="text-[11px] text-slate-500">In progress / assigned</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-400" /> Monthly Cost
                </span>
                <p className="text-2xl font-bold text-purple-300">${adminData.metrics.monthlyCost.toLocaleString()}</p>
                <span className="text-[11px] text-slate-500">Updates & vendor billing</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" /> Resolution Time
                </span>
                <p className="text-2xl font-bold text-cyan-300">{adminData.metrics.resolutionTimeHours} hrs</p>
                <span className="text-[11px] text-slate-500">Average resolution SLA</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" /> Problematic Building
                </span>
                <p className="text-sm font-bold text-white truncate">{adminData.metrics.problematicBuilding}</p>
                <span className="text-[11px] text-slate-500">Highest issue frequency</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" /> Problematic Room
                </span>
                <p className="text-sm font-bold text-white truncate">{adminData.metrics.problematicRoom}</p>
                <span className="text-[11px] text-slate-500">Highest failure concentration</span>
              </div>
            </div>

            {/* RECHARTS ANALYTICS VISUALIZATIONS SECTION */}
            <div className="space-y-6 pt-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Visual Analytics & Performance Trends (Recharts)
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART 1: Issues Per Month (BarChart) */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Issues Per Month
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminData.charts.issuesPerMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="issues" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 2: Issues Per Building (BarChart) */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Issues Per Building
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminData.charts.issuesPerBuilding}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="building" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="issues" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 3: Category Distribution (PieChart) */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-400" />
                    Category Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={adminData.charts.categoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {adminData.charts.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 4: Resolution Time Trend (AreaChart) */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Resolution Time Trend (Avg Hours)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={adminData.charts.resolutionTimeTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="avgHours" stroke="#f59e0b" fill="#f59e0b20" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 5: Repair Cost Trend (LineChart) */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                    Repair Cost Trend ($)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adminData.charts.repairCostTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="cost" stroke="#a855f7" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 6: Top Problem Assets (Horizontal BarChart) */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-rose-400" />
                    Top Problem Assets
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={adminData.charts.topProblemAssets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="issueCount" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Performance Metrics Table */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Vendor Performance Analytics
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Vendor Company</th>
                      <th className="p-3">Performance Rating</th>
                      <th className="p-3">Assigned Jobs</th>
                      <th className="p-3">Completed Jobs</th>
                      <th className="p-3">Total Billing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {adminData.metrics.vendorPerformance.map((vp) => (
                      <tr key={vp.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-semibold text-white">{vp.companyName}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400" /> {vp.rating}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{vp.assignedJobs}</td>
                        <td className="p-3 font-mono text-emerald-400">{vp.completedJobs}</td>
                        <td className="p-3 font-bold text-purple-400">${vp.totalBilled.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ROLE 2: STUDENT / FACULTY DASHBOARD        */}
        {/* ========================================== */}
        {activeRoleTab === 'student' && studentData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">My Reported Issues</span>
                <p className="text-2xl font-bold text-white">{studentData.metrics.myReports}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Pending Triage / In Progress</span>
                <p className="text-2xl font-bold text-amber-400">{studentData.metrics.pendingReports}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Completed & Closed Reports</span>
                <p className="text-2xl font-bold text-emerald-400">{studentData.metrics.completedReports}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
                My Recent Submitted Reports ({studentData.recentReports.length})
              </h2>

              <div className="space-y-3">
                {studentData.recentReports.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4">No issue reports submitted yet.</p>
                ) : (
                  studentData.recentReports.map((r: any) => (
                    <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">{r.ticketNumber}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {r.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{r.title}</h4>
                      </div>
                      <Link href={`/issues/${r.id}`} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ROLE 3: MAINTENANCE TECHNICIAN DASHBOARD   */}
        {/* ========================================== */}
        {activeRoleTab === 'maintenance' && maintData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Assigned Tasks</span>
                <p className="text-2xl font-bold text-indigo-400">{maintData.metrics.assignedTasks}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Today's Jobs</span>
                <p className="text-2xl font-bold text-cyan-400">{maintData.metrics.todaysJobs}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Active Deadlines</span>
                <p className="text-2xl font-bold text-amber-400">{maintData.metrics.deadlines}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
                Technician Task Schedule & Priorities ({maintData.myTasksList.length})
              </h2>

              <div className="space-y-3">
                {maintData.myTasksList.map((t: any) => (
                  <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">{t.taskNumber}</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {t.priority}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{t.title}</h4>
                    </div>
                    <Link href="/maintenance" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      Open Maintenance Hub <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ROLE 4: VENDOR DASHBOARD                   */}
        {/* ========================================== */}
        {activeRoleTab === 'vendor' && vendorData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Assigned Repairs</span>
                <p className="text-2xl font-bold text-amber-400">{vendorData.metrics.assignedRepairs}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Completed Repairs</span>
                <p className="text-2xl font-bold text-emerald-400">{vendorData.metrics.completedRepairs}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Invoices Issued</span>
                <p className="text-2xl font-bold text-purple-400">{vendorData.metrics.invoicesCount}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Total Billing</span>
                <p className="text-2xl font-bold text-purple-300">${vendorData.metrics.totalInvoicesSum.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
                Vendor Assignments Overview ({vendorData.assignmentsList.length})
              </h2>

              <div className="space-y-3">
                {vendorData.assignmentsList.map((a: any) => (
                  <div key={a.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400">{a.vendor?.companyName}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {a.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{a.task?.title}</h4>
                    </div>
                    <Link href="/vendors" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      Open Vendor Hub <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
