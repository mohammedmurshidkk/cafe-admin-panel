import React, { useState } from 'react';
import {
    useGetCampaignsQuery,
    useCancelCampaignMutation,
    Campaign
} from '@/store/api/campaignsApi';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreVertical, Copy,
    Trash2,
    Eye, Calendar, Search, Filter, Clock, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CampaignHistoryProps {
    onDuplicate: (campaign: Campaign) => void;
    onView: (campaign: Campaign) => void;
    onEdit?: (campaign: Campaign) => void;
    defaultStatus?: string;
    hideStatusFilter?: boolean;
}

export const CampaignHistory = ({ onDuplicate, onView, onEdit, defaultStatus = 'all', hideStatusFilter = false }: CampaignHistoryProps) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>(defaultStatus);

    // Sync status if defaultStatus changes
    React.useEffect(() => {
        setStatus(defaultStatus);
    }, [defaultStatus]);

    const { data, isLoading, refetch } = useGetCampaignsQuery({
        page,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
    });

    const [cancelCampaign] = useCancelCampaignMutation();

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled campaign?')) return;
        try {
            await cancelCampaign(id).unwrap();
            toast.success('Campaign cancelled');
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to cancel campaign');
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Campaign Name',
            render: (campaign: Campaign) => (
                <div className="flex flex-col">
                    <span className="font-medium">{campaign.name}</span>
                    <span className="text-xs text-muted-foreground">{campaign.template_name}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (campaign: Campaign) => {
                const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
                    pending: 'outline',
                    scheduled: 'outline',
                    processing: 'secondary',
                    sending: 'secondary',
                    completed: 'default',
                    failed: 'destructive',
                    cancelled: 'destructive',
                    draft: 'outline',
                };
                return <Badge variant={variants[campaign.status] || 'default'}>{campaign.status}</Badge>;
            },
        },
        {
            key: 'recipients',
            header: 'Stats (Succ / Fail / Tot)',
            render: (campaign: Campaign) => (
                <div className="text-sm">
                    <span className="text-green-600 font-medium">{campaign.successful_sends || 0}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-red-600 font-medium">{campaign.failed_sends || 0}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span>{campaign.total_recipients}</span>
                </div>
            ),
        },
        {
            key: 'created_at',
            header: 'Scheduled / Sent',
            render: (campaign: any) => (
                <div className="flex flex-col text-xs text-muted-foreground">
                    {campaign.scheduled_at ? (
                        <div className="flex items-center text-primary font-medium">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(campaign.scheduled_at), 'dd MMM, HH:mm')}
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(campaign.created_at), 'dd MMM, HH:mm')}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (campaign: Campaign) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(campaign)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(campaign)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>

                        {(campaign.status === 'scheduled' || campaign.status === 'pending' || campaign.status === 'draft') && (
                            <>
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(campaign)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleCancel(campaign.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Cancel
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {!hideStatusFilter && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Drafts</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="sending">Sending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <DataTable
                columns={columns}
                data={data?.campaigns || []}
                isLoading={isLoading}
                emptyMessage="No campaigns found"
            />

            {data && data?.pagination?.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center px-4 text-sm font-medium">
                        Page {page} of {data?.pagination?.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === data?.pagination?.totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};
