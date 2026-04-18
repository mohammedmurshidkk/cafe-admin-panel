// src/pages/marriage/MarriageInterests.tsx

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetInterestRequestsQuery, useUpdateInterestRequestMutation } from '@/store/api/marriageApi';
import { InterestRequest } from '@/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  pending: 'default',
  contacted: 'secondary',
  closed: 'outline',
};

export default function MarriageInterests() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selected, setSelected] = useState<InterestRequest | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useGetInterestRequestsQuery({ status: statusFilter || undefined });
  const [updateRequest] = useUpdateInterestRequestMutation();
  const requests = data?.requests ?? [];

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateRequest({ id, status, admin_note: note }).unwrap();
      toast.success('Updated successfully');
      setSelected(null);
      setNote('');
    } catch {
      toast.error('Failed to update');
    }
  };

  const columns = [
    {
      key: 'seeker', header: 'Seeker',
      render: (row: InterestRequest) => row.seeker?.name ?? row.seeker?.phone ?? '—'
    },
    {
      key: 'profile', header: 'Interested In',
      render: (row: InterestRequest) => row.profile
        ? `${row.profile.profile_code} — ${row.profile.name}, ${row.profile.age ?? '?'}`
        : '—'
    },
    {
      key: 'status', header: 'Status',
      render: (row: InterestRequest) => <Badge variant={STATUS_COLORS[row.status] ?? 'outline'}>{row.status}</Badge>
    },
    {
      key: 'created_at', header: 'Received',
      render: (row: InterestRequest) => formatDistanceToNow(new Date(row.created_at), { addSuffix: true })
    },
    {
      key: 'actions', header: '',
      render: (row: InterestRequest) => row.status === 'pending' && (
        <Button size="sm" onClick={() => { setSelected(row); setNote(row.admin_note ?? ''); }}>
          Manage
        </Button>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Interest Requests" description={`${requests.length} requests`} />
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="contacted">Contacted</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable columns={columns} data={requests} isLoading={isLoading} />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Interest Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>Seeker:</strong> {selected.seeker?.name ?? '—'} ({selected.seeker?.phone})</p>
                <p><strong>Profile:</strong> {selected.profile?.profile_code} — {selected.profile?.name}</p>
                <p><strong>Profile Location:</strong> {selected.profile?.location_city ?? '—'}</p>
              </div>
              <Textarea
                placeholder="Admin note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleUpdate(selected.id, 'contacted')} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-1" /> Mark Contacted
                </Button>
                <Button variant="outline" onClick={() => handleUpdate(selected.id, 'closed')} className="flex-1">
                  <XCircle className="w-4 h-4 mr-1" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
