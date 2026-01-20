import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAuditLogsQuery, useGetAuditStatsQuery, AuditLog } from '@/store/api/superadminApi';
import { Shield, Activity, UserCog, Calendar, Search, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const SuperAdminAuditLogs = () => {
    // Pagination state
    const [page, setPage] = useState(1);
    const limit = 50;

    // Filter states
    const [businessId, setBusinessId] = useState('');
    const [action, setAction] = useState('');
    const [entityType, setEntityType] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Fetch data
    const { data: logsData, isLoading: isLogsLoading } = useGetAuditLogsQuery({
        page,
        limit,
        businessId: businessId || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
    });

    const { data: statsData } = useGetAuditStatsQuery({
        businessId: businessId || undefined
    });

    // Reset page when filters change
    const handleFilterChange = (setter: (val: string) => void, val: string) => {
        setter(val);
        setPage(1);
    };

    const columns = [
        {
            key: 'created_at' as const,
            header: 'Timestamp',
            render: (log: AuditLog) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{formatDate(log.created_at)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
            )
        },
        {
            key: 'admin_email' as const,
            header: 'Actor',
            render: (log: AuditLog) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{log.admin_email}</span>
                    <Badge variant="outline" className="w-fit text-[10px] mt-0.5">{log.admin_role}</Badge>
                </div>
            )
        },
        {
            key: 'action' as const,
            header: 'Action',
            render: (log: AuditLog) => (
                <Badge variant="secondary" className="font-mono text-xs">
                    {log.action}
                </Badge>
            )
        },
        {
            key: 'entity_type' as const,
            header: 'Entity',
            render: (log: AuditLog) => (
                <div className="flex flex-col text-sm">
                    <span className="capitalize font-medium">{log.entity_type}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]" title={log.entity_id}>
                        {log.entity_id}
                    </span>
                </div>
            )
        },
        {
            key: 'details' as const,
            header: 'Details',
            render: (log: AuditLog) => (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Action ID</span>
                                    <span className="font-mono">{log.id}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">IP Address</span>
                                    <span>{log.ip_address || 'N/A'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground block text-xs uppercase">User Agent</span>
                                    <span className="break-all">{log.user_agent || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase mb-2">Change Details</span>
                                <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[300px]">
                                    {JSON.stringify(log.details || {}, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Logs"
                description="Track administrative actions and system events"
                action={
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Back
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Actions (30d)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statsData?.totalActions || 0}</div>
                        <p className="text-xs text-muted-foreground">Recorded in last 30 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Actor</CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold truncate">
                            {statsData?.topAdmins?.[0]?.email || 'No data'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {statsData?.topAdmins?.[0] ? `${statsData.topAdmins[0].count} actions performed` : 'No actions recorded'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Frequent Action</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium truncate">
                            {statsData?.actionsByType ? (
                                Object.entries(statsData.actionsByType).sort(([, a], [, b]) => b - a)[0]?.[0] || 'No data'
                            ) : 'No data'}
                        </div>
                        <p className="text-xs text-muted-foreground">Most common system event</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-card border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Filter className="h-4 w-4" />
                    Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Input
                        placeholder="Search Business ID..."
                        value={businessId}
                        onChange={(e) => handleFilterChange(setBusinessId, e.target.value)}
                        className="h-9"
                    />
                    <Input
                        placeholder="Filter by Action..."
                        value={action}
                        onChange={(e) => handleFilterChange(setAction, e.target.value)}
                        className="h-9"
                    />
                    <Select value={entityType} onValueChange={(val) => handleFilterChange(setEntityType, val === 'all' ? '' : val)}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Entity Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Entities</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="admin_user">Admin User</SelectItem>
                            <SelectItem value="menu_item">Menu Item</SelectItem>
                            <SelectItem value="order">Order</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9 h-9"
                            value={fromDate}
                            onChange={(e) => handleFilterChange(setFromDate, e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9 h-9"
                            value={toDate}
                            onChange={(e) => handleFilterChange(setToDate, e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="border rounded-lg bg-card">
                <DataTable
                    columns={columns}
                    data={logsData?.logs || []}
                    isLoading={isLogsLoading}
                    emptyMessage="No audit logs found matching your filters"
                />

                {/* Pagination */}
                {logsData?.pagination && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, logsData.pagination.total)} of {logsData.pagination.total} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLogsLoading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {logsData.pagination.totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= logsData.pagination.totalPages || isLogsLoading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminAuditLogs;
