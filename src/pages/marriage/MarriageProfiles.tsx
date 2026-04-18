import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  useGetProfilesQuery,
  useGetMarriageDashboardStatsQuery,
  useDeleteProfileMutation,
} from '@/store/api/marriageApi';
import { MarriageProfile } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MarriageProfiles() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetProfilesQuery({ active: false });
  const { data: stats } = useGetMarriageDashboardStatsQuery();
  const [deleteProfile] = useDeleteProfileMutation();

  const profiles = (data?.profiles ?? []).filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.profile_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProfile(deleteId).unwrap();
      toast.success('Profile deleted');
    } catch {
      toast.error('Failed to delete profile');
    }
    setDeleteId(null);
  };

  const statCards = [
    {
      label: 'Total Active',
      value: stats?.total_active_profiles ?? '—',
      icon: 'people',
    },
    {
      label: 'Added This Week',
      value: stats?.new_profiles_this_week != null ? `+${stats.new_profiles_this_week}` : '—',
      icon: 'person_add',
    },
    {
      label: 'Pending Interests',
      value: stats?.pending_interest_requests ?? '—',
      icon: 'favorite',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Profiles</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage marriage candidate profiles</p>
        </div>
        <button
          onClick={() => navigate('/marriage/profiles/new')}
          className="flex items-center gap-2 bg-primary-container text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon }) => (
          <div key={label} className="bg-white border border-on-surface/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-3xl font-bold text-on-surface">
              {isLoading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-on-surface/10 rounded-2xl overflow-hidden">
        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/40">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-low rounded-lg border border-transparent focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant transition-colors"
            />
          </div>
          <button className="flex items-center gap-1.5 text-sm text-on-surface-variant border border-outline-variant/60 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="flex items-center gap-1.5 text-sm text-on-surface-variant border border-outline-variant/60 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors ml-auto">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-widest">
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Gender</th>
                <th className="px-4 py-3 text-left font-medium">Age</th>
                <th className="px-4 py-3 text-left font-medium">Religion</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Profession</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-on-surface-variant text-sm">
                    Loading profiles...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-on-surface-variant text-sm">
                    {search ? 'No profiles match your search.' : 'No profiles yet. Add the first one.'}
                  </td>
                </tr>
              ) : (
                profiles.map((profile: MarriageProfile) => (
                  <tr
                    key={profile.id}
                    className="hover:bg-surface-container-low transition-colors cursor-default"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                      {profile.profile_code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center text-xs font-bold text-brand-primary flex-shrink-0">
                          {getInitials(profile.name)}
                        </div>
                        <span className="font-medium text-on-surface">{profile.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-on-surface-variant">
                      {profile.gender}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {profile.age ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {profile.religion ?? '—'}
                      {profile.religion_sect && (
                        <span className="text-xs ml-1 opacity-60">({profile.religion_sect})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {[profile.location_city, profile.location_country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {profile.profession ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        profile.is_active
                          ? 'bg-tertiary-ds/10 text-tertiary-ds'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          profile.is_active ? 'bg-tertiary-ds' : 'bg-on-surface-variant/50'
                        }`} />
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => navigate(`/marriage/profiles/${profile.id}/edit`)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
                          title="Edit profile"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteId(profile.id)}
                          className="p-1.5 rounded-lg hover:bg-error-container hover:text-on-error-container transition-colors text-on-surface-variant"
                          title="Delete profile"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && profiles.length > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant/40">
            <span className="text-xs text-on-surface-variant">
              Showing {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Profile"
        description="This will permanently remove the profile. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
