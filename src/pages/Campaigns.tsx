import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { CampaignHistory } from '@/components/campaigns/CampaignHistory';
import { CampaignDetailModal } from '@/components/campaigns/CampaignDetailModal';
import { Campaign } from '@/store/api/campaignsApi';
import { PlusCircle, History, Clock, FileText } from 'lucide-react';

const Campaigns = () => {
    const [activeTab, setActiveTab] = useState('new');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [duplicateData, setDuplicateData] = useState<Campaign | null>(null);
    const [editCampaignData, setEditCampaignData] = useState<Campaign | null>(null);

    const handleDuplicate = (campaign: Campaign) => {
        setDuplicateData(campaign);
        setEditCampaignData(null);
        setActiveTab('new');
    };

    const handleEdit = (campaign: Campaign) => {
        setEditCampaignData(campaign);
        setDuplicateData(null);
        setActiveTab('new');
    };

    const handleView = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setIsDetailModalOpen(true);
    };

    const handleFormSuccess = (isDraft = false) => {
        if (isDraft) {
            setActiveTab('drafts');
        } else if (duplicateData?.scheduled_at || editCampaignData?.scheduled_at || (!isDraft && activeTab === 'new' && document.querySelector('input[type="checkbox"]:checked'))) {
            // This is a bit hacky, let's just use the redirect from CampaignForm
            // Actually, I'll just rely on the parameter.
            setActiveTab('scheduled');
        } else {
            setActiveTab('history');
        }
        setDuplicateData(null);
        setEditCampaignData(null);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="WhatsApp Campaigns"
                description="Manage marketing campaigns and template messages"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="new" className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        {editCampaignData ? 'Edit Campaign' : 'New Campaign'}
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Drafts
                    </TabsTrigger>
                    <TabsTrigger value="scheduled" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Scheduled
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Campaign History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="new">
                    <CampaignForm
                        key={duplicateData ? 'duplicate' : editCampaignData ? 'edit' : 'new'}
                        initialData={duplicateData || editCampaignData}
                        isEditMode={!!editCampaignData}
                        onSuccess={handleFormSuccess}
                    />
                </TabsContent>

                <TabsContent value="drafts">
                    <CampaignHistory
                        defaultStatus="draft"
                        hideStatusFilter
                        onDuplicate={handleDuplicate}
                        onEdit={handleEdit}
                        onView={handleView}
                    />
                </TabsContent>

                <TabsContent value="scheduled">
                    <CampaignHistory
                        defaultStatus="scheduled"
                        hideStatusFilter
                        onDuplicate={handleDuplicate}
                        onEdit={handleEdit}
                        onView={handleView}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <CampaignHistory
                        onDuplicate={handleDuplicate}
                        onView={handleView}
                    />
                </TabsContent>
            </Tabs>

            <CampaignDetailModal
                campaign={selectedCampaign}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </div>
    );
};

export default Campaigns;
