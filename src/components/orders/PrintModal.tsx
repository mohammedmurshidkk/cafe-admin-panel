import { useState, useEffect } from 'react';
import {
    useGetPrintDataQuery,
    useGetPreviewMutation,
    useSendToPrinterMutation
} from '@/store/api/printApi';
import { FormModal } from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, RefreshCw, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PrintData, PrintDataItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface PrintModalProps {
    orderId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PrintModal = ({ orderId, open, onOpenChange }: PrintModalProps) => {
    const { data: printDataResponse, isLoading: isLoadingData } = useGetPrintDataQuery(orderId!, {
        skip: !orderId || !open,
    });
    const [getPreview, { data: previewHtml, isLoading: isGettingPreview }] = useGetPreviewMutation();
    const [print, { isLoading: isPrinting }] = useSendToPrinterMutation();

    const [editableData, setEditableData] = useState<PrintData | null>(null);
    const [selectedOutletId, setSelectedOutletId] = useState<string>('');

    useEffect(() => {
        if (printDataResponse && open) {
            setEditableData(printDataResponse.printData);
            if (printDataResponse.outlets.length > 0) {
                setSelectedOutletId(printDataResponse.outlets[0].id);
            }
            // Trigger initial preview
            getPreview(printDataResponse.printData);
        }
    }, [printDataResponse, open]);

    if (!orderId) return null;

    const handleRefreshPreview = () => {
        if (editableData) {
            getPreview(editableData);
        }
    };

    const handlePrint = async () => {
        if (!editableData || !selectedOutletId) {
            toast.error('Please select an outlet');
            return;
        }
        try {
            await print({ orderId, outletId: selectedOutletId, printData: editableData }).unwrap();
            toast.success('Sent to printer');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to print');
        }
    };

    const updateItems = (newItems: PrintDataItem[]) => {
        if (!editableData) return;
        const subtotal = newItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
        const grand_total = subtotal + editableData.delivery_fee;
        setEditableData({ ...editableData, items: newItems, subtotal, grand_total });
    };

    const handleItemChange = (index: number, field: keyof PrintDataItem, value: any) => {
        if (!editableData) return;
        const newItems = [...editableData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        updateItems(newItems);
    };

    const handleAddItem = () => {
        if (!editableData) return;
        const newItem: PrintDataItem = {
            name: 'New Item',
            quantity: 1,
            unit_price: 0,
        };
        updateItems([...editableData.items, newItem]);
    };

    const handleRemoveItem = (index: number) => {
        if (!editableData) return;
        const newItems = editableData.items.filter((_, i) => i !== index);
        updateItems(newItems);
    };

    return (
        <FormModal
            open={open}
            onOpenChange={onOpenChange}
            title="Print KOT Receipt"
            description={editableData ? `Editing Order #${editableData.order_number}` : 'Loading order data...'}
            className="max-w-[95vw] md:max-w-6xl h-[90vh] flex flex-col"
        >
            {isLoadingData ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : editableData ? (
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
                    {/* Left Side: Preview */}
                    <div className="flex-1 flex flex-col bg-muted/30 rounded-xl border border-border p-4 min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Receipt Preview</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefreshPreview}
                                disabled={isGettingPreview}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isGettingPreview ? 'animate-spin' : ''}`} />
                                Refresh Preview
                            </Button>
                        </div>
                        <div className="flex-1 bg-white rounded-lg border border-border overflow-hidden relative">
                            {isGettingPreview && (
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}
                            {previewHtml ? (
                                <iframe
                                    srcDoc={previewHtml}
                                    className="w-full h-full border-none"
                                    title="Receipt Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Click refresh to load preview
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Editable Form */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            {/* Customer Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Customer Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Customer Name</Label>
                                        <Input
                                            value={editableData.customer_name}
                                            onChange={(e) => setEditableData({ ...editableData, customer_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Customer Phone</Label>
                                        <Input
                                            value={editableData.customer_phone}
                                            onChange={(e) => setEditableData({ ...editableData, customer_phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Order Items</h3>
                                    <Button variant="outline" size="sm" onClick={handleAddItem}>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Add Item
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {editableData.items.map((item, index) => (
                                        <div key={index} className="p-4 rounded-lg border border-border bg-card space-y-3 relative group">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>

                                            <div className="grid grid-cols-12 gap-3">
                                                <div className="col-span-8 space-y-2">
                                                    <Label className="text-xs">Item Name</Label>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="text-xs">Qty</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="text-xs">Price</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Size/Weight</Label>
                                                    <Input
                                                        value={item.size_or_weight || ''}
                                                        onChange={(e) => handleItemChange(index, 'size_or_weight', e.target.value)}
                                                        placeholder="e.g. 500g, Large"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Custom Text</Label>
                                                    <Input
                                                        value={item.custom_text || ''}
                                                        onChange={(e) => handleItemChange(index, 'custom_text', e.target.value)}
                                                        placeholder="Optional"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Notes</Label>
                                                <Textarea
                                                    value={item.notes || ''}
                                                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                                    placeholder="Special instructions for this item"
                                                    className="min-h-[60px] text-sm py-2"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals & Fulfillment */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Fulfillment & Totals</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fulfillment Type</Label>
                                        <Select
                                            value={editableData.fulfillment_type}
                                            onValueChange={(val: any) => setEditableData({ ...editableData, fulfillment_type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="delivery">Delivery</SelectItem>
                                                <SelectItem value="takeaway">Takeaway</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Delivery Fee</Label>
                                        <Input
                                            type="number"
                                            value={editableData.delivery_fee}
                                            onChange={(e) => {
                                                const fee = parseFloat(e.target.value) || 0;
                                                setEditableData({ ...editableData, delivery_fee: fee, grand_total: editableData.subtotal + fee });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>{editableData.fulfillment_type === 'delivery' ? 'Delivery Address' : 'Outlet Address'}</Label>
                                    <Textarea
                                        value={editableData.fulfillment_type === 'delivery' ? (editableData.delivery_address || '') : (editableData.outlet_address || '')}
                                        onChange={(e) => setEditableData({
                                            ...editableData,
                                            [editableData.fulfillment_type === 'delivery' ? 'delivery_address' : 'outlet_address']: e.target.value
                                        })}
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fulfillment Time</Label>
                                        <Input
                                            value={editableData.fulfillment_type === 'delivery' ? (editableData.delivery_time || '') : (editableData.pickup_time || '')}
                                            onChange={(e) => setEditableData({
                                                ...editableData,
                                                [editableData.fulfillment_type === 'delivery' ? 'delivery_time' : 'pickup_time']: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Admin Notes</Label>
                                        <Input
                                            value={editableData.sp_note || ''}
                                            onChange={(e) => setEditableData({ ...editableData, sp_note: e.target.value })}
                                            placeholder="Will appear on receipt"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Outlet Picker & Print */}
                        <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 w-full space-y-1.5 text-right pr-4 mb-2 sm:mb-0">
                                <p className="text-xs text-muted-foreground">Amount to Pay</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(editableData.grand_total)}</p>
                            </div>

                            <div className="flex-shrink-0 w-full sm:w-64">
                                <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Printer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {printDataResponse?.outlets.map((outlet) => (
                                            <SelectItem key={outlet.id} value={outlet.id}>
                                                {outlet.outlet_name} ({outlet.printer_ip})
                                            </SelectItem>
                                        ))}
                                        {printDataResponse?.outlets.length === 0 && (
                                            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                                                No printers configured. <br />Go to Company Profile.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="gradient"
                                className="w-full sm:w-auto min-w-[120px]"
                                onClick={handlePrint}
                                disabled={isPrinting || !selectedOutletId}
                            >
                                {isPrinting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Printer className="h-4 w-4 mr-2" />
                                )}
                                {isPrinting ? 'Printing...' : 'Print KOT'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <p>Unable to load order data</p>
                    <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            )}
        </FormModal>
    );
};
