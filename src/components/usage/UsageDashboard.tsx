import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { useGetDashboardQuery, useGetRealTimeQuery, useAggregateUsageMutation } from '@/store/api/usageApi';
import { RefreshCw, Activity, ArrowRight, Bot, DollarSign, MapPin, MessageSquare, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '@/utils/formatters';

export const UsageDashboard = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Format dates for API
    const dateParams = dateRange?.from && dateRange?.to ? {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
    } : undefined;

    const { data: dashboardData, isLoading, error } = useGetDashboardQuery(dateParams);
    const [aggregateUsage, { isLoading: isAggregating }] = useAggregateUsageMutation();

    // Real-time polling
    const { data: realTimeData } = useGetRealTimeQuery(undefined, {
        pollingInterval: 30000, // 30 seconds
    });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSync = async () => {
        try {
            const result = await aggregateUsage({ date: format(new Date(), 'yyyy-MM-dd') }).unwrap();
            if (result.success) {
                toast.success("Data synchronization started");
            }
        } catch (err: any) {
            toast.error(err?.data?.error || "Failed to sync data");
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load usage dashboard. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Use real-time data if available AND no specific date filter is applied, otherwise fall back to dashboard snapshot
    const showRealTime = realTimeData && !dateRange;
    const stats = showRealTime ? {
        ai: realTimeData.aiCalls,
        whatsapp: realTimeData.whatsappMessages,
        maps: realTimeData.mapsAPICalls,
        cost: realTimeData.estimatedCostUsd
    } : {
        ai: dashboardData?.realTime.aiCalls || 0,
        whatsapp: dashboardData?.realTime.whatsappMessages || 0,
        maps: dashboardData?.realTime.mapsAPICalls || 0,
        cost: dashboardData?.realTime.estimatedCostUsd || 0
    };

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usage Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor API usage, costs, and system health across all businesses.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    {showRealTime && (
                        <Badge variant="outline" className="animate-pulse border-primary text-primary gap-1 mr-2">
                            <Activity className="h-3 w-3" /> Live
                        </Badge>
                    )}
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSync}
                        disabled={isAggregating}
                        title="Sync latest data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isAggregating ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/superadmin/usage/costs')}>
                        Manage Costs
                    </Button>
                </div>
            </div>

            {/* Real-time Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Calls (Today)</CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ai.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all businesses
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">WhatsApp Msgs</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.whatsapp.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Inbound & outbound
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Maps API</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.maps.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Distance matrix calls
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Cost (Today)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.cost)}</div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardData?.totals.totalCostUsd
                                ? `${formatCurrency(dashboardData.totals.totalCostUsd)} total this period`
                                : 'Accumulating...'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Active Alerts</h2>
                    <div className="grid gap-4">
                        {dashboardData.alerts.map((alert, index) => (
                            <Alert
                                key={index}
                                variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                                className={alert.severity === 'warning' ? 'border-amber-500 text-amber-900 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-500' : ''}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="capitalize flex items-center gap-2">
                                    {alert.severity} • {alert.type.replace(/_/g, ' ')}
                                </AlertTitle>
                                <AlertDescription className="flex items-center justify-between">
                                    <span>
                                        {alert.businessName && <span className="font-semibold">{alert.businessName}: </span>}
                                        {alert.message}
                                    </span>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 ml-4"
                                        onClick={() => navigate(`/superadmin/usage/business/${alert.businessId}`)}
                                    >
                                        View Details
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Business Breakdown Table */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Business Usage Breakdown</CardTitle>
                        <CardDescription>
                            Usage metrics per business for the current period ({dashboardData?.period.from} to {dashboardData?.period.to})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Business</TableHead>
                                        <TableHead className="text-right">AI Calls</TableHead>
                                        <TableHead className="text-right">WA Msgs</TableHead>
                                        <TableHead className="text-right">Maps</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dashboardData?.businesses.map((business) => (
                                        <TableRow key={business.businessId}>
                                            <TableCell className="font-medium">
                                                {business.businessName}
                                                <div className="text-xs text-muted-foreground">
                                                    {business.business.ordersCount} orders • {formatCurrency(business.business.revenue)} rev
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {business.ai.totalRequests.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(business.whatsapp.messagesSent + business.whatsapp.messagesReceived).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {business.googleMaps.apiCalls.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(business.totalCostUsd)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/superadmin/usage/business/${business.businessId}`)}
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {dashboardData?.businesses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No business usage data found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Distribution (Simple placeholder for now) */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Cost Distribution</CardTitle>
                        <CardDescription>Estimated cost breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboardData && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Bot className="h-4 w-4 text-purple-500" /> AI Costs
                                        </span>
                                        <span className="font-medium">
                                            {/* Calculate total AI cost from businesses if not in totals */}
                                            {formatCurrency(
                                                dashboardData.businesses.reduce((acc, b) => acc + b.ai.estimatedCostUsd, 0)
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500"
                                            style={{ width: `${(dashboardData.businesses.reduce((acc, b) => acc + b.ai.estimatedCostUsd, 0) / (dashboardData.totals.totalCostUsd || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-green-500" /> WhatsApp
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                dashboardData.businesses.reduce((acc, b) => acc + b.whatsapp.estimatedCostUsd, 0)
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${(dashboardData.businesses.reduce((acc, b) => acc + b.whatsapp.estimatedCostUsd, 0) / (dashboardData.totals.totalCostUsd || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-blue-500" /> Google Maps
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                dashboardData.businesses.reduce((acc, b) => acc + b.googleMaps.estimatedCostUsd, 0)
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(dashboardData.businesses.reduce((acc, b) => acc + b.googleMaps.estimatedCostUsd, 0) / (dashboardData.totals.totalCostUsd || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t mt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">Total Estimated Cost</span>
                                        <span className="text-xl font-bold text-primary">{formatCurrency(dashboardData.totals.totalCostUsd)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
