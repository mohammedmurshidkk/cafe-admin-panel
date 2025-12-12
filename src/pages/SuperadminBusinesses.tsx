import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BusinessFormModal } from '@/components/superadmin/BusinessFormModal';
import { CreateAdminModal } from '@/components/superadmin/CreateAdminModal';
import { 
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useToggleBusinessStatusMutation,
  useCreateBusinessAdminMutation,
} from '@/store/api/superadminApi';
import { SuperadminBusiness, SuperadminBusinessFormData } from '@/types';
import { formatDate } from '@/utils/formatters';
import { Plus, Search, Pencil, Power } from 'lucide-react';
import { toast } from 'sonner';

const SuperadminBusinesses = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<SuperadminBusiness | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newBusinessForAdmin, setNewBusinessForAdmin] = useState<SuperadminBusiness | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<SuperadminBusiness | null>(null);

  const { data, isLoading } = useGetBusinessesQuery({ search });
  const [createBusiness, { isLoading: isCreating }] = useCreateBusinessMutation();
  const [updateBusiness, { isLoading: isUpdating }] = useUpdateBusinessMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleBusinessStatusMutation();
  const [createAdmin, { isLoading: isCreatingAdmin }] = useCreateBusinessAdminMutation();

  // Redirect if not superadmin
  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreate = async (formData: SuperadminBusinessFormData) => {
    try {
      const result = await createBusiness(formData).unwrap();
      toast.success('Business created successfully');
      setIsFormOpen(false);
      // Prompt to create admin
      setNewBusinessForAdmin(result.business);
      setIsAdminModalOpen(true);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to create business');
    }
  };

  const handleUpdate = async (formData: SuperadminBusinessFormData) => {
    if (!selectedBusiness) return;
    try {
      await updateBusiness({ id: selectedBusiness.id, ...formData }).unwrap();
      toast.success('Business updated successfully');
      setIsFormOpen(false);
      setSelectedBusiness(null);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to update business');
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleConfirm) return;
    try {
      await toggleStatus({ 
        id: toggleConfirm.id, 
        is_active: !toggleConfirm.is_active 
      }).unwrap();
      toast.success(`Business ${toggleConfirm.is_active ? 'deactivated' : 'activated'}`);
      setToggleConfirm(null);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to update status');
    }
  };

  const handleCreateAdmin = async (name: string, email: string, password: string) => {
    if (!newBusinessForAdmin) return;
    try {
      await createAdmin({ 
        name,
        email, 
        password, 
        business_id: newBusinessForAdmin.id 
      }).unwrap();
      toast.success('Admin user created successfully');
      setIsAdminModalOpen(false);
      setNewBusinessForAdmin(null);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to create admin');
    }
  };

  const columns = [
    { 
      key: 'name' as const, 
      header: 'Business Name',
      className: 'font-medium',
    },
    { 
      key: 'phone' as const, 
      header: 'Phone',
    },
    { 
      key: 'is_active' as const, 
      header: 'Status',
      render: (business: SuperadminBusiness) => (
        <Badge variant={business.is_active ? 'confirmed' : 'secondary'}>
          {business.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { 
      key: 'admin_count' as const, 
      header: 'Admins',
      render: (business: SuperadminBusiness) => (
        <span className="text-muted-foreground">{business.admin_count}</span>
      ),
    },
    { 
      key: 'created_at' as const, 
      header: 'Created',
      render: (business: SuperadminBusiness) => formatDate(business.created_at),
    },
    { 
      key: 'actions' as const, 
      header: 'Actions',
      render: (business: SuperadminBusiness) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBusiness(business);
              setIsFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setToggleConfirm(business);
            }}
          >
            <Power className={`h-4 w-4 ${business.is_active ? 'text-destructive' : 'text-success'}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Business Management" 
        description="Manage all businesses on the platform"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setSelectedBusiness(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Business
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.businesses || []}
        isLoading={isLoading}
        emptyMessage="No businesses found"
      />

      <BusinessFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedBusiness(null); }}
        onSubmit={selectedBusiness ? handleUpdate : handleCreate}
        business={selectedBusiness}
        isLoading={isCreating || isUpdating}
      />

      <CreateAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => { setIsAdminModalOpen(false); setNewBusinessForAdmin(null); }}
        onSubmit={handleCreateAdmin}
        businessName={newBusinessForAdmin?.name || ''}
        isLoading={isCreatingAdmin}
      />

      <ConfirmDialog
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={handleToggleStatus}
        title={toggleConfirm?.is_active ? 'Deactivate Business' : 'Activate Business'}
        description={`Are you sure you want to ${toggleConfirm?.is_active ? 'deactivate' : 'activate'} "${toggleConfirm?.name}"?`}
        confirmLabel={toggleConfirm?.is_active ? 'Deactivate' : 'Activate'}
        variant={toggleConfirm?.is_active ? 'destructive' : 'default'}
        isLoading={isToggling}
      />
    </div>
  );
};

export default SuperadminBusinesses;
