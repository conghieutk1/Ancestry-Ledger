# Select Element Standardization - Member Edit Page

## Overview

All select elements on the member edit page have been standardized to use a unified `CustomSelect` component. This ensures consistent styling, behavior, and user experience across all dropdown selectors throughout the member management interface.

## Changes Summary

### 1. New Component: `CustomSelect`

**File**: `frontend-reactjs-nextjs/src/components/ui/custom-select.tsx`

A reusable, fully-featured select component with:

-   **Portal-based rendering** - Renders dropdown outside DOM hierarchy to prevent z-index stacking conflicts
-   **Search capability** - Built-in search filtering (optional via `showSearch` prop)
-   **Keyboard navigation** - Supports arrow keys and Enter key
-   **Click outside detection** - Auto-closes on outside clicks
-   **Custom styling** - Matches the proven spouse selector pattern
-   **TypeScript support** - Full type safety with `SelectOption` interface

**Key Features**:

```tsx
interface CustomSelectProps {
    value: string; // Currently selected value
    onChange: (value: string) => void; // Change handler
    options: SelectOption[]; // Array of {value, label} objects
    placeholder?: string; // Default button text
    searchPlaceholder?: string; // Search input placeholder
    disabled?: boolean; // Disable the select
    className?: string; // Wrapper div class
    showSearch?: boolean; // Show/hide search input (default: true)
    emptyMessage?: string; // "No results" message
}
```

### 2. Updated Selects in MemberDetailPageClient

#### Gender Select (Edit Form)

**Location**: Personal info form, above date of birth field

-   **Before**: Basic HTML `<select>` with plain styling
-   **After**: CustomSelect with matching labels for Male, Female, Unknown
-   **Behavior**: Updates `member.gender` state on change
-   **Search**: Disabled (only 3 options, search not necessary)

```tsx
<CustomSelect
    value={member.gender}
    onChange={(value) => {
        setMember({
            ...member,
            gender: value as Gender,
        });
    }}
    options={[
        { value: Gender.MALE, label: t.common.male },
        { value: Gender.FEMALE, label: t.common.female },
        { value: Gender.UNKNOWN, label: t.common.unknown },
    ]}
    placeholder={t.common.gender}
    showSearch={false}
/>
```

#### Status Select (Edit Form)

**Location**: Personal info form, below date of birth field

-   **Before**: Basic HTML `<select>` with plain styling
-   **After**: CustomSelect with options for Alive/Deceased
-   **Behavior**: Updates `member.isAlive` state on change
-   **Search**: Disabled (only 2 options)

```tsx
<CustomSelect
    value={member.isAlive ? 'alive' : 'deceased'}
    onChange={(value) => {
        setMember({
            ...member,
            isAlive: value === 'alive',
        });
    }}
    options={[
        { value: 'alive', label: t.common.alive },
        { value: 'deceased', label: t.common.deceased },
    ]}
    placeholder={t.common.status}
    showSearch={false}
/>
```

#### Marriage Status Select (Marriage Modal)

**Location**: Add/Update Marriage dialog, status field

-   **Before**: Basic HTML `<select>` with plain styling
-   **After**: CustomSelect with marriage status options
-   **Behavior**: Updates `marriageStatus` state, resets spouse selection if changed to SINGLE
-   **Search**: Disabled (only 4 options)

```tsx
<CustomSelect
    value={marriageStatus}
    onChange={(value) => {
        setMarriageStatus(value);
        // Reset spouse selection when changing status
        if (value === 'SINGLE') {
            setSelectedSpouseId('');
        }
    }}
    options={[
        { value: 'SINGLE', label: t.common.single },
        { value: 'MARRIED', label: t.common.married },
        { value: 'DIVORCED', label: t.common.divorced },
        { value: 'WIDOWED', label: t.common.widowed },
    ]}
    placeholder={t.common.status}
    showSearch={false}
/>
```

### 3. Updated Form Handling

The `handleSave` function was updated to work with the new state-based CustomSelect components:

**Before**:

```tsx
const updates: Partial<Member> = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    middleName: formData.get('middleName') as string,
    gender: formData.get('gender') as Gender,          // Read from FormData
    dateOfBirth: ...,
    isAlive: formData.get('status') === 'alive',       // Read from FormData
};
```

**After**:

```tsx
const updates: Partial<Member> = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    middleName: formData.get('middleName') as string,
    gender: member.gender,                              // Read from state
    dateOfBirth: ...,
    isAlive: member.isAlive,                           // Read from state
};
```

## Visual Consistency Features

All standardized selects now share:

1. **Consistent Button Styling**

    - `variant="outline"` - Clean border-based appearance
    - `w-full` - Full width matching other form inputs
    - `justify-between` - Label on left, chevron icon on right
    - `ChevronsUpDown` icon - Visual indicator of dropdown

2. **Consistent Dropdown Styling**

    - `border border-slate-200` - Same subtle border
    - `bg-white` - Consistent background
    - `shadow-md` - Subtle shadow for depth
    - `rounded-md` - Matching border radius
    - `animate-in fade-in-0 zoom-in-95` - Smooth animation

3. **Consistent Item Selection**

    - `hover:bg-slate-100` - Hover state
    - `transition-colors` - Smooth color transitions
    - `Check` icon - Visual feedback for selected item
    - Opacity-based icon visibility

4. **Consistent Search (when enabled)**
    - `Search` icon - Left-aligned search icon
    - `border-b px-3` - Separator line between search and options
    - `placeholder:text-slate-500` - Consistent placeholder styling

## Benefits of Standardization

1. **Unified User Experience** - Users see consistent behavior across all selects
2. **Improved Accessibility** - Portal rendering prevents z-index issues with dialogs
3. **Better Visual Design** - Matches the proven spouse selector pattern
4. **Code Maintainability** - Single component to maintain instead of multiple select implementations
5. **Reusability** - Can be used elsewhere in the application
6. **Scalability** - Easy to add to other pages (family branches, marriages, etc.)

## Testing Checklist

-   [ ] Gender select updates correctly on change
-   [ ] Status select (alive/deceased) updates correctly on change
-   [ ] Marriage status select updates correctly and resets spouse when set to SINGLE
-   [ ] Spouse selector in marriage modal still works with search
-   [ ] All dropdowns are fully clickable inside Dialog
-   [ ] Dropdown appears above other elements (z-index correct)
-   [ ] Keyboard navigation (arrows, Enter) works
-   [ ] Click outside closes all dropdowns
-   [ ] Search filtering works in selects with `showSearch={true}`
-   [ ] Form submission saves all selected values correctly
-   [ ] Mobile responsive design works properly

## Migration Notes

If other components need the same standardized select pattern:

1. Import the component:

    ```tsx
    import { CustomSelect } from '@/components/ui/custom-select';
    ```

2. Use with state management:

    ```tsx
    const [selectedValue, setSelectedValue] = useState('initial');

    <CustomSelect
        value={selectedValue}
        onChange={(value) => setSelectedValue(value)}
        options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
        ]}
        placeholder="Select..."
    />;
    ```

3. For form integration, remember to:
    - Store values in component state (not FormData)
    - Update form submission handlers to read from state
    - Use `onChange` callback to update state immediately

## Files Modified

-   `frontend-reactjs-nextjs/src/components/ui/custom-select.tsx` (NEW)
-   `frontend-reactjs-nextjs/src/app/admin/members/[id]/MemberDetailPageClient.tsx` (MODIFIED)
    -   Added CustomSelect import
    -   Replaced 3 select elements with CustomSelect components
    -   Updated handleSave function to read from member state instead of FormData

## Conclusion

The select element standardization improves the UI/UX consistency and maintainability of the member edit form while leveraging the already-proven custom select pattern from the spouse selector. All selects now share a consistent look, feel, and behavior across the entire member management interface.
