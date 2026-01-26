import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateMenuItemMutation } from '@/store/api/menuApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { Upload, FileText, Check, AlertCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
// import Papa from 'papaparse';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface MenuImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ParsedItem {
    Name: string;
    Description?: string;
    Category?: string;
    Price?: string;
    status?: 'valid' | 'error';
    error?: string;
    categoryId?: string;
}

export const MenuImportModal = ({ open, onOpenChange }: MenuImportModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedItem[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categoriesData } = useGetCategoriesQuery();
    const [createMenuItem] = useCreateMenuItemMutation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        setIsParsing(true);
        // Papa.parse(file, {
        //     header: true,
        //     skipEmptyLines: true,
        //     complete: (results) => {
        //         const items = results.data as any[];
        //         validateItems(items);
        //         setIsParsing(false);
        //     },
        //     error: (error) => {
        //         toast.error(`Error parsing CSV: ${error.message}`);
        //         setIsParsing(false);
        //     }
        // });
    };

    const validateItems = (items: any[]) => {
        const validated = items.map((item, index) => {
            const name = item.Name || item.name;
            const price = parseFloat(item.Price || item.price || '0');
            const categoryName = item.Category || item.category;

            // Find category ID
            const category = categoriesData?.categories.find(c =>
                c.name.toLowerCase() === categoryName?.toLowerCase()
            );

            let status: 'valid' | 'error' = 'valid';
            let error = '';

            if (!name) {
                status = 'error';
                error = 'Name is required';
            } else if (isNaN(price)) {
                status = 'error';
                error = 'Invalid Price';
            } else if (!category) {
                status = 'error';
                error = `Category "${categoryName}" not found`;
            }

            return {
                Name: name,
                Description: item.Description || item.description || '',
                Category: categoryName,
                Price: item.Price || item.price,
                status,
                error,
                categoryId: category?.id
            };
        });
        setParsedData(validated);
    };

    const handleImport = async () => {
        const validItems = parsedData.filter(i => i.status === 'valid');
        if (validItems.length === 0) return;

        setImporting(true);
        setProgress({ current: 0, total: validItems.length });

        let successCount = 0;
        let failCount = 0;

        for (const item of validItems) {
            try {
                await createMenuItem({
                    name: item.Name,
                    description: item.Description,
                    category_id: item.categoryId!,
                    price: parseFloat(item.Price || '0'),
                    pricing_type: 'single',
                    sizes: [{ name: '', price: 0 }],
                    is_available: true,
                    is_customizable: false,
                    requires_date: false,
                    is_featured: false,
                    special_notes: ''
                }).unwrap();
                successCount++;
            } catch (err) {
                failCount++;
                console.error('Failed to import item', item.Name, err);
            }
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }

        setImporting(false);
        toast.success(`Import completed: ${successCount} success, ${failCount} failed`);
        if (successCount === validItems.length) {
            onOpenChange(false);
            setFile(null);
            setParsedData([]);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "Name,Description,Category,Price\nBurger,Delicious chicken burger,Burgers,12.99\nCoke,Chilled cola,Drinks,2.50";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "menu_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const validCount = parsedData.filter(i => i.status === 'valid').length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Menu Items</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk import menu items. Ensure categories exist beforehand.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Actions Bar */}
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <Download className="mr-2 h-4 w-4" /> Download Template
                        </Button>
                        <div className="flex-1" />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Select CSV
                        </Button>
                    </div>

                    {/* Preview Table */}
                    {parsedData.length > 0 ? (
                        <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                            <div className="bg-muted px-4 py-2 border-b flex justify-between items-center text-sm">
                                <span>Found {parsedData.length} items ({validCount} valid)</span>
                                {parsedData.length > validCount && (
                                    <span className="text-destructive font-medium">
                                        {parsedData.length - validCount} errors
                                    </span>
                                )}
                            </div>
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    {item.status === 'valid' ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-destructive">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <span className="text-xs">{item.error}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.Name}</TableCell>
                                                <TableCell>{item.Category}</TableCell>
                                                <TableCell>{item.Price}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{item.Description}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="flex-1 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground p-8">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <p>No file selected</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    {importing && (
                        <div className="flex items-center mr-auto text-sm text-muted-foreground">
                            Importing {progress.current} of {progress.total}...
                        </div>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={importing || validCount === 0}
                        variant="gradient"
                    >
                        {importing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                        ) : (
                            `Import ${validCount} Items`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
