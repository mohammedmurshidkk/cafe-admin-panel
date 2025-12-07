import { 
  ClipboardList, 
  MessageSquare, 
  Clock, 
  DollarSign,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetDashboardStatsQuery } from '@/store/api/dashboardApi';
import { useGetRecentOrdersQuery } from '@/store/api/ordersApi';
import { useGetRecentSessionsQuery } from '@/store/api/sessionsApi';
import { formatCurrency, formatTimeAgo, truncateId, formatPhone } from '@/utils/formatters';
import { OrderStatus } from '@/types';

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: ordersData, isLoading: ordersLoading } = useGetRecentOrdersQuery({ 
    limit: 5, 
    status: 'pending' 
  });
  const { data: sessionsData, isLoading: sessionsLoading } = useGetRecentSessionsQuery({ 
    status: 'active', 
    limit: 5 
  });

  const getStatusBadge = (status: OrderStatus) => {
    return <Badge variant={status}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Welcome back! Here's what's happening today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="stat-card">
              <Skeleton className="h-20 w-full" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Orders Today"
              value={stats?.ordersToday ?? 0}
              icon={ClipboardList}
            />
            <StatCard
              title="Active Sessions"
              value={stats?.activeSessions ?? 0}
              icon={MessageSquare}
            />
            <StatCard
              title="Pending Orders"
              value={stats?.pendingOrders ?? 0}
              icon={Clock}
            />
            <StatCard
              title="Revenue Today"
              value={formatCurrency(stats?.revenueToday ?? 0)}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card-warm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Recent Orders</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/orders">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : ordersData?.orders?.length ? (
            <div className="space-y-3">
              {ordersData.orders.map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">#{truncateId(order.id)}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(order.customer_phone)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(order.total)}</p>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent orders</p>
          )}
        </div>

        {/* Active Sessions */}
        <div className="card-warm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Active Sessions</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sessions">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {sessionsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sessionsData?.sessions?.length ? (
            <div className="space-y-3">
              {sessionsData.sessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatPhone(session.customer_phone)}</p>
                      <p className="text-xs text-muted-foreground">{session.items_count} items in cart</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(session.last_message_at)}</p>
                    {session.ai_paused && <Badge variant="paused">AI Paused</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No active sessions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
