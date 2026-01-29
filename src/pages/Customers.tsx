import { useState } from 'react';
import {
    Search,
    Users,
    UserCheck,
    UserPlus,
    AlertTriangle,
    UserMinus,
    Download,
    Filter,
    MoreVertical,
    Phone,
    Calendar,
    CreditCard
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    useGetCustomerProfilesQuery,
    useGetSegmentCountsQuery,
    CustomerSegment
} from '@/store/api/customersApi';
import { formatCurrency, formatPhone, formatDateTime } from '@/utils/formatters';
import { CustomerProfileDrawer } from '@/components/customers/CustomerProfileDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Customers = () => {
    const [activeSegment, setActiveSegment] = useState<CustomerSegment | 'all'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const { data: counts } = useGetSegmentCountsQuery();
    const { data, isLoading } = useGetCustomerProfilesQuery({
        segment: activeSegment,
        search: search.length > 2 ? search : undefined,
        page,
        limit: 20
    });

    const getSegmentBadge = (segment: CustomerSegment) => {
        switch (segment) {
            case 'vip': return <Badge className="bg-success text-success-foreground">🟢 VIP</Badge>;
            case 'returning': return <Badge variant="secondary">🔵 Returning</Badge>;
            case 'at_risk': return <Badge variant="outline" className="border-warning text-warning">🟡 At Risk</Badge>;
            case 'churned': return <Badge variant="destructive">🔴 Churned</Badge>;
            case 'new': return <Badge className="bg-primary/20 text-primary border-primary/20">⚪ New</Badge>;
            default: return <Badge variant="outline">{segment}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Customer CRM"
                    description="Manage your relationships and view customer segments."
                />
                <Button variant="outline" className="w-fit">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <Tabs
                value={activeSegment}
                onValueChange={(v) => {
                    setActiveSegment(v as any);
                    setPage(1);
                }}
                className="w-full"
            >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="all">All ({counts?.all ?? 0})</TabsTrigger>
                        <TabsTrigger value="new">New ({counts?.new ?? 0})</TabsTrigger>
                        <TabsTrigger value="returning">Returning ({counts?.returning ?? 0})</TabsTrigger>
                        <TabsTrigger value="vip">VIP ({counts?.vip ?? 0})</TabsTrigger>
                        <TabsTrigger value="at_risk">At Risk ({counts?.at_risk ?? 0})</TabsTrigger>
                        <TabsTrigger value="churned">Churned ({counts?.churned ?? 0})</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Segment</TableHead>
                                    <TableHead>Orders</TableHead>
                                    <TableHead>Total Spent</TableHead>
                                    <TableHead>First Order</TableHead>
                                    <TableHead>Last Order</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-10 w-10" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : data?.profiles?.length ? (
                                    data.profiles.map((profile) => (
                                        <TableRow
                                            key={profile.customer_id}
                                            className="cursor-pointer hover:bg-muted/20"
                                            onClick={() => setSelectedCustomerId(profile.customer_id)}
                                        >
                                            <TableCell className="font-medium">
                                                <div>
                                                    <p>{profile.customer.name || '-'}</p>
                                                    <p className="text-xs text-muted-foreground">{formatPhone(profile.customer.phone)}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getSegmentBadge(profile.segment)}</TableCell>
                                            <TableCell>{profile.total_orders}</TableCell>
                                            <TableCell className="font-semibold text-primary">
                                                {formatCurrency(profile.total_spent)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDateTime(profile.first_order_at)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDateTime(profile.last_order_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No customers found in this segment.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Tabs>

            <CustomerProfileDrawer
                customerId={selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
            />
        </div>
    );
};

export default Customers;
