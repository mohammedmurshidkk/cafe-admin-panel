// src/pages/marriage/MarriageSeekers.tsx

import { Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useGetSeekersQuery, useUpdateSeekerBlockMutation } from '@/store/api/marriageApi';
import { MarriageSeeker } from '@/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function MarriageSeekers() {
  const { data, isLoading } = useGetSeekersQuery();
  const [updateBlock] = useUpdateSeekerBlockMutation();
  const seekers = data?.seekers ?? [];

  const toggleBlock = async (seeker: MarriageSeeker) => {
    try {
      await updateBlock({ id: seeker.id, is_blocked: !seeker.is_blocked }).unwrap();
      toast.success(seeker.is_blocked ? 'Seeker unblocked' : 'Seeker blocked');
    } catch {
      toast.error('Failed to update seeker');
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (row: MarriageSeeker) => row.name ?? '—' },
    { key: 'phone', header: 'Phone' },
    { key: 'religion', header: 'Religion', render: (row: MarriageSeeker) => `${row.religion ?? '—'}${row.religion_sect ? ` (${row.religion_sect})` : ''}` },
    { key: 'location_city', header: 'Location', render: (row: MarriageSeeker) => row.location_city ?? '—' },
    { key: 'profession', header: 'Profession', render: (row: MarriageSeeker) => row.profession ?? '—' },
    {
      key: 'profile_submitted', header: 'Profile',
      render: (row: MarriageSeeker) => <Badge variant={row.profile_submitted ? 'default' : 'secondary'}>{row.profile_submitted ? 'Submitted' : 'Pending'}</Badge>
    },
    {
      key: 'registered_at', header: 'Registered',
      render: (row: MarriageSeeker) => formatDistanceToNow(new Date(row.registered_at), { addSuffix: true })
    },
    {
      key: 'is_blocked', header: 'Status',
      render: (row: MarriageSeeker) => <Badge variant={row.is_blocked ? 'destructive' : 'outline'}>{row.is_blocked ? 'Blocked' : 'Active'}</Badge>
    },
    {
      key: 'actions', header: '',
      render: (row: MarriageSeeker) => (
        <Button size="sm" variant="ghost" onClick={() => toggleBlock(row)}>
          {row.is_blocked ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4 text-red-500" />}
        </Button>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Seekers" description={`${seekers.length} registered seekers`} />
      <DataTable columns={columns} data={seekers} isLoading={isLoading} />
    </div>
  );
}
