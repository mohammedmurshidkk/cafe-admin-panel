import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetBusinessUsageQuery } from '@/store/api/usageApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ArrowLeft, AlertTriangle, MessageSquare, Bot, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export const BusinessUsageDetail = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Format dates for API
    const dateParams = dateRange?.from && dateRange?.to ? {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
    } : undefined;

    const { data, isLoading, error } = useGetBusinessUsageQuery({
        businessId: businessId!,
        ...dateParams
    }, {
        skip: !businessId
    });

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-40 w-full" />
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load business usage details.
                    </AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </div>
        );
    }

    const { summary, trends, alerts } = data;

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{summary.businessName}</h1>
                        <p className="text-muted-foreground text-sm">
                            Usage details for {summary.period.from} - {summary.period.to}
                        </p>
                    </div>
                </div>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <Alert
                            key={i}
                            variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                            className={alert.severity === 'warning' ? 'border-amber-500 text-amber-900 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-500' : ''}
                        >
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{alert.severity === 'critical' ? 'Critical Alert' : 'Warning'}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.totalCostUsd)}</div>
                        <p className="text-xs text-muted-foreground">For this period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.ai.totalRequests.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                                {(summary.ai.tokensInput + summary.ai.tokensOutput).toLocaleString()} tokens
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(summary.whatsapp.messagesSent + summary.whatsapp.messagesReceived).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.whatsapp.messagesSent} sent, {summary.whatsapp.messagesReceived} received
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Metrics</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Orders:</span>
                                <span className="font-medium">{summary.business.ordersCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Revenue:</span>
                                <span className="font-medium">{formatCurrency(summary.business.revenue)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Usage Trends Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Usage Trends</CardTitle>
                    <CardDescription>Cost breakdown by API type over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends}>
                            <defs>
                                <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorWa" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorMaps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                className="text-xs"
                            />
                            <YAxis
                                tickFormatter={(val) => `$${val}`}
                                className="text-xs"
                            />
                            <Tooltip
                                formatter={(val: number) => [`$${val.toFixed(3)}`, 'Cost']}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="aiCost"
                                stackId="1"
                                stroke="#8884d8"
                                fill="url(#colorAi)"
                                name="AI Cost"
                            />
                            <Area
                                type="monotone"
                                dataKey="whatsappCost"
                                stackId="1"
                                stroke="#82ca9d"
                                fill="url(#colorWa)"
                                name="WhatsApp Cost"
                            />
                            <Area
                                type="monotone"
                                dataKey="mapsCost"
                                stackId="1"
                                stroke="#ffc658"
                                fill="url(#colorMaps)"
                                name="Maps Cost"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>AI Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Avg Latency</span>
                            <span className="font-medium">{Math.round(summary.ai.avgLatencyMs)}ms</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Error Rate</span>
                            <span className={summary.ai.errorCount > 0 ? "text-destructive font-medium" : "font-medium"}>
                                {((summary.ai.errorCount / summary.ai.totalRequests) * 100).toFixed(2)}% ({summary.ai.errorCount})
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Token Usage</span>
                            <span className="font-medium">
                                {(summary.ai.tokensInput + summary.ai.tokensOutput).toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estimated Costs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">AI Cost</span>
                            <span className="font-medium">{formatCurrency(summary.ai.estimatedCostUsd)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">WhatsApp Cost</span>
                            <span className="font-medium">{formatCurrency(summary.whatsapp.estimatedCostUsd)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Maps Cost</span>
                            <span className="font-medium">{formatCurrency(summary.googleMaps.estimatedCostUsd)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 pt-4">
                            <span className="font-bold">Total</span>
                            <span className="font-bold text-lg text-primary">{formatCurrency(summary.totalCostUsd)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
