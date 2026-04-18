import { useState } from 'react';
import {
  ClipboardList,
  MessageSquare,
  Clock,
  DollarSign,
  ArrowRight,
  Truck,
  Store,
  Phone,
  Pause,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TrendingItemsWidget } from '@/components/dashboard/TrendingItemsWidget';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { SessionDetailModal } from '@/components/sessions/SessionDetailModal';
import { useGetDashboardStatsQuery } from '@/store/api/dashboardApi';
import { useGetRecentOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/ordersApi';
import { useGetRecentSessionsQuery, useGetSessionDetailQuery, useToggleAiPauseMutation } from '@/store/api/sessionsApi';
import { formatCurrency, formatTimeAgo, formatPhone, formatDateTime } from '@/utils/formatters';
import { Order, OrderStatus, Session } from '@/types';
import { toast } from 'sonner';

const statCards = (stats: any, loading: boolean) => [
  {
    label: 'Orders Today',
    value: loading ? '—' : stats?.ordersToday ?? 0,
    icon: 'shopping_bag',
    color: 'text-primary-container',
    bg: 'bg-blush',
  },
  {
    label: 'Active Conversations',
    value: loading ? '—' : stats?.activeSessions ?? 0,
    icon: 'forum',
    color: 'text-tertiary-ds',
    bg: 'bg-tertiary-ds/10',
  },
  {
    label: 'Pending Orders',
    value: loading ? '—' : stats?.pendingOrders ?? 0,
    icon: 'pending_actions',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Revenue Today',
    value: loading ? '—' : formatCurrency(stats?.revenueToday ?? 0),
    icon: 'payments',
    color: 'text-primary-container',
    bg: 'bg-blush',
  },
];

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: ordersData, isLoading: ordersLoading } = useGetRecentOrdersQuery({ limit: 5 });
  const { data: sessionsData, isLoading: sessionsLoading } = useGetRecentSessionsQuery({ status: 'active', limit: 5 });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [toggleAiPause, { isLoading: isToggling }] = useToggleAiPauseMutation();
  const { data: sessionDetail, isLoading: detailLoading } = useGetSessionDetailQuery(
    selectedSessionId!,
    { skip: !selectedSessionId }
  );

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus({ orderId, status: newStatus }).unwrap();
      toast.success('Order status updated');
      setSelectedOrder(null);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleToggleAi = async (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleAiPause({ sessionId: session.id, paused: !session.ai_paused }).unwrap();
      toast.success(session.ai_paused ? 'AI resumed' : 'AI paused');
    } catch {
      toast.error('Failed to toggle AI');
    }
  };

  const handleSessionToggleAi = async (paused: boolean) => {
    if (!selectedSessionId) return;
    try {
      await toggleAiPause({ sessionId: selectedSessionId, paused }).unwrap();
      toast.success(paused ? 'AI paused' : 'AI resumed');
    } catch {
      toast.error('Failed to toggle AI');
    }
  };

  const cards = statCards(stats, statsLoading);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white border border-on-surface/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">{label}</span>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      {/* Trending Items */}
      <TrendingItemsWidget />

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Orders */}
        <div className="bg-white border border-on-surface/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
            <h2 className="font-semibold text-on-surface">Recent Orders</h2>
            <Link
              to="/orders"
              className="flex items-center gap-1 text-xs text-primary-container font-medium hover:text-brand-primary transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-outline-variant/30">
            {ordersLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-surface-container-highest rounded-xl animate-pulse" />
                ))}
              </div>
            ) : ordersData?.orders?.length ? (
              ordersData.orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                      {order.fulfillment_type === 'delivery' ? (
                        <Truck className="h-4 w-4 text-brand-primary" />
                      ) : order.fulfillment_type === 'takeaway' ? (
                        <Store className="h-4 w-4 text-brand-primary" />
                      ) : (
                        <Phone className="h-4 w-4 text-brand-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm text-on-surface">{order?.order_number}</p>
                        {order.fulfillment_type && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant rounded-full capitalize">
                            {order.fulfillment_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {formatPhone(order.customer_phone)}
                        {order.fulfillment_datetime && <> · {formatDateTime(order.fulfillment_datetime)}</>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-on-surface">{formatCurrency(order.total)}</p>
                    <Badge variant={order.status}>{order.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant text-sm text-center py-10">No recent orders</p>
            )}
          </div>
        </div>

        {/* Live Chat Sessions */}
        <div className="bg-white border border-on-surface/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-on-surface">Live Chat</h2>
              {sessionsData?.sessions?.length ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-tertiary-ds/10 text-tertiary-ds rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-ds animate-pulse" />
                  {sessionsData.sessions.length} live
                </span>
              ) : null}
            </div>
            <Link
              to="/chat"
              className="flex items-center gap-1 text-xs text-primary-container font-medium hover:text-brand-primary transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-outline-variant/30">
            {sessionsLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-surface-container-highest rounded-xl animate-pulse" />
                ))}
              </div>
            ) : sessionsData?.sessions?.length ? (
              sessionsData.sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-primary">
                        {(session.customer_phone || '?').charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-on-surface">{formatPhone(session?.customer_phone)}</p>
                      <p className="text-xs text-on-surface-variant">{session.items_count} items in cart</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">{formatTimeAgo(session.last_message_at)}</p>
                      {session.ai_paused && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">
                          AI Paused
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleToggleAi(session, e)}
                      disabled={isToggling}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        session.ai_paused
                          ? 'bg-tertiary-ds/10 text-tertiary-ds hover:bg-tertiary-ds/20'
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      {session.ai_paused
                        ? <Play className="h-3.5 w-3.5" />
                        : <Pause className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant text-sm text-center py-10">No active sessions</p>
            )}
          </div>
        </div>
      </div>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />

      <SessionDetailModal
        open={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        sessionDetail={sessionDetail}
        isLoading={detailLoading}
        onToggleAi={handleSessionToggleAi}
        isToggling={isToggling}
      />
    </div>
  );
};

export default Dashboard;
