import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useGetBusinessesQuery,
  useGetDataSummaryQuery,
  useCheckClearDependenciesMutation,
  useClearBusinessDataMutation,
} from '@/store/api/superadminApi';
import { DataSummary, DependencyCheck } from '@/types';
import { toast } from 'sonner';
import {
  Trash2,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  ShoppingCart,
  Users,
  Megaphone,
  Bell,
  BarChart3,
  Cake,
  FileText,
  LayoutGrid,
  UtensilsCrossed,
  PlusCircle,
  Link2,
} from 'lucide-react';

// Icon mapping for data types
const dataTypeIcons: Record<string, typeof MessageSquare> = {
  messages: MessageSquare,
  sessions: FileText,
  session_items: ShoppingCart,
  session_item_addons: ShoppingCart,
  orders: ShoppingCart,
  customers: Users,
  customer_profiles: Users,
  campaigns: Megaphone,
  campaign_messages: Megaphone,
  notifications: Bell,
  interventions: AlertTriangle,
  cake_price_quotes: Cake,
  analytics: BarChart3,
  // Menu management
  menu_categories: LayoutGrid,
  menu_items: UtensilsCrossed,
  menu_addons: PlusCircle,
  category_addons: Link2,
};

const SuperAdminDataClear = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [dependencyResult, setDependencyResult] = useState<DependencyCheck | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: businessesData, isLoading: isLoadingBusinesses } = useGetBusinessesQuery({
    search: '',
    page: 1,
    limit: 100,
  });

  const { data: summaryData, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetDataSummaryQuery(
    selectedBusinessId,
    { skip: !selectedBusinessId }
  );

  const [checkDependencies, { isLoading: isCheckingDeps }] = useCheckClearDependenciesMutation();
  const [clearData, { isLoading: isClearing }] = useClearBusinessDataMutation();

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const businesses = businessesData?.businesses || [];
  const dataSummary = summaryData?.summary || [];

  const handleCheckDependencies = async (dataType: string) => {
    if (!selectedBusinessId) return;

    setSelectedDataType(dataType);
    setDependencyResult(null);

    try {
      const result = await checkDependencies({
        businessId: selectedBusinessId,
        dataType,
      }).unwrap();
      setDependencyResult(result);
    } catch {
      toast.error('Failed to check dependencies');
    }
  };

  const handleClearData = async () => {
    if (!selectedBusinessId || !selectedDataType) return;

    try {
      const result = await clearData({
        businessId: selectedBusinessId,
        dataType: selectedDataType,
        confirm: true,
      }).unwrap();

      if (result.success) {
        toast.success(`Deleted ${result.deleted_count} records`);
        setDependencyResult(null);
        setSelectedDataType('');
        refetchSummary();
      } else {
        toast.error(result.errors?.join(', ') || 'Failed to clear data');
      }
    } catch {
      toast.error('Failed to clear data');
    }

    setShowConfirmDialog(false);
  };

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Clear Tool"
        description="Clear tenant data with dependency handling"
        icon={<Trash2 className="h-6 w-6" />}
      />

      {/* Business Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Business</CardTitle>
          <CardDescription>Choose a business to manage its data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a business..." />
            </SelectTrigger>
            <SelectContent>
              {isLoadingBusinesses ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{business.name}</span>
                      {!business.is_active && (
                        <Badge variant="secondary" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data Summary */}
      {selectedBusinessId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedBusiness?.name || 'Selected Business'} - Data Summary
            </CardTitle>
            <CardDescription>
              Click "Check" to verify dependencies before clearing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : dataSummary.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No data found for this business
              </p>
            ) : (
              <div className="space-y-3">
                {dataSummary.map((item: DataSummary) => {
                  const Icon = dataTypeIcons[item.data_type] || FileText;
                  const isSelected = selectedDataType === item.data_type;
                  const canClear = isSelected && dependencyResult?.can_clear;
                  const hasBlockers =
                    isSelected && dependencyResult && !dependencyResult.can_clear;

                  return (
                    <div
                      key={item.data_type}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isSelected ? 'border-primary bg-primary/5' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{item.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.count.toLocaleString()} records
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && dependencyResult && (
                          <div className="flex items-center gap-2 mr-4">
                            {canClear ? (
                              <Badge variant="confirmed" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Can clear
                              </Badge>
                            ) : hasBlockers ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Blocked
                              </Badge>
                            ) : null}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckDependencies(item.data_type)}
                          disabled={isCheckingDeps || item.count === 0}
                        >
                          {isCheckingDeps && isSelected ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Check'
                          )}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={!canClear || item.count === 0}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dependency Details */}
      {dependencyResult && !dependencyResult.can_clear && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cannot Clear - Dependencies Found
            </CardTitle>
            <CardDescription>
              Clear these related data types first before clearing{' '}
              {dataSummary.find((d) => d.data_type === selectedDataType)?.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dependencyResult.blocked_by.map((blocker) => (
                <div
                  key={blocker.table}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/10"
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium">{blocker.display_name}</span>
                  </div>
                  <Badge variant="secondary">{blocker.count} records</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete all{' '}
                <strong>
                  {dataSummary.find((d) => d.data_type === selectedDataType)?.display_name}
                </strong>{' '}
                data for <strong>{selectedBusiness?.name}</strong>.
              </p>
              <p className="font-semibold text-destructive">
                This action cannot be undone!
              </p>
              <p>
                Records to be deleted:{' '}
                <strong>
                  {dataSummary
                    .find((d) => d.data_type === selectedDataType)
                    ?.count.toLocaleString()}
                </strong>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminDataClear;
