import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Lightbulb, ChevronDown, ChevronUp, X, Minus, Plus } from 'lucide-react';
import { Intervention } from '@/store/api/interventionApi';
import { useGetCakePricingConfigQuery } from '@/store/api/cakePricingApi';

interface CustomCakeRequestCardProps {
    intervention: Intervention;
    isExpanded: boolean;
    onExpandToggle: (expanded: boolean) => void;
    onClaim: () => void;
    onResolve: (approved: boolean, price?: number, message?: string) => void;
    onCancel: () => void;
    onImageClick: (url: string) => void;
    isClaiming: boolean;
    isResolving: boolean;
    isCancelling: boolean;
    formatWeight: (g: number | undefined) => string;
}

// Helper to parse weight string from config (e.g. "1kg" -> 1000, "500g" -> 500)
const parseWeightFromConfig = (name: string): number => {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    if (normalized.includes('kg')) {
        return parseFloat(normalized) * 1000;
    }
    if (normalized.includes('g')) {
        return parseFloat(normalized);
    }
    return 0;
};

export const CustomCakeRequestCard = ({
    intervention,
    isExpanded,
    onExpandToggle,
    onClaim,
    onResolve,
    onCancel,
    onImageClick,
    isClaiming,
    isResolving,
    isCancelling,
    formatWeight
}: CustomCakeRequestCardProps) => {
    // Config
    const { data: configData } = useGetCakePricingConfigQuery();
    const flavors = configData?.data?.flavors || [];

    // Editable state
    const [selectedFlavorId, setSelectedFlavorId] = useState<string>('');
    const [editableWeight, setEditableWeight] = useState<number>(1000);
    const [editableBasePrice, setEditableBasePrice] = useState<number>(0);
    const [customMessage, setCustomMessage] = useState('');
    const [editableElements, setEditableElements] = useState<Array<{
        element_key: string;
        element_label: string;
        quantity: number;
        price: number;
    }>>([]);

    // Get selected flavor object
    const selectedFlavor = useMemo(() =>
        flavors.find(f => f.id === selectedFlavorId),
        [flavors, selectedFlavorId]);

    // Calculate Price Draft Function
    const calculateBasePrice = useCallback((flavorId: string, weight: number): number => {
        const flavor = flavors.find(f => f.id === flavorId);
        if (!flavor) return 0;

        // 1. Try exact match in config
        const exactMatch = flavor.sizes.find(s => parseWeightFromConfig(s.name) === weight);
        if (exactMatch) {
            return exactMatch.price;
        }

        // 2. Extrapolate from Base Size
        const baseSize = flavor.sizes.find(s => s.is_base);
        if (baseSize) {
            const baseWeight = parseWeightFromConfig(baseSize.name);
            if (baseWeight > 0) {
                // Formula: (TargetWeight / BaseWeight) * BasePrice
                return Math.round((weight / baseWeight) * baseSize.price);
            }
        }

        return 0;
    }, [flavors]);

    // Initialize state when intervention changes
    useEffect(() => {
        if (intervention.status === 'in_review') {
            const aiData = intervention.ai_analysis;

            // 1. Initialize Base Price (AI fallback)
            let initialPrice = aiData?.price_breakdown?.base_price || 0;

            if (aiData?.detected_elements) {
                setEditableElements(
                    aiData.detected_elements.map((el: any) => ({
                        element_key: el.element_key,
                        element_label: el.element_label,
                        quantity: el.quantity,
                        price: el.unit_price,
                    }))
                );
            }

            // 2. Initialize Flavor & Weight
            if (flavors.length > 0) {
                const detectedFlavorName = aiData?.detected_flavor || intervention.request_data?.customer_flavor;
                const detectedWeightStr = intervention.request_data?.customer_weight || '1kg';

                // Find matching flavor
                let matchedFlavor = flavors.find(f => f.flavor_name === detectedFlavorName);
                if (!matchedFlavor && detectedFlavorName) {
                    matchedFlavor = flavors.find(f => f.flavor_name.toLowerCase() === detectedFlavorName.toLowerCase());
                }

                // Initial Weight
                let weight = 1000;
                if (detectedWeightStr.toLowerCase().includes('kg')) {
                    weight = parseFloat(detectedWeightStr) * 1000;
                } else if (detectedWeightStr.toLowerCase().includes('g')) {
                    weight = parseFloat(detectedWeightStr);
                }
                setEditableWeight(weight);

                if (matchedFlavor) {
                    setSelectedFlavorId(matchedFlavor.id);
                    // Recalc price based on config logic
                    const calculated = calculateBasePrice(matchedFlavor.id, weight);
                    if (calculated > 0) {
                        initialPrice = calculated;
                    }
                }
            }

            setEditableBasePrice(initialPrice);
        }
    }, [intervention.id, intervention.status, flavors, calculateBasePrice]);

    // Handle Flavor Change
    const handleFlavorChange = (flavorId: string) => {
        setSelectedFlavorId(flavorId);
        const newPrice = calculateBasePrice(flavorId, editableWeight);
        if (newPrice > 0) setEditableBasePrice(newPrice);
    };

    // Handle Weight Change
    const handleWeightChange = (newWeight: number) => {
        setEditableWeight(newWeight);
        if (selectedFlavorId) {
            const newPrice = calculateBasePrice(selectedFlavorId, newWeight);
            if (newPrice > 0) setEditableBasePrice(newPrice);
        }
    };

    // Calculations
    const calculatedTotal = useMemo(() => {
        const elementsTotal = editableElements.reduce((sum, el) => sum + (el.price * el.quantity), 0);
        return editableBasePrice + elementsTotal;
    }, [editableBasePrice, editableElements]);

    // Update message when values change
    useEffect(() => {
        if (intervention.status === 'in_review') {
            const flavorName = selectedFlavor?.flavor_name || 'Cake';
            const weightStr = formatWeight(editableWeight);
            setCustomMessage(`Your custom Cake (${weightStr}) for flavor ${flavorName} will be price ₹${calculatedTotal}`);
        }
    }, [editableWeight, selectedFlavor, calculatedTotal, intervention.status, formatWeight]);

    const updateElementQuantity = (index: number, change: number) => {
        const newElements = [...editableElements];
        const newQuantity = Math.max(0, newElements[index].quantity + change);
        newElements[index].quantity = newQuantity;
        setEditableElements(newElements);
    };

    const updateElementPrice = (index: number, price: number) => {
        const newElements = [...editableElements];
        newElements[index].price = price;
        setEditableElements(newElements);
    };

    // Determine displayed weight string for collapsed view
    const displayWeight = formatWeight(editableWeight);

    // Render
    if (!isExpanded && intervention.status === 'in_review') {
        return (
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-500/5 transition-colors"
                onClick={() => onExpandToggle(true)}
            >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm font-medium">Intervention in Review - {displayWeight} - ₹{calculatedTotal.toLocaleString()}</span>
                </div>
                <ChevronUp className="h-4 w-4 text-purple-600" />
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Lightbulb className="h-5 w-5" />
                    <span className="font-semibold">
                        {intervention.status === 'pending' ? 'New Custom Request' : 'Reviewing Request'}
                    </span>
                    {intervention.ai_analysis?.confidence_score != null && (
                        <span className="text-xs text-muted-foreground">
                            ({Math.round(intervention.ai_analysis.confidence_score * 100)}% confidence)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {intervention.status === 'in_review' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onExpandToggle(false)}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex gap-4">
                {/* Image Thumbnail */}
                {intervention.request_data?.image_url && (
                    <div
                        className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-border"
                        onClick={() => onImageClick(intervention.request_data!.image_url!)}
                    >
                        <img
                            src={intervention.request_data.image_url}
                            alt="Cake design"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-3">
                    {intervention.status === 'pending' ? (
                        // Pending View - Read Only Preview
                        <div className="space-y-2">
                            <div className="flex gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Weight: </span>
                                    <span className="font-medium">{formatWeight(intervention.ai_analysis?.detected_weight_grams)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Flavor: </span>
                                    <span className="font-medium">{intervention.ai_analysis?.detected_flavor || 'N/A'}</span>
                                </div>
                            </div>
                            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={onClaim} disabled={isClaiming}>
                                {isClaiming ? 'Claiming...' : 'Claim & Review'}
                            </Button>
                        </div>
                    ) : (
                        // In Review View - Editable
                        <>
                            {/* Flavor, Weight & Base Price Row */}
                            <div className="flex flex-wrap gap-3">
                                {/* FLAVOR SELECT */}
                                <div className="flex-1 min-w-[120px] space-y-1">
                                    <span className="text-xs text-muted-foreground">Flavor:</span>
                                    <Select value={selectedFlavorId} onValueChange={handleFlavorChange}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Flavor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {flavors.map(f => (
                                                <SelectItem key={f.id} value={f.id}>{f.flavor_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* WEIGHT INPUT (Grams) */}
                                <div className="flex-1 min-w-[120px] space-y-1">
                                    <span className="text-xs text-muted-foreground">Weight (grams):</span>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={editableWeight || ''}
                                            onChange={(e) => handleWeightChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="h-9 text-sm"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                            {formatWeight(editableWeight)}
                                        </span>
                                    </div>
                                </div>

                                {/* BASE PRICE INPUT */}
                                <div className="w-[110px] space-y-1">
                                    <span className="text-xs text-muted-foreground">Base Price:</span>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                                        <Input
                                            type="number"
                                            value={editableBasePrice || ''}
                                            onChange={(e) => setEditableBasePrice(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="h-9 text-sm pl-6"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detected Elements - Editable */}
                            {editableElements.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    <span className="text-sm font-medium text-foreground">Design Elements:</span>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {editableElements.map((el, idx) => (
                                            <div key={el.element_key} className="flex items-center gap-2 text-sm">
                                                <span className="flex-1 truncate text-muted-foreground">{el.element_label}</span>
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateElementQuantity(idx, -1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-6 text-center">{el.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateElementQuantity(idx, 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                {/* Price Input */}
                                                <div className="relative">
                                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={el.price || ''}
                                                        onChange={(e) => updateElementPrice(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                        className="w-20 h-6 text-xs pl-5"
                                                    />
                                                </div>
                                                {/* Subtotal */}
                                                <span className="text-xs text-muted-foreground w-16 text-right">
                                                    = ₹{(el.price * el.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Message Input */}
                            <div className="space-y-1 mt-2">
                                <span className="text-sm font-medium">Message to Customer:</span>
                                <textarea
                                    className="w-full min-h-[60px] p-2 text-sm rounded-md border border-input bg-background"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Enter message..."
                                />
                            </div>

                            {/* Total & Actions */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
                                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                    Total: ₹{calculatedTotal.toLocaleString()}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onResolve(false, 0, customMessage)}
                                        disabled={isResolving}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => onResolve(true, calculatedTotal, customMessage)}
                                        disabled={isResolving}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {isResolving ? 'Sending...' : 'Approve & Send'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
