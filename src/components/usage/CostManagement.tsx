import { useState } from 'react';
import { useGetCostsQuery, useUpdateCostConfigMutation } from '@/store/api/usageApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { Loader2, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

export const CostManagement = () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Format dates for API
    const dateParams = dateRange?.from && dateRange?.to ? {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
    } : undefined;

    const { data, isLoading } = useGetCostsQuery(dateParams || {});
    const [updateConfig, { isLoading: isUpdating }] = useUpdateCostConfigMutation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    const handleEdit = (config: any) => {
        setEditingId(config.provider);
        setEditValues({ ...config });
    };

    const handleSave = async (provider: string) => {
        try {
            await updateConfig({
                apiType: editValues.api_type,
                provider,
                costPerInputToken: parseFloat(editValues.cost_per_input_token),
                costPerOutputToken: parseFloat(editValues.cost_per_output_token),
                costPerRequest: parseFloat(editValues.cost_per_request),
                costPerMessage: parseFloat(editValues.cost_per_message),
            }).unwrap();

            setEditingId(null);
            toast.success('Pricing configuration updated');
        } catch (error) {
            toast.error('Failed to update pricing');
        }
    };

    if (isLoading || !data) {
        return (
            <div className="p-6 flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const pieData = [
        { name: 'AI', value: data.breakdown.ai.totalCost, color: '#8884d8' },
        { name: 'WhatsApp', value: data.breakdown.whatsapp.totalCost, color: '#82ca9d' },
        { name: 'Maps', value: data.breakdown.googleMaps.totalCost, color: '#ffc658' },
    ].filter(d => d.value > 0);

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cost Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Analyze costs and configure API pricing.
                    </p>
                </div>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cost Overview */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Cost Breakdown</CardTitle>
                        <CardDescription>
                            Total Cost: <span className="text-primary font-bold">{formatCurrency(data.totalCost)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">% of Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">AI Generation</TableCell>
                                    <TableCell>
                                        {data.breakdown.ai.totalCalls.toLocaleString()} calls
                                        <div className="text-xs text-muted-foreground">
                                            {(data.breakdown.ai.tokensInput + data.breakdown.ai.tokensOutput).toLocaleString()} tokens
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(data.breakdown.ai.totalCost)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {((data.breakdown.ai.totalCost / data.totalCost) * 100).toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">WhatsApp</TableCell>
                                    <TableCell>
                                        {data.breakdown.whatsapp.totalMessages.toLocaleString()} msgs
                                        <div className="text-xs text-muted-foreground">
                                            {data.breakdown.whatsapp.mediaCount} media
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(data.breakdown.whatsapp.totalCost)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {((data.breakdown.whatsapp.totalCost / data.totalCost) * 100).toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Google Maps</TableCell>
                                    <TableCell>
                                        {data.breakdown.googleMaps.totalCalls.toLocaleString()} requests
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(data.breakdown.googleMaps.totalCost)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {((data.breakdown.googleMaps.totalCost / data.totalCost) * 100).toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Distribution Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Pricing Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing Configuration
                    </CardTitle>
                    <CardDescription>
                        Update the cost basis for usage calculations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider / Type</TableHead>
                                <TableHead>Cost Config</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.pricing?.map((config) => (
                                <TableRow key={config.provider}>
                                    <TableCell>
                                        <div className="font-medium">{config.provider}</div>
                                        <div className="text-sm text-muted-foreground capitalize">{config.api_type.replace('_', ' ')}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{config.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        {editingId === config.provider ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {config.api_type === 'ai' && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Input ($/1M)</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={editValues.cost_per_input_token}
                                                                onChange={e => setEditValues({ ...editValues, cost_per_input_token: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Output ($/1M)</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={editValues.cost_per_output_token}
                                                                onChange={e => setEditValues({ ...editValues, cost_per_output_token: e.target.value })}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                                {(config.api_type === 'whatsapp' || config.api_type === 'google_maps') && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Per Request ($)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            value={config.api_type === 'whatsapp' ? editValues.cost_per_message : editValues.cost_per_request}
                                                            onChange={e => config.api_type === 'whatsapp'
                                                                ? setEditValues({ ...editValues, cost_per_message: e.target.value })
                                                                : setEditValues({ ...editValues, cost_per_request: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-1 text-sm">
                                                {config.api_type === 'ai' && (
                                                    <>
                                                        <div>Input: <span className="font-medium">${config.cost_per_input_token}</span> / 1M tokens</div>
                                                        <div>Output: <span className="font-medium">${config.cost_per_output_token}</span> / 1M tokens</div>
                                                    </>
                                                )}
                                                {config.api_type === 'whatsapp' && (
                                                    <div>Per Msg: <span className="font-medium">${config.cost_per_message}</span></div>
                                                )}
                                                {config.api_type === 'google_maps' && (
                                                    <div>Per Request: <span className="font-medium">${config.cost_per_request}</span></div>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === config.provider ? (
                                            <div className="flex flex-col gap-2">
                                                <Button size="sm" onClick={() => handleSave(config.provider)} disabled={isUpdating}>
                                                    <Save className="h-4 w-4 mr-1" /> Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={isUpdating}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                                                Edit
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
