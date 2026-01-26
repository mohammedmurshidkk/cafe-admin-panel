import { useState, useEffect } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetCustomersQuery } from '@/store/api/customersApi';
// import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface CustomerSelectorProps {
    initialSelection?: {
        type: 'all' | 'specific';
        includedIds: string[];
        excludedIds: string[];
    };
    onSelectionChange: (selection: {
        type: 'all' | 'specific';
        includedIds: string[];
        excludedIds: string[];
    }) => void;
}

export const CustomerSelector = ({ initialSelection, onSelectionChange }: CustomerSelectorProps) => {
    const [search, setSearch] = useState('');
    // const debouncedSearch = useDebounse(search, 500);

    // Selection State
    const [selectAll, setSelectAll] = useState(initialSelection?.type === 'all' || false);
    const [includedIds, setIncludedIds] = useState<Set<string>>(new Set(initialSelection?.includedIds || []));
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set(initialSelection?.excludedIds || []));

    // Pagination for infinite scroll - MVP just fetching first page or search results
    const { data, isLoading } = useGetCustomersQuery({
        search: search,
        page: 1,
        limit: 50 // Fetch a reasonable chunk
    });

    const customers = data?.customers || [];
    const totalCustomers = data?.pagination.total || 0;

    // Sync selection to parent
    useEffect(() => {
        onSelectionChange({
            type: selectAll ? 'all' : 'specific',
            includedIds: Array.from(includedIds),
            excludedIds: Array.from(excludedIds),
        });
    }, [selectAll, includedIds, excludedIds, onSelectionChange]);

    const handleToggleAll = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            setIncludedIds(new Set()); // Not needed when selectAll is true
            setExcludedIds(new Set());
        } else {
            setIncludedIds(new Set());
            setExcludedIds(new Set());
        }
    };

    const handleToggleCustomer = (customerId: string) => {
        if (selectAll) {
            // In "Select All" mode, toggling means adding/removing from excludedIds
            const newExcluded = new Set(excludedIds);
            if (newExcluded.has(customerId)) {
                newExcluded.delete(customerId);
            } else {
                newExcluded.add(customerId);
            }
            setExcludedIds(newExcluded);
        } else {
            // In "Specific" mode, toggling means adding/removing from includedIds
            const newIncluded = new Set(includedIds);
            if (newIncluded.has(customerId)) {
                newIncluded.delete(customerId);
            } else {
                newIncluded.add(customerId);
            }
            setIncludedIds(newIncluded);
        }
    };

    const isSelected = (customerId: string) => {
        if (selectAll) {
            return !excludedIds.has(customerId);
        }
        return includedIds.has(customerId);
    };

    const selectionCount = selectAll
        ? totalCustomers - excludedIds.size
        : includedIds.size;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                    Selected: {selectionCount} / {totalCustomers} Users
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAll(!selectAll)}
                >
                    {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or phone..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                            {isLoading ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                            ) : customers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No customers found</div>
                            ) : (
                                customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={cn(
                                            "flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                                            isSelected(customer.id) && "bg-muted/30"
                                        )}
                                        onClick={() => handleToggleCustomer(customer.id)}
                                    >
                                        <Checkbox
                                            checked={isSelected(customer.id)}
                                            onCheckedChange={() => handleToggleCustomer(customer.id)}
                                        />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{customer.name || 'Unknown User'}</p>
                                            <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {selectAll && excludedIds.size > 0 && (
                <p className="text-xs text-muted-foreground">
                    * You are sending to all customers EXCEPT {excludedIds.size} selected.
                </p>
            )}
        </div>
    );
};
