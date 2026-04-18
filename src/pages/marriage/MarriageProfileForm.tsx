import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetProfilesQuery,
  useAddProfileMutation,
  useUpdateProfileMutation,
  useGetMastersQuery,
} from '@/store/api/marriageApi';
import { MarriageProfile } from '@/types';
import { toast } from 'sonner';

const INCOME_OPTIONS = ['< 5 LPA', '5–10 LPA', '10–20 LPA', '20+ LPA'];

const EMPTY: Partial<MarriageProfile> = {
  name: '',
  gender: 'female',
  is_active: true,
};

interface SectionCardProps {
  icon: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, description, children }: SectionCardProps) {
  return (
    <div className="bg-white border border-on-surface/10 rounded-2xl overflow-hidden">
      <div className="flex items-start gap-3 px-6 py-4 border-b border-outline-variant/30">
        <span className="material-symbols-outlined text-[22px] text-primary-container mt-0.5">{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-on-surface">{title}</h2>
          {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
        {label}{required && <span className="text-primary-container ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg border border-transparent focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/60 transition-colors';

const selectClass =
  'w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg border border-transparent focus:outline-none focus:border-primary-container text-on-surface transition-colors appearance-none cursor-pointer';

export default function MarriageProfileForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: mastersData } = useGetMastersQuery();
  const { data } = useGetProfilesQuery({ active: false }, { skip: !isEdit });
  const [addProfile, { isLoading: adding }] = useAddProfileMutation();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const isSaving = adding || updating;

  const [form, setForm] = useState<Partial<MarriageProfile>>(EMPTY);

  useEffect(() => {
    if (isEdit && data?.profiles) {
      const profile = data.profiles.find(p => p.id === id);
      if (profile) setForm(profile);
    }
  }, [isEdit, data, id]);

  const set = (key: keyof MarriageProfile, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // When district changes, clear the place selection
  const handleDistrictChange = (districtValue: string) => {
    const districtText = mastersData?.districts.find(d => d.value === districtValue)?.text ?? '';
    setForm(prev => ({ ...prev, location_district: districtText, location_city: '' }));
  };

  const handleReligionChange = (religionValue: string) => {
    const religionText = mastersData?.religions.find(r => r.value === religionValue)?.text ?? '';
    setForm(prev => ({ ...prev, religion: religionText, religion_sect: '' }));
  };

  const handlePrefReligionChange = (religionValue: string) => {
    const religionText = mastersData?.religions.find(r => r.value === religionValue)?.text ?? '';
    setForm(prev => ({ ...prev, preferred_religion: religionText, preferred_sect: '' }));
  };

  // Resolve current district value from stored district name
  const currentDistrictValue = mastersData?.districts.find(d => d.text === form.location_district)?.value ?? '';
  const currentReligionValue = mastersData?.religions.find(r => r.text === form.religion)?.value ?? '';
  const currentPrefReligionValue = mastersData?.religions.find(r => r.text === form.preferred_religion)?.value ?? '';

  const availablePlaces = currentDistrictValue ? (mastersData?.places[currentDistrictValue] ?? []) : [];
  const availableSects = currentReligionValue ? (mastersData?.sects[currentReligionValue] ?? []) : [];
  const availablePrefSects = currentPrefReligionValue ? (mastersData?.sects[currentPrefReligionValue] ?? []) : [];

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.gender) {
      toast.error('Name and gender are required');
      return;
    }
    try {
      if (isEdit && id) {
        await updateProfile({ id, data: form }).unwrap();
        toast.success('Profile updated');
      } else {
        await addProfile(form).unwrap();
        toast.success('Profile added');
      }
      navigate('/marriage/profiles');
    } catch {
      toast.error('Failed to save profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate('/marriage/profiles')}
          className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-0.5">
            <span className="material-symbols-outlined text-[14px]">favorite</span>
            <span>Marriage Profiles</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface">
            {isEdit ? 'Edit Candidate Profile' : 'Add Candidate Profile'}
          </h1>
        </div>
      </div>

      {/* 1. Basic Information */}
      <SectionCard
        icon="person"
        title="Basic Information"
        description="Identity and physical attributes"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Full Name" required>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Ayesha Rahman"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="col-span-2">
            <Field label="Gender" required>
              <div className="flex gap-3">
                {(['female', 'male'] as const).map(g => (
                  <label
                    key={g}
                    className={`flex items-center gap-2.5 flex-1 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      form.gender === g
                        ? 'border-primary-container bg-primary-container/5 text-on-surface'
                        : 'border-outline-variant/60 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.gender === g ? 'border-primary-container' : 'border-on-surface-variant/40'
                    }`}>
                      {form.gender === g && (
                        <div className="w-2 h-2 rounded-full bg-primary-container" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => set('gender', g)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Age">
            <input
              type="number"
              value={form.age ?? ''}
              onChange={e => set('age', Number(e.target.value) || undefined)}
              placeholder="e.g. 26"
              min={18}
              max={80}
              className={inputClass}
            />
          </Field>

          <Field label="Marital Status">
            <select
              value={mastersData?.marital_statuses.find(m => m.text === form.marital_status)?.value ?? ''}
              onChange={e => {
                const text = mastersData?.marital_statuses.find(m => m.value === e.target.value)?.text ?? '';
                set('marital_status', text);
              }}
              className={selectClass}
            >
              <option value="">Select status</option>
              {mastersData?.marital_statuses.map(o => (
                <option key={o.value} value={o.value}>{o.text}</option>
              ))}
            </select>
          </Field>

          <Field label="Height">
            <select
              value={mastersData?.heights.find(h => h.text === form.height || h.value === form.height)?.value ?? ''}
              onChange={e => {
                const item = mastersData?.heights.find(h => h.value === e.target.value);
                set('height', item?.text ?? '');
              }}
              className={selectClass}
            >
              <option value="">Select height</option>
              {mastersData?.heights.map(h => (
                <option key={h.value} value={h.value}>{h.text}</option>
              ))}
            </select>
          </Field>

          <Field label="Weight">
            <select
              value={mastersData?.weights.find(w => w.text === form.weight || w.value === form.weight)?.value ?? ''}
              onChange={e => {
                const item = mastersData?.weights.find(w => w.value === e.target.value);
                set('weight', item?.text ?? '');
              }}
              className={selectClass}
            >
              <option value="">Select weight</option>
              {mastersData?.weights.map(w => (
                <option key={w.value} value={w.value}>{w.text}</option>
              ))}
            </select>
          </Field>

          <div className="col-span-2">
            <Field label="Description / Notes">
              <textarea
                value={form.description ?? ''}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of the candidate..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* 2. Religion & Heritage */}
      <SectionCard
        icon="auto_awesome"
        title="Religion & Heritage"
        description="Faith background and cultural identity"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Religion">
            <select
              value={currentReligionValue}
              onChange={e => handleReligionChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select religion</option>
              {mastersData?.religions.map(r => (
                <option key={r.value} value={r.value}>{r.text}</option>
              ))}
            </select>
          </Field>

          <Field label="Sect / Division">
            {availableSects.length > 0 ? (
              <select
                value={mastersData?.sects[currentReligionValue]?.find(s => s.text === form.religion_sect)?.value ?? ''}
                onChange={e => {
                  const text = mastersData?.sects[currentReligionValue]?.find(s => s.value === e.target.value)?.text ?? '';
                  set('religion_sect', text);
                }}
                className={selectClass}
              >
                <option value="">Select sect</option>
                {availableSects.map(s => (
                  <option key={s.value} value={s.value}>{s.text}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.religion_sect ?? ''}
                onChange={e => set('religion_sect', e.target.value)}
                placeholder="e.g. Sunni, Shia"
                className={inputClass}
              />
            )}
          </Field>
        </div>
      </SectionCard>

      {/* 3. Current Location */}
      <SectionCard
        icon="location_on"
        title="Current Location"
        description="Where the candidate currently resides"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="District">
            <select
              value={currentDistrictValue}
              onChange={e => handleDistrictChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select district</option>
              {mastersData?.districts.map(d => (
                <option key={d.value} value={d.value}>{d.text}</option>
              ))}
            </select>
          </Field>

          <Field label="Place">
            {availablePlaces.length > 0 ? (
              <select
                value={availablePlaces.find(p => p.text === form.location_city)?.value ?? ''}
                onChange={e => {
                  const text = availablePlaces.find(p => p.value === e.target.value)?.text ?? '';
                  set('location_city', text);
                }}
                className={selectClass}
                disabled={!currentDistrictValue}
              >
                <option value="">Select place</option>
                {availablePlaces.map(p => (
                  <option key={p.value} value={p.value}>{p.text}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.location_city ?? ''}
                onChange={e => set('location_city', e.target.value)}
                placeholder={currentDistrictValue ? 'Type place name' : 'Select district first'}
                disabled={!currentDistrictValue}
                className={inputClass}
              />
            )}
          </Field>
        </div>
      </SectionCard>

      {/* 4. Education & Profession */}
      <SectionCard
        icon="work"
        title="Education & Profession"
        description="Academic and career background"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Highest Education">
            <input
              type="text"
              value={form.education ?? ''}
              onChange={e => set('education', e.target.value)}
              placeholder="e.g. B.Tech, MBBS, MBA"
              className={inputClass}
            />
          </Field>

          <Field label="Occupation">
            <input
              type="text"
              value={form.profession ?? ''}
              onChange={e => set('profession', e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputClass}
            />
          </Field>

          <div className="col-span-2">
            <Field label="Annual Income">
              <div className="flex gap-2 flex-wrap">
                {INCOME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('income_range', form.income_range === opt ? '' : opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.income_range === opt
                        ? 'bg-primary-container text-white border-primary-container'
                        : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <input
                  type="text"
                  value={INCOME_OPTIONS.includes(form.income_range ?? '') ? '' : (form.income_range ?? '')}
                  onChange={e => set('income_range', e.target.value)}
                  placeholder="Or type custom..."
                  className="flex-1 min-w-[140px] px-3 py-2 text-sm bg-surface-container-low rounded-lg border border-transparent focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/60 transition-colors"
                />
              </div>
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* 5. Partner Preferences */}
      <SectionCard
        icon="favorite"
        title="Partner Preferences"
        description="What this candidate is looking for"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Preferred Age (Min)">
            <input
              type="number"
              value={form.preferred_age_min ?? ''}
              onChange={e => set('preferred_age_min', Number(e.target.value) || undefined)}
              placeholder="e.g. 24"
              min={18}
              className={inputClass}
            />
          </Field>

          <Field label="Preferred Age (Max)">
            <input
              type="number"
              value={form.preferred_age_max ?? ''}
              onChange={e => set('preferred_age_max', Number(e.target.value) || undefined)}
              placeholder="e.g. 32"
              min={18}
              className={inputClass}
            />
          </Field>

          <Field label="Preferred Religion">
            <select
              value={currentPrefReligionValue}
              onChange={e => handlePrefReligionChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Any religion</option>
              {mastersData?.religions.map(r => (
                <option key={r.value} value={r.value}>{r.text}</option>
              ))}
            </select>
          </Field>

          <Field label="Preferred Sect">
            {availablePrefSects.length > 0 ? (
              <select
                value={mastersData?.sects[currentPrefReligionValue]?.find(s => s.text === form.preferred_sect)?.value ?? ''}
                onChange={e => {
                  const text = mastersData?.sects[currentPrefReligionValue]?.find(s => s.value === e.target.value)?.text ?? '';
                  set('preferred_sect', text);
                }}
                className={selectClass}
              >
                <option value="">Any sect</option>
                {availablePrefSects.map(s => (
                  <option key={s.value} value={s.value}>{s.text}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.preferred_sect ?? ''}
                onChange={e => set('preferred_sect', e.target.value)}
                placeholder="Any"
                className={inputClass}
              />
            )}
          </Field>

          <div className="col-span-2">
            <Field label="Preferred District">
              <select
                value={mastersData?.districts.find(d => d.text === form.preferred_location)?.value ?? ''}
                onChange={e => {
                  const text = mastersData?.districts.find(d => d.value === e.target.value)?.text ?? '';
                  set('preferred_location', text);
                }}
                className={selectClass}
              >
                <option value="">Any district</option>
                {mastersData?.districts.map(d => (
                  <option key={d.value} value={d.value}>{d.text}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="col-span-2">
            <Field label="Other Requirements">
              <textarea
                value={form.other_demands ?? ''}
                onChange={e => set('other_demands', e.target.value)}
                placeholder="Any other specific requirements or preferences..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* 6. Profile Status */}
      <SectionCard icon="visibility" title="Profile Status">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">
              {form.is_active ? 'Active & Discoverable' : 'Hidden from Search'}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {form.is_active
                ? 'This profile is visible to seekers via the WhatsApp bot'
                : 'Inactive profiles are hidden from all bot searches'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set('is_active', !form.is_active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              form.is_active ? 'bg-primary-container' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                form.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </SectionCard>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/marriage/profiles')}
          className="px-5 py-2.5 text-sm font-medium text-on-surface border border-outline-variant/60 rounded-lg hover:bg-surface-container-low transition-colors"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-container text-white rounded-lg hover:bg-brand-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {isSaving ? 'Saving...' : isEdit ? 'Save Profile' : 'Add Profile'}
        </button>
      </div>
    </div>
  );
}
