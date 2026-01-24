import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { MessagePreview } from './MessagePreview';
import { CustomerSelector } from './CustomerSelector';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    useSendCampaignMutation,
    useCreateCampaignMutation,
    useUpdateCampaignMutation,
    useSendDraftCampaignMutation,
    useUploadCampaignImageMutation,
    useGetTemplatesQuery,
    Template
} from '@/store/api/campaignsApi';
import { Loader2, Send, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from './DateTimePicker';
import { format } from 'date-fns';

interface CampaignFormProps {
    initialData?: any;
    onSuccess?: (isDraft?: boolean) => void;
    isEditMode?: boolean;
}

export const CampaignForm = ({ initialData, onSuccess, isEditMode = false }: CampaignFormProps) => {
    const { data: templatesData, isLoading: isLoadingTemplates, error: templatesError } = useGetTemplatesQuery({ status: 'APPROVED' });
    const [sendCampaign, { isLoading: isSending }] = useSendCampaignMutation();
    const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation();
    const [updateCampaign, { isLoading: isUpdating }] = useUpdateCampaignMutation();
    const [sendDraftCampaign, { isLoading: isSendingDraft }] = useSendDraftCampaignMutation();
    const [uploadImage, { isLoading: isUploading }] = useUploadCampaignImageMutation();

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        templateId: '', // To store selected template ID
        templateName: initialData?.template_name || '',
        languageCode: initialData?.language_code || '',
        headerValue: '', // For text headers or video URLs
        bodyParameters: initialData?.body_parameters || [] as string[],
        imageFile: null as File | null,
        imageUrl: initialData?.image_url || '',
        isScheduled: !!initialData?.scheduled_at,
        scheduledAt: initialData?.scheduled_at ? new Date(initialData.scheduled_at) : undefined as Date | undefined,
    });

    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [audienceSelection, setAudienceSelection] = useState({
        type: initialData?.select_all ? 'all' : 'specific',
        includedIds: initialData?.user_ids || [],
        excludedIds: initialData?.excluded_user_ids || [],
    });

    // Helper to extract variables from text
    const extractVariables = (text: string): string[] => {
        const matches = text.match(/{{([^}]+)}}/g);
        if (!matches) return [];
        // Remove brackets and trim
        return matches.map(m => m.replace(/{{|}}/g, '').trim());
    };

    // Handle template selection
    useEffect(() => {
        if (templatesData?.templates && formData.templateName && !selectedTemplate) {
            const template = templatesData.templates.find(t => t.name === formData.templateName && (formData.languageCode ? t.language === formData.languageCode : true));
            if (template) {
                setSelectedTemplate(template);

                // Parse body parameters from text if metadata says 0 but text has them
                const bodyComponent = template.components.find(c => c.type === 'BODY');
                const variables = bodyComponent?.text ? extractVariables(bodyComponent.text) : [];
                const paramCount = Math.max(template.parameterInfo.bodyParams, variables.length);

                if (!initialData?.body_parameters) {
                    setFormData(prev => ({
                        ...prev,
                        templateId: template.id,
                        languageCode: template.language,
                        bodyParameters: new Array(paramCount).fill(''),
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        templateId: template.id,
                        languageCode: template.language,
                    }));
                }
            }
        }
    }, [templatesData, formData.templateName, formData.languageCode, selectedTemplate, initialData]);

    const handleTemplateChange = (templateId: string) => {
        const template = templatesData?.templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(template);

            // Parse body parameters
            const bodyComponent = template.components.find(c => c.type === 'BODY');
            const variables = bodyComponent?.text ? extractVariables(bodyComponent.text) : [];
            const paramCount = Math.max(template.parameterInfo.bodyParams, variables.length);

            setFormData(prev => ({
                ...prev,
                templateId,
                templateName: template.name,
                languageCode: template.language,
                bodyParameters: new Array(paramCount).fill(''),
                headerValue: '',
                imageFile: null,
                imageUrl: '',
            }));
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleParamChange = (index: number, value: string) => {
        const newParams = [...formData.bodyParameters];
        newParams[index] = value;
        handleInputChange('bodyParameters', newParams);
    };

    const handleSubmit = async (isDraft = false) => {
        if (!formData.name.trim()) {
            toast.error('Campaign Name is required');
            return;
        }
        if (!selectedTemplate) {
            toast.error('Please select a template');
            return;
        }

        // Validation for parameters
        const hInfo = selectedTemplate.parameterInfo;
        if (hInfo.headerType === 'IMAGE' && !formData.imageFile && !formData.imageUrl) {
            toast.error('Header image is required');
            return;
        }
        if (hInfo.headerType === 'TEXT' && hInfo.headerParams > 0 && !formData.headerValue.trim()) {
            toast.error('Header text is required');
            return;
        }
        if (hInfo.headerType === 'VIDEO' && !formData.headerValue.trim()) {
            toast.error('Video URL is required');
            return;
        }
        if (hInfo.headerType === 'DOCUMENT' && !formData.headerValue.trim()) {
            toast.error('Document URL is required');
            return;
        }
        if (formData.bodyParameters.length > 0 && formData.bodyParameters.some((p) => !p.trim())) {
            toast.error('All body parameters are required');
            return;
        }

        if (audienceSelection.type === 'specific' && audienceSelection.includedIds.length === 0) {
            toast.error('Please select at least one customer');
            return;
        }

        if (formData.isScheduled && !formData.scheduledAt) {
            toast.error('Please select a scheduled date and time');
            return;
        }

        if (formData.isScheduled && formData.scheduledAt && formData.scheduledAt < new Date()) {
            toast.error('Scheduled time must be in the future');
            return;
        }

        if (!isDraft && !isConfirmOpen) {
            setIsConfirmOpen(true);
            return;
        }

        try {
            let finalImageUrl = formData.imageUrl;

            if (formData.imageFile) {
                const uploadRes = await uploadImage(formData.imageFile).unwrap();
                finalImageUrl = uploadRes.imageUrl;
            }

            // --- PAYLOAD CONSTRUCTION ---

            // Payload for "Send Now" (/send) - components based
            const buildSendPayload = () => {
                const components: any[] = [];
                const currentHInfo = selectedTemplate.parameterInfo;
                if (
                    currentHInfo.headerType === 'IMAGE' ||
                    currentHInfo.headerType === 'VIDEO' ||
                    currentHInfo.headerType === 'DOCUMENT' ||
                    (currentHInfo.headerType === 'TEXT' && currentHInfo.headerParams > 0)
                ) {
                    const headerParams: any[] = [];
                    if (currentHInfo.headerType === 'IMAGE') {
                        headerParams.push({ type: 'image', image: { link: finalImageUrl } });
                    } else if (currentHInfo.headerType === 'TEXT') {
                        headerParams.push({ type: 'text', text: formData.headerValue });
                    } else if (currentHInfo.headerType === 'VIDEO' || currentHInfo.headerType === 'DOCUMENT') {
                        const type = currentHInfo.headerType.toLowerCase();
                        headerParams.push({ type, [type]: { link: formData.headerValue } });
                    }
                    components.push({ type: 'header', parameters: headerParams });
                }
                if (formData.bodyParameters.length > 0) {
                    components.push({
                        type: 'body',
                        parameters: formData.bodyParameters.map((text) => ({ type: 'text', text })),
                    });
                }
                return {
                    template_name: selectedTemplate.name,
                    language_code: selectedTemplate.language,
                    components,
                    phone_numbers: [], // Backend handles user_ids mapping
                    user_ids: audienceSelection.type === 'specific' ? audienceSelection.includedIds : [],
                    filter_tags: [],
                };
            };

            // Payload for "Create/Schedule" (/create) - template_variables based
            const buildCreatePayload = () => {
                return {
                    name: formData.name,
                    description: formData.description,
                    template_name: selectedTemplate.name,
                    language_code: selectedTemplate.language,
                    image_url: finalImageUrl,
                    template_variables: {
                        body_params: formData.bodyParameters,
                        header_param: formData.headerValue || undefined, // Mapping header text/link to header_param
                    },
                    target_type: audienceSelection.type === 'all' ? 'all' : 'custom',
                    target_user_ids: audienceSelection.type === 'specific' ? audienceSelection.includedIds : [],
                    excluded_user_ids: audienceSelection.type === 'all' ? audienceSelection.excludedIds : [],
                    scheduled_at: formData.isScheduled ? formData.scheduledAt?.toISOString() : undefined,
                };
            };

            // --- EXECUTION ---

            let res;
            if (isEditMode && initialData?.id) {
                // UPDATE (PUT /:id)
                const payload = buildCreatePayload();
                res = await updateCampaign({ id: initialData.id, data: payload as any }).unwrap();

                // If it's NOT a draft/scheduled save (i.e., user clicked "Send Now" on an edit)
                if (!isDraft && !formData.isScheduled) {
                    res = await sendDraftCampaign(initialData.id).unwrap();
                    toast.success('Campaign sent successfully');
                } else {
                    toast.success('Campaign updated successfully');
                }
            } else if (isDraft || formData.isScheduled) {
                // CREATE/SCHEDULE (POST /create)
                const payload = buildCreatePayload();
                res = await createCampaign(payload as any).unwrap();
                toast.success(res.message || (formData.isScheduled ? 'Campaign scheduled successfully' : 'Draft saved successfully'));
            } else {
                // SEND NOW (POST /send) - New campaign
                const payload = buildSendPayload();
                res = await sendCampaign(payload as any).unwrap();
                toast.success(res.message || 'Campaign sent successfully');
            }

            setIsConfirmOpen(false);
            if (onSuccess) onSuccess(isDraft || (formData.isScheduled === false && !initialData?.status));

            if (!initialData) {
                setFormData({
                    name: '',
                    description: '',
                    templateId: '',
                    templateName: '',
                    languageCode: '',
                    headerValue: '',
                    bodyParameters: [],
                    imageFile: null,
                    imageUrl: '',
                    isScheduled: false,
                    scheduledAt: undefined,
                });
                setSelectedTemplate(null);
            }
        } catch (error: any) {
            toast.error(error?.data?.message || error?.data?.details || 'Failed to process campaign');
            setIsConfirmOpen(false);
        }
    };

    const audienceLabel = audienceSelection.type === 'all'
        ? `All Customers${audienceSelection.excludedIds.length ? ` (excluding ${audienceSelection.excludedIds.length})` : ''}`
        : `${audienceSelection.includedIds.length} Specific Users`;

    const isLoading = isSending || isUploading || isLoadingTemplates || isUpdating || isCreating || isSendingDraft;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Step 1: Campaign Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">1. Campaign Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Campaign Name*</Label>
                            <Input
                                placeholder="e.g. Diwali Greeting 2024"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                                placeholder="Internal notes about this campaign..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: Template Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">2. WhatsApp Template</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Select Approved Template*</Label>
                            {templatesError ? (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Failed to load templates. Please check your Meta connection.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Select
                                    value={formData.templateId}
                                    onValueChange={handleTemplateChange}
                                    disabled={isLoadingTemplates}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={isLoadingTemplates ? 'Loading templates...' : 'Choose a template'}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templatesData?.templates.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} ({t.language}) - {t.category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {selectedTemplate && (
                            <div className="space-y-6 pt-4 border-t">
                                {/* Header Parameter Input (Only if dynamic or media) */}
                                {(selectedTemplate.parameterInfo.headerType === 'IMAGE' ||
                                    selectedTemplate.parameterInfo.headerType === 'VIDEO' ||
                                    selectedTemplate.parameterInfo.headerType === 'DOCUMENT' ||
                                    (selectedTemplate.parameterInfo.headerType === 'TEXT' &&
                                        selectedTemplate.parameterInfo.headerParams > 0)) && (
                                        <div className="space-y-3">
                                            <Label>Header Content ({selectedTemplate.parameterInfo.headerType})</Label>
                                            {selectedTemplate.parameterInfo.headerType === 'IMAGE' && (
                                                <ImageUpload
                                                    value={formData.imageUrl}
                                                    onChange={(file) => handleInputChange('imageFile', file)}
                                                    disabled={isLoading}
                                                />
                                            )}
                                            {(selectedTemplate.parameterInfo.headerType === 'TEXT' ||
                                                selectedTemplate.parameterInfo.headerType === 'VIDEO' ||
                                                selectedTemplate.parameterInfo.headerType === 'DOCUMENT') && (
                                                    <Input
                                                        placeholder={
                                                            selectedTemplate.parameterInfo.headerType === 'TEXT'
                                                                ? 'Header text...'
                                                                : 'Link URL...'
                                                        }
                                                        value={formData.headerValue}
                                                        onChange={(e) => handleInputChange('headerValue', e.target.value)}
                                                    />
                                                )}
                                        </div>
                                    )}

                                {/* Body Parameters */}
                                {(selectedTemplate.parameterInfo.bodyParams > 0 || formData.bodyParameters.length > 0) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Body Parameters</Label>
                                            <span className="text-xs text-muted-foreground">
                                                {formData.bodyParameters.length} required
                                            </span>
                                        </div>
                                        <Alert className="bg-muted/50 border-none">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
                                                {selectedTemplate.components.find((c) => c.type === 'BODY')?.text || ''}
                                            </AlertDescription>
                                        </Alert>
                                        <div className="grid gap-3">
                                            {formData.bodyParameters.map((param, i) => {
                                                const bodyText = selectedTemplate.components.find(c => c.type === 'BODY')?.text || '';
                                                const matches = bodyText.match(/{{([^}]+)}}/g);
                                                const varName = matches && matches[i] ? matches[i] : `{{${i + 1}}}`;

                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-auto min-w-[32px] px-2 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                            {varName}
                                                        </div>
                                                        <Input
                                                            placeholder={`Value for ${varName}`}
                                                            value={param}
                                                            onChange={(e) => handleParamChange(i, e.target.value)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Information about static components */}
                                {selectedTemplate.parameterInfo.headerType === 'TEXT' &&
                                    selectedTemplate.parameterInfo.headerParams === 0 && (
                                        <p className="text-xs text-muted-foreground italic">
                                            Note: This template uses a static text header.
                                        </p>
                                    )}
                                {selectedTemplate.parameterInfo.bodyParams === 0 && formData.bodyParameters.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">
                                        Note: This template uses a static message body.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 3: Audience & Scheduling */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">3. Target Audience & Scheduling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <CustomerSelector onSelectionChange={setAudienceSelection} />

                        <div className="pt-6 border-t space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Schedule for later</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send this campaign at a specific date and time
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isScheduled}
                                    onCheckedChange={(val) => handleInputChange('isScheduled', val)}
                                />
                            </div>

                            {formData.isScheduled && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                    <DateTimePicker
                                        date={formData.scheduledAt}
                                        setDate={(date) => handleInputChange('scheduledAt', date)}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={isLoading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        {isEditMode ? 'Update Campaign' : (formData.isScheduled ? 'Schedule Campaign' : 'Send Campaign')}
                    </Button>
                </div>
            </div>

            {/* Preview Side */}
            <div className="space-y-6">
                <div className="sticky top-6">
                    <MessagePreview
                        image={formData.imageFile || formData.imageUrl}
                        headerValue={formData.headerValue}
                        bodyParameters={formData.bodyParameters}
                        template={selectedTemplate}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title={formData.isScheduled ? 'Confirm Schedule' : 'Confirm Campaign'}
                description={`Are you sure you want to ${isEditMode ? 'update' : (formData.isScheduled && formData.scheduledAt && !isNaN(formData.scheduledAt.getTime()) ? `schedule this template for ${format(formData.scheduledAt, 'PPP HH:mm')}` : 'send this template')} to ${audienceLabel}?`}
                onConfirm={() => handleSubmit(false)}
                isLoading={isLoading}
                confirmLabel={isEditMode ? 'Update' : (formData.isScheduled ? 'Schedule' : 'Send Campaign')}
            />
        </div>
    );
};
