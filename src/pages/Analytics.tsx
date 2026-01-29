import { useState } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    Clock,
    Calendar as CalendarIcon,
    Filter,
    RefreshCw,
    Check
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { DatePickerWithRange as DateRangePicker } from '@/components/ui/date-range-picker';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    useGetAnalyticsSummaryQuery,
    useGetAnalyticsTrendsQuery,
    useGetTopCustomersQuery,
    useGetRealtimeMetricsQuery,
    useRefreshAnalyticsMutation
} from '@/store/api/analyticsApi';
import { formatCurrency, formatPhone } from '@/utils/formatters';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const Analytics = () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
    const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

    const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummaryQuery({
        from: fromDate,
        to: toDate
    });

    const { data: trends, isLoading: trendsLoading } = useGetTrendsQuery({
        from: fromDate,
        to: toDate,
        granularity
    });

    const { data: topCustomers, isLoading: topLoading } = useGetTopCustomersQuery({ limit: 5 });
    const { data: realtime, isLoading: realtimeLoading } = useGetRealtimeMetricsQuery(undefined, {
        pollingInterval: 30000, // Refresh every 30s
    });

    const [refresh, { isLoading: isRefreshing }] = useRefreshAnalyticsMutation();

    const handleRefresh = async () => {
        try {
            await refresh().unwrap();
            toast.success('Analytics data refreshed');
        } catch (error) {
            toast.error('Failed to refresh analytics');
        }
    };

    // Helper function because trends query hook name might be different in my generated API
    function useGetTrendsQuery(params: any) {
        return useGetAnalyticsTrendsQuery(params);
    }

    const statusData = summary ? [
        { name: 'Completed', value: Math.round(summary.total_orders * summary.completed_order_rate) },
        { name: 'Other', value: Math.round(summary.total_orders * (1 - summary.completed_order_rate)) },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Analytics Dashboard"
                    description="Track your business performance and customer trends."
                />
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={dateRange}
                        setDate={setDateRange}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Refresh View"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Orders Today"
                    value={realtime?.today_stats?.order_count ?? 0}
                    icon={ShoppingBag}
                    className="bg-primary/5 border-primary/10"
                />
                <StatCard
                    title="Revenue Today"
                    value={formatCurrency(realtime?.today_stats?.total_revenue ?? 0)}
                    icon={TrendingUp}
                    className="bg-success/5 border-success/10"
                />
                <StatCard
                    title="Active Sessions"
                    value={realtime?.active_sessions ?? 0}
                    icon={Users}
                    className="bg-info/5 border-info/10"
                />
                <StatCard
                    title="Completed Today"
                    value={realtime?.today_stats?.completed_count ?? 0}
                    icon={Check}
                    className="bg-warning/5 border-warning/10"
                />
            </div>

            {/* Main Trend Chart */}
            <Card className="card-warm overflow-hidden border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div>
                        <CardTitle className="text-xl font-display font-bold">Revenue & Orders Trend</CardTitle>
                        <CardDescription>Performance trend over the selected period</CardDescription>
                    </div>
                    <Select
                        value={granularity}
                        onValueChange={(v: any) => setGranularity(v)}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Granularity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        {trendsLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : trends && trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        dy={10}
                                        tickFormatter={(str) => {
                                            try {
                                                return format(new Date(str), granularity === 'monthly' ? 'MMM yyyy' : 'dd MMM');
                                            } catch (e) {
                                                return str;
                                            }
                                        }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#888', fontSize: 12 }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#888', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="order_count"
                                        stroke="#8884d8"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        name="Orders"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="total_revenue"
                                        stroke="#82ca9d"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        name="Revenue (₹)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Filter className="h-12 w-12 mb-2 opacity-20" />
                                <p>No data available for this period</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Distribution */}
                <Card className="card-warm border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-display font-semibold">Order Status</CardTitle>
                        <CardDescription>Distribution of orders by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {summaryLoading ? (
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            ) : statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-muted-foreground">No data available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card className="card-warm border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-display font-semibold">Top Customers</CardTitle>
                            <CardDescription>Most valuable customers by total spend</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary" asChild>
                            <a href="/customers">View CRM</a>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {topLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-md" />
                                ))}
                            </div>
                        ) : topCustomers && topCustomers.length > 0 ? (
                            <div className="space-y-4 text-sm">
                                {topCustomers.map((customer, i) => (
                                    <div key={customer.customer_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{customer.name || formatPhone(customer.phone)}</p>
                                                <p className="text-xs text-muted-foreground">{customer.order_count} orders</p>
                                            </div>
                                        </div>
                                        <p className="font-bold">{formatCurrency(customer.total_spent)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No customer data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
