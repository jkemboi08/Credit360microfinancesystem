/* Super User Dashboard - cleaned and fixed TSX */
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import {
  Users,
  Building2,
  Settings,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Shield,
  Database,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Globe,
  UserPlus,
  UserMinus,
  Crown,
  TrendingUp,
  DollarSign,
  Clock,
  Server,
  AlertCircle,
  MoreVertical,
  Mail,
  FileText,
  Pause,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  database_name?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TRIAL";
  plan: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" | "CUSTOM";
  max_clients?: number;
  max_users?: number;
  storage_limit_gb?: number;
  api_calls_limit?: number;
  settings?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  current_users?: number;
  last_activity?: string | null;
}

interface PlatformUser {
  id: number;
  user_id?: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: "staff" | "client" | "manager" | "admin";
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  tenant_name?: string;
  last_login_at?: string | null;
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  totalUsers: number;
  totalClients: number;
  totalLoans: number;
  totalSavings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
  systemHealth: "HEALTHY" | "WARNING" | "CRITICAL";
  uptime: number;
  storageUsed: number;
  storageLimit: number;
  apiCallsToday: number;
  apiCallsLimit: number;
}

interface SystemAlert {
  id: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

type TabType =
  | "overview"
  | "tenants"
  | "users"
  | "analytics"
  | "settings"
  | "billing"
  | "system";

const SuperUserDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    trialTenants: 0,
    totalUsers: 0,
    totalClients: 0,
    totalLoans: 0,
    totalSavings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    newTenantsThisMonth: 0,
    newUsersThisMonth: 0,
    systemHealth: "HEALTHY",
    uptime: 99.9,
    storageUsed: 0,
    storageLimit: 1000,
    apiCallsToday: 0,
    apiCallsLimit: 100000,
  });
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // tenant table states
  const [viewMode, setViewMode] = useState<"table" | "card" | "analytics">(
    "table"
  );
  const [displayDensity, setDisplayDensity] = useState<
    "compact" | "comfortable" | "spacious"
  >("comfortable");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    loadSystemAlerts();
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadTenants(), loadUsers(), loadPlatformStats()]);
    } catch (err) {
      /* ignore - logs handled in functions */
    } finally {
      setIsLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenant_management_view")
        .select("*")
        .order("created_at", { ascending: false });
      if (tenantError) {
        const { data: fallback, error: fallbackErr } = await supabase
          .from("tenants")
          .select("*")
          .order("created_at", { ascending: false });
        if (!fallbackErr && Array.isArray(fallback)) setTenants(fallback);
      } else if (Array.isArray(tenantData)) {
        setTenants(tenantData as Tenant[]);
      }
    } catch (e) {
      console.error("loadTenants error", e);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: basicUsers, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(basicUsers)) {
        setUsers(
          basicUsers.map((u: any) => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name ?? null,
            last_name: u.last_name ?? null,
            role: u.role ?? "staff",
            status: u.status ?? "ACTIVE",
            tenant_name: u.tenant_name ?? undefined,
            last_login_at: u.last_login_at ?? null,
          }))
        );
      }
    } catch (e) {
      console.error("loadUsers error", e);
    }
  };

  const loadPlatformStats = async () => {
    try {
      const { data: overviewData, error: overviewError } = await supabase.rpc(
        "get_platform_overview"
      );
      if (!overviewError && overviewData?.overview) {
        setStats(overviewData.overview);
        return;
      }
      // fallback lightweight calculation
      const { data: allTenants } = await supabase
        .from("tenants")
        .select("status,created_at,plan");
      const { data: allUsers } = await supabase.from("users").select("created_at");
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats((prev) => ({
        ...prev,
        totalTenants: Array.isArray(allTenants) ? allTenants.length : prev.totalTenants,
        activeTenants: Array.isArray(allTenants) ? allTenants.filter((t: any) => t.status === "ACTIVE").length : prev.activeTenants,
        trialTenants: Array.isArray(allTenants) ? allTenants.filter((t: any) => t.status === "TRIAL").length : prev.trialTenants,
        totalUsers: Array.isArray(allUsers) ? allUsers.length : prev.totalUsers,
        newTenantsThisMonth: Array.isArray(allTenants) ? allTenants.filter((t: any) => new Date(t.created_at) >= thisMonth).length : prev.newTenantsThisMonth,
        newUsersThisMonth: Array.isArray(allUsers) ? allUsers.filter((u: any) => new Date(u.created_at) >= thisMonth).length : prev.newUsersThisMonth,
      }));
    } catch (e) {
      console.error("loadPlatformStats error", e);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const { data: alertData } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("resolved", false)
        .order("timestamp", { ascending: false })
        .limit(10);
      if (Array.isArray(alertData)) setAlerts(alertData as SystemAlert[]);
    } catch (e) {
      console.error("loadSystemAlerts error", e);
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      await supabase.from("users").update({ role }).eq("id", userId);
      loadUsers();
    } catch (e) {
      console.error("updateUserRole", e);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "SUSPENDED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "INACTIVE":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "TRIAL":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-800";
      case "TRIAL":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelectAll = (checked: boolean, pageItems: Tenant[]) => {
    if (checked) {
      setSelectedTenants(pageItems.map((t) => t.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const handleSelectTenant = (tenantId: string, checked: boolean) => {
    setSelectedTenants((prev) =>
      checked ? [...prev, tenantId] : prev.filter((id) => id !== tenantId)
    );
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "HEALTHY":
        return "text-green-600";
      case "WARNING":
        return "text-yellow-600";
      case "CRITICAL":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      tenant.name.toLowerCase().includes(q) ||
      tenant.subdomain.toLowerCase().includes(q) ||
      tenant.id.toLowerCase().includes(q);
    const matchesFilter = filterStatus === "all" || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTenants = filteredTenants.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        <div className="bg-white shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Super User Dashboard</h1>
                  <p className="text-gray-600">Complete platform management and control</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getHealthColor(stats.systemHealth)}`} />
                  <span className="text-sm text-gray-600">System {stats.systemHealth}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-8">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "tenants", label: "Tenants", icon: Building2 },
                { id: "users", label: "Users", icon: Users },
                { id: "analytics", label: "Analytics", icon: Activity },
                { id: "billing", label: "Billing", icon: CreditCard },
                { id: "settings", label: "Settings", icon: Settings },
                { id: "system", label: "System", icon: Server },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto max-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="w-6 h-6 text-blue-600" /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
                        <p className="text-xs text-green-600">+{stats.newTenantsThisMonth} this month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        <p className="text-xs text-green-600">+{stats.newUsersThisMonth} this month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg"><Database className="w-6 h-6 text-purple-600" /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-600" /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tenants" && (
              <div className="flex h-full bg-gray-50 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="bg-white border-b px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
                        <div className="text-sm text-gray-500">Dashboard &gt; Tenant Management</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">{currentTime.toLocaleString()}</div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus className="w-4 h-4" />Add New Tenant</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 px-6 py-3">
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border rounded-lg"
                          placeholder="Search tenants..."
                        />
                      </div>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
                        <option value="all">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="TRIAL">Trial</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden p-4">
                    <div className="bg-white rounded-lg shadow flex flex-col h-full">
                      <div className="px-6 py-3 border-b">
                        <h3 className="text-lg font-medium">All Tenants ({filteredTenants.length})</h3>
                      </div>

                      <div className="overflow-x-auto flex-1">
                        <table className={`w-full divide-y divide-gray-200 table-fixed ${displayDensity === "compact" ? "text-sm" : displayDensity === "spacious" ? "text-lg" : "text-base"}`}>
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  checked={selectedTenants.length > 0 && selectedTenants.length === paginatedTenants.length}
                                  onChange={(e) => handleSelectAll(e.target.checked, paginatedTenants)}
                                  className="h-4 w-4"
                                />
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th onClick={() => handleSort("name")} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Tenant Name</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>

                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedTenants.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                  <div className="text-gray-500">
                                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No tenants found</p>
                                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              paginatedTenants.map((tenant, idx) => (
                                <tr key={tenant.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-50`}>
                                  <td className="px-3 py-4">
                                    <input
                                      type="checkbox"
                                      checked={selectedTenants.includes(tenant.id)}
                                      onChange={(e) => handleSelectTenant(tenant.id, e.target.checked)}
                                      className="h-4 w-4"
                                    />
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className={`w-3 h-3 rounded-full ${tenant.status === "ACTIVE" ? "bg-green-500" : tenant.status === "TRIAL" ? "bg-orange-500" : tenant.status === "SUSPENDED" ? "bg-red-500" : "bg-gray-500"}`} />
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gray-100 rounded-lg mr-3 flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-gray-600" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                        <div className="text-xs text-gray-500">ID: {tenant.id.slice(0, 8)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-900">{tenant.subdomain}.creditmanagement.com</td>
                                  <td className="px-3 py-4 text-sm">
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">{tenant.plan}</span>
                                  </td>
                                  <td className="px-3 py-4 text-right">
                                    <div className="relative inline-block text-left">
                                      <button onClick={() => setOpenDropdownId(openDropdownId === tenant.id ? null : tenant.id)} className="text-gray-400 hover:text-gray-600 p-1">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      {openDropdownId === tenant.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                          <div className="py-1">
                                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye className="w-4 h-4 mr-2" />View Details</button>
                                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit className="w-4 h-4 mr-2" />Edit Tenant</button>
                                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Trash2 className="w-4 h-4 mr-2" />Delete Tenant</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="px-6 py-3 border-t bg-white flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing {paginatedTenants.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTenants.length)} of {filteredTenants.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                          <div className="text-sm">{currentPage} / {totalPages}</div>
                          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-80 bg-white rounded-lg shadow-lg ml-4 p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>New this month: {stats.newTenantsThisMonth}</div>
                    <div>Active Tenants: {stats.activeTenants}</div>
                    <div>Trials: {stats.trialTenants}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">User Management</h3>
                      <p className="text-sm text-gray-600">Manage platform users and roles</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><UserPlus className="w-4 h-4" />Add User</button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow h-96 overflow-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-gray-100 rounded-lg mr-3"><Users className="w-5 h-5 text-gray-600" /></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="px-2 py-1 text-xs bg-purple-100 rounded-full">{user.role}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getStatusIcon(user.status)}
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>{user.status ?? "ACTIVE"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.tenant_name ?? "Platform"}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => updateUserRole(user.id, user.role === "admin" ? "staff" : "admin")} className="text-blue-600 p-1"><Shield className="w-4 h-4" /></button>
                              <button className="text-yellow-600 p-1">{user.status === "ACTIVE" ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        <button onClick={() => { /* open wizard */ }} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40">
          <UserPlus className="w-6 h-6" />
        </button>

        {selectedTenants.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">{selectedTenants.length} tenant{selectedTenants.length > 1 ? "s" : ""} selected</span>
                <button onClick={() => setSelectedTenants([])} className="text-sm text-gray-300 hover:text-white underline">Clear Selection</button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Send Email</button>
                <button onClick={() => setSelectedTenants([])} className="text-gray-300 hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SuperUserDashboard;