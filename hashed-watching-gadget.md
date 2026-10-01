# Campaign Management UI Upgrade - Implementation Plan

## Summary
Upgrade the basic campaign page to a full-featured campaign management system with image upload, WhatsApp preview, and campaign history.

## User Decisions
- **Layout:** Tabs (New Campaign | Campaign History)
- **Template Variables:** 3 fixed input fields
- **Scope:** All phases (full implementation)

---

## Files to Create

### 1. `src/components/ui/ImageUpload.tsx`
Reusable drag-drop image upload component:
- Drag-and-drop zone with dashed border
- Click to select file
- Image preview with remove button
- File size validation (max 5MB)
- Accept: jpg, png, gif, webp

### 2. `src/components/campaigns/CampaignForm.tsx`
Main form component with sections:
- Campaign Details (name, description)
- Image Upload (using ImageUpload component)
- Template Config (name, language dropdown, 3 body parameter fields)
- Target Audience (existing CustomerSelector)
- Action buttons (Save Draft, Send Campaign)

### 3. `src/components/campaigns/MessagePreview.tsx`
WhatsApp-style message preview:
- Phone mockup frame
- Image area
- Body text with variables filled in
- Timestamp and checkmarks

### 4. `src/components/campaigns/CampaignHistory.tsx`
Campaign history table:
- Columns: Name, Status (badge), Image thumbnail, Recipients, Success/Failed, Date, Actions
- Filter by status dropdown
- Search by name
- Pagination
- Row actions: View, Duplicate, Delete

### 5. `src/components/campaigns/CampaignDetailModal.tsx`
Modal to view full campaign details

---

## Files to Modify

### 1. `src/store/api/campaignsApi.ts`
Add new endpoints:
```
- uploadCampaignImage (POST /admin/campaigns/upload-image) - FormData
- createCampaign (POST /admin/campaigns/create)
- getCampaigns (GET /admin/campaigns) - with pagination, filters
- getCampaign (GET /admin/campaigns/:id)
- deleteCampaignImage (DELETE /admin/campaigns/delete-image)
- deleteCampaign (DELETE /admin/campaigns/:id) - if backend supports
```

### 2. `src/pages/Campaigns.tsx`
Replace current implementation with:
- Tabs component (New Campaign | History)
- Integrate CampaignForm in first tab
- Integrate CampaignHistory in second tab
- MessagePreview sidebar/card

---

## Implementation Order

### Step 1: API Layer
- Extend `campaignsApi.ts` with all endpoints
- Add TypeScript interfaces for Campaign types

### Step 2: ImageUpload Component
- Create reusable `ImageUpload.tsx`
- Drag-drop, preview, validation

### Step 3: MessagePreview Component
- Create `MessagePreview.tsx`
- WhatsApp-style bubble with image + text

### Step 4: CampaignForm Component
- Create `CampaignForm.tsx`
- All form sections
- Validation and submission logic

### Step 5: Update Campaigns Page
- Add Tabs structure
- Integrate CampaignForm
- Add MessagePreview alongside form

### Step 6: CampaignHistory Component
- Create `CampaignHistory.tsx`
- Table with filters and pagination

### Step 7: CampaignDetailModal
- Create modal for viewing details
- Duplicate campaign functionality

### Step 8: Final Integration
- Wire up duplicate campaign (pre-fill form)
- Delete campaign with confirmation
- Polish and test

---

## Key Patterns to Follow

**API uploads (from chatApi.ts):**
```typescript
query: (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return { url: '/admin/campaigns/upload-image', method: 'POST', body: formData };
}
```

**Form state (existing pattern):**
```typescript
const [formData, setFormData] = useState({...});
const handleInputChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));
```

**Toast notifications:**
```typescript
toast.success('Campaign sent successfully');
toast.error(error?.data?.message || 'Failed to send');
```

---

## Component Props Summary

**ImageUpload:**
- `value?: string` - current image URL
- `onChange: (file: File | null) => void`
- `onRemove?: () => void`
- `disabled?: boolean`

**MessagePreview:**
- `imageUrl?: string`
- `bodyParameters: string[]`
- `templateName?: string`

**CampaignForm:**
- `initialData?: Campaign` - for duplicate/edit mode
- `onSuccess?: () => void` - callback after send

**CampaignHistory:**
- Self-contained with API queries

---

## Reference Files
- `src/store/api/chatApi.ts:87-101` - FormData upload pattern
- `src/components/campaigns/CustomerSelector.tsx` - Audience selection
- `src/pages/Menu.tsx` - Complex form state pattern
- `src/components/ui/DataTable.tsx` - Table component
