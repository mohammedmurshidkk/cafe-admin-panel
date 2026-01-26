import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Campaign, useGetTemplatesQuery } from '@/store/api/campaignsApi';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MessagePreview } from './MessagePreview';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface CampaignDetailModalProps {
    campaign: Campaign | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CampaignDetailModal = ({ campaign, isOpen, onClose }: CampaignDetailModalProps) => {
    const { data: templatesData, isLoading: isLoadingTemplates } = useGetTemplatesQuery(
        { status: 'APPROVED' },
        { skip: !isOpen }
    );

    if (!campaign) return null;

    const selectedTemplate = templatesData?.templates.find(
        (t) => t.name === campaign.template_name && t.language === campaign.language_code
    );

    const stats = [
        {
            label: 'Total Recipients',
            value: campaign.total_recipients,
            icon: Users,
            color: 'text-blue-600',
        },
        {
            label: 'Success',
            value: campaign.successful_sends,
            icon: CheckCircle2,
            color: 'text-green-600',
        },
        { label: 'Failed', value: campaign.failed_sends, icon: XCircle, color: 'text-red-600' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle>{campaign.name}</DialogTitle>
                        <Badge variant={campaign.status === 'completed' ? 'default' : 'outline'}>
                            {campaign.status}
                        </Badge>
                    </div>
                    <DialogDescription>
                        {campaign.description ||
                            `Campaign created on ${format(new Date(campaign.created_at), 'PPP')}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    {/* Details Side */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="bg-muted/30 p-4 rounded-xl space-y-1 border border-border"
                                >
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Configuration
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Template Name</span>
                                    <span className="font-medium font-mono">{campaign.template_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Language</span>
                                    <span className="font-medium">{campaign.language_code}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Audience Type</span>
                                    <span className="font-medium">
                                        {campaign.select_all ? 'All Customers' : 'Specific Contacts'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Job Info
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Created: {format(new Date(campaign.created_at), 'PPPp')}
                                </div>
                                {campaign.job_id && (
                                    <div className="text-xs bg-slate-100 p-2 rounded font-mono break-all">
                                        Job ID: {campaign.job_id}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="bg-muted/20 p-6 rounded-2xl flex flex-col items-center justify-center border border-border relative min-h-[500px]">
                        {isLoadingTemplates ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-xs text-muted-foreground">Loading message preview...</p>
                            </div>
                        ) : (
                            <MessagePreview
                                image={campaign.image_url}
                                headerValue={campaign.template_variables?.header_param}
                                headerParameters={campaign.template_variables?.header_params || (campaign.template_variables?.header_param ? [campaign.template_variables.header_param] : [])}
                                bodyParameters={campaign.body_parameters || campaign.template_variables?.body_params || []}
                                template={selectedTemplate}
                                headerText={campaign.template_name} // Fallback
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
