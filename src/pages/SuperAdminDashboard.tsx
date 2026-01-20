import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { BusinessStatsModal } from '@/components/superadmin/BusinessStatsModal';
import { useGetAnalyticsOverviewQuery } from '@/store/api/superadminApi';
import { AnalyticsBusiness } from '@/types';
import { formatDate } from '@/utils/formatters';
import { Building2, CheckCircle, Users, ShoppingCart, BarChart3, Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const overview = data?.data?.overview;
  const businesses = data?.data?.businesses || [];

  const statsCards = [
    {
      label: 'Total Businesses',
      value: overview?.totalBusinesses ?? 0,
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Active Businesses',
      value: overview?.activeBusinesses ?? 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Sessions',
      value: overview?.totalSessions ?? 0,
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Total Orders',
      value: overview?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const columns = [
    {
      key: 'name' as const,
      header: 'Business Name',
      className: 'font-medium',
    },
    {
      key: 'whatsapp_phone_number' as const,
      header: 'WhatsApp Number',
      render: (business: AnalyticsBusiness) => (
        <span className="font-mono text-sm">{business.whatsapp_phone_number || '-'}</span>
      ),
    },
    {
      key: 'whatsapp_phone_number_id' as const,
      header: 'Phone Number ID',
      render: (business: AnalyticsBusiness) => (
        <span className="font-mono text-sm text-muted-foreground">
          {business.whatsapp_phone_number_id || '-'}
        </span>
      ),
    },
    {
      key: 'is_active' as const,
      header: 'Status',
      render: (business: AnalyticsBusiness) => (
        <Badge variant={business.is_active ? 'confirmed' : 'secondary'}>
          {business.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at' as const,
      header: 'Created',
      render: (business: AnalyticsBusiness) => formatDate(business.created_at),
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (business: AnalyticsBusiness) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBusinessId(business.id);
          }}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Stats
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tech Provider Dashboard"
        description="Overview of all businesses and analytics"
        action={
          <div className="flex gap-2">
            <Link to="/superadmin/usage">
              <Button variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Usage & Costs
              </Button>
            </Link>
            <Link to="/superadmin/audit-logs">
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border rounded-lg p-4 flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Businesses Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Businesses</h2>
        <DataTable
          columns={columns}
          data={businesses}
          isLoading={isLoading}
          emptyMessage="No businesses found"
        />
      </div>

      <BusinessStatsModal
        isOpen={!!selectedBusinessId}
        onClose={() => setSelectedBusinessId(null)}
        businessId={selectedBusinessId}
      />
    </div>
  );
};

export default SuperAdminDashboard;
