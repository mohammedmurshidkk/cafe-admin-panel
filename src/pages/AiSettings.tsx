import { useState, useEffect } from 'react';
import {
    Bot,
    Sparkles,
    Settings2,
    MessageSquare,
    Check,
    RotateCcw,
    Save,
    MessageCircle,
    Hash
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    useGetAiSettingsQuery,
    useUpdateAiSettingsMutation,
    useListTemplatesQuery,
    AIPersonality
} from '@/store/api/aiPromptsApi';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const PERSONALITIES = [
    { id: 'friendly', name: 'Friendly', desc: 'Warm, empathetic, uses emojis sparingly.', icon: '😊' },
    { id: 'professional', name: 'Professional', desc: 'Formal, efficient, direct, and helpful.', icon: '💼' },
    { id: 'casual', name: 'Casual', desc: 'Relaxed, conversational, like a friend.', icon: '🤙' },
    { id: 'formal', name: 'Formal', desc: 'Very polite, traditional, strictly business.', icon: '🎩' }
];

const AiSettings = () => {
    const { data: settings, isLoading: settingsLoading } = useGetAiSettingsQuery();
    const { data: templates } = useListTemplatesQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateAiSettingsMutation();

    const [personality, setPersonality] = useState<AIPersonality>('friendly');
    const [instructionsEnabled, setInstructionsEnabled] = useState(false);
    const [customInstructions, setCustomInstructions] = useState('');
    const [greetingId, setGreetingId] = useState<string | null>(null);
    const [farewellId, setFarewellId] = useState<string | null>(null);

    useEffect(() => {
        if (settings) {
            setPersonality(settings.ai_personality);
            setInstructionsEnabled(settings.ai_instructions_enabled);
            setCustomInstructions(settings.ai_custom_instructions || '');
            setGreetingId(settings.ai_greeting_template_id);
            setFarewellId(settings.ai_farewell_template_id);
        }
    }, [settings]);

    const handleSave = async () => {
        try {
            await updateSettings({
                ai_personality: personality,
                ai_instructions_enabled: instructionsEnabled,
                ai_custom_instructions: customInstructions,
                ai_greeting_template_id: greetingId,
                ai_farewell_template_id: farewellId
            }).unwrap();
            toast.success('AI settings updated successfully');
        } catch (e) {
            toast.error('Failed to update AI settings');
        }
    };

    const greetingTemplates = templates?.filter(t => t?.template_type === 'greeting') || [];
    const farewellTemplates = templates?.filter(t => t?.template_type === 'farewell') || [];

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in pb-10">
            <PageHeader
                title="AI Settings"
                description="Configure your AI assistant's personality and behaviors."
            />

            <div className="grid gap-6">
                {/* Personality Section */}
                <Card className="card-warm border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl">Personality</CardTitle>
                        </div>
                        <CardDescription>How the AI assistant interacts with your customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <RadioGroup
                            value={personality}
                            onValueChange={(v) => setPersonality(v as AIPersonality)}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {PERSONALITIES.map((p) => (
                                <Label
                                    key={p.id}
                                    htmlFor={p.id}
                                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted/50 ${personality === p.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'
                                        }`}
                                >
                                    <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                                    <span className="text-2xl mt-1">{p.icon}</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-base">{p.name}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                                    </div>
                                    {personality === p.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                                </Label>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Custom Instructions */}
                <Card className="card-warm border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-secondary/5 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-secondary" />
                                <CardTitle className="text-xl">Custom Instructions</CardTitle>
                            </div>
                            <Switch
                                checked={instructionsEnabled}
                                onCheckedChange={setInstructionsEnabled}
                            />
                        </div>
                        <CardDescription>Add specific business rules or guidelines for the AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Ex: Always suggest our signature Rainbow Cake for birthdays. Mention 10% discount for orders above ₹1000..."
                                className="min-h-[150px] bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-secondary"
                                disabled={!instructionsEnabled}
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <p>Use clear, concise sentences for best results.</p>
                                <p>{customInstructions.length}/500 chars</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Templates Section */}
                <Card className="card-warm border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-info/5 pb-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-info" />
                            <CardTitle className="text-xl">Message Templates</CardTitle>
                        </div>
                        <CardDescription>Select predefined templates for common interactions.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" /> Greeting Template
                                </Label>
                                <Select value={greetingId || 'default'} onValueChange={setGreetingId}>
                                    <SelectTrigger className="bg-muted/30 border-none">
                                        <SelectValue placeholder="Select a greeting" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">System Default</SelectItem>
                                        {greetingTemplates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" /> Farewell Template
                                </Label>
                                <Select value={farewellId || 'default'} onValueChange={setFarewellId}>
                                    <SelectTrigger className="bg-muted/30 border-none">
                                        <SelectValue placeholder="Select a farewell" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">System Default</SelectItem>
                                        {farewellTemplates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/20 border border-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border">
                                    <Hash className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Dynamic Variables</p>
                                    <p className="text-xs text-muted-foreground">You can use variables like {'{customer_name}'} in custom templates.</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">Manage Templates</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Footer */}
                <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border shadow-lg z-10">
                    <Button variant="ghost" onClick={() => window.location.reload()}>Discard Changes</Button>
                    <Button
                        className="px-8 bg-primary hover:bg-primary/90"
                        onClick={handleSave}
                        disabled={isUpdating || settingsLoading}
                    >
                        {isUpdating ? <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AiSettings;
