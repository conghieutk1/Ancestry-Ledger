# Visual Comparison: Before and After Standardization

## Select #1: Gender Select (Edit Form)

### BEFORE

```tsx
<div className="space-y-2">
    <label className="text-xs font-medium text-slate-700">
        {t.common.gender}
    </label>
    <select
        name="gender"
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        defaultValue={member.gender}
    >
        <option value={Gender.MALE}>{t.common.male}</option>
        <option value={Gender.FEMALE}>{t.common.female}</option>
        <option value={Gender.UNKNOWN}>{t.common.unknown}</option>
    </select>
</div>
```

**Issues**:

-   Basic HTML select with limited styling
-   No visual feedback on hover
-   No search capability
-   No dropdown icon
-   Inconsistent with spouse selector

### AFTER

```tsx
<div className="space-y-2">
    <label className="text-xs font-medium text-slate-700">
        {t.common.gender}
    </label>
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
        searchPlaceholder={t.common.search}
        showSearch={false}
    />
</div>
```

**Improvements**:
✅ Consistent button-based appearance with ChevronsUpDown icon
✅ Hover and selection feedback with visual states
✅ Portal-rendered dropdown (no z-index conflicts)
✅ Matches spouse selector styling
✅ Better visual hierarchy
✅ State-based updates with immediate feedback

---

## Select #2: Status Select - Alive/Deceased (Edit Form)

### BEFORE

```tsx
<div className="space-y-2">
    <label className="text-xs font-medium text-slate-700">
        {t.common.status}
    </label>
    <select
        name="status"
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        defaultValue={member.isAlive ? 'alive' : 'deceased'}
    >
        <option value="alive">{t.common.alive}</option>
        <option value="deceased">{t.common.deceased}</option>
    </select>
</div>
```

**Issues**:

-   Basic HTML select
-   Inconsistent with other form selects
-   No visual indicator of dropdown
-   Difficult to interact with in certain contexts

### AFTER

```tsx
<div className="space-y-2">
    <label className="text-xs font-medium text-slate-700">
        {t.common.status}
    </label>
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
</div>
```

**Improvements**:
✅ Consistent with gender select above
✅ Clear visual button with dropdown indicator
✅ Better touch/click targets (larger button area)
✅ Portal rendering prevents Dialog z-index issues
✅ Immediate state feedback on selection

---

## Select #3: Marriage Status Select (Marriage Modal)

### BEFORE

```tsx
<div className="space-y-2">
    <Label>{t.common.status}</Label>
    <select
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={marriageStatus}
        onChange={(e) => {
            setMarriageStatus(e.target.value);
            // Reset spouse selection when changing status
            if (e.target.value === 'SINGLE') {
                setSelectedSpouseId('');
            }
        }}
    >
        <option value="SINGLE">{t.common.single}</option>
        <option value="MARRIED">{t.common.married}</option>
        <option value="DIVORCED">{t.common.divorced}</option>
        <option value="WIDOWED">{t.common.widowed}</option>
    </select>
</div>
```

**Issues**:

-   Different styling from spouse selector (below)
-   Inconsistent look in same dialog
-   Native select limitations
-   No visual consistency in same modal

### AFTER

```tsx
<div className="space-y-2">
    <Label>{t.common.status}</Label>
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
</div>
```

**Improvements**:
✅ Now matches spouse selector style below it
✅ Consistent visual appearance within the same dialog
✅ Same dropdown behavior and styling
✅ Better UX in the marriage modal
✅ Clear visual hierarchy with other form elements

---

## Component Architecture Comparison

### State Management Pattern

**OLD (FormData-based)**:

```tsx
// Form reads from HTML form elements via FormData
const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const gender = formData.get('gender'); // Read from HTML
    const status = formData.get('status'); // Read from HTML
};
```

**NEW (State-based)**:

```tsx
// Component state drives form values
const [member, setMember] = useState<Member>();

// CustomSelect updates state immediately
<CustomSelect
    value={member.gender}
    onChange={(value) => setMember({ ...member, gender: value })}
/>;

// Form handler uses state values
const handleSave = async (e: React.FormEvent) => {
    const gender = member.gender; // Read from state
    const status = member.isAlive; // Read from state
};
```

**Advantages**:

-   Cleaner component state management
-   Instant validation feedback possible
-   Better React pattern alignment
-   Easier to implement dependent field updates

---

## Component Reusability

The new `CustomSelect` component can be used throughout the application:

```tsx
// Example 1: Gender selection anywhere
<CustomSelect
    value={selectedGender}
    onChange={setSelectedGender}
    options={genderOptions}
    showSearch={false}
/>

// Example 2: Branch selection with search
<CustomSelect
    value={selectedBranchId}
    onChange={setSelectedBranchId}
    options={branches.map(b => ({ value: b.id, label: b.name }))}
    showSearch={true}
    placeholder="Select a branch..."
/>

// Example 3: Status selection
<CustomSelect
    value={status}
    onChange={setStatus}
    options={statusOptions}
    searchPlaceholder="Search statuses..."
    emptyMessage="No matching statuses"
/>
```

---

## Performance Impact

**No negative impact** - actually improved:

1. **Fewer DOM nodes** - One reusable component instead of 3 different select patterns
2. **Better event handling** - Portal rendering prevents unnecessary re-renders from Dialog context
3. **Optimized search** - Only re-filters when needed, not on every render
4. **State efficiency** - Direct state management avoids unnecessary FormData parsing

---

## Accessibility Improvements

-   **ARIA attributes**: `role="combobox"`, `aria-expanded`
-   **Keyboard support**: Full keyboard navigation (arrows, Enter, Escape)
-   **Click handling**: Proper event handling with `stopPropagation`
-   **Focus management**: Automatic focus on search input when opened
-   **Portal rendering**: Prevents keyboard trap in Dialog
-   **Semantic structure**: Proper button and list semantics

---

## Summary of Standardization

| Aspect          | Before                   | After                                   |
| --------------- | ------------------------ | --------------------------------------- |
| **Component**   | Native `<select>`        | CustomSelect (Radix UI Button + Portal) |
| **Styling**     | Basic CSS classes        | Consistent Tailwind + animations        |
| **Icon**        | None                     | ChevronsUpDown indicator                |
| **Dropdown**    | Browser dropdown         | Portal-rendered custom dropdown         |
| **Search**      | Not available            | Optional (showSearch prop)              |
| **Z-index**     | Browser handles          | Portal with z-[9999]                    |
| **State**       | FormData                 | React state (member state)              |
| **UX**          | Basic                    | Rich with hover/selection feedback      |
| **Consistency** | Inconsistent across page | 100% consistent                         |

All selects now follow the same pattern and provide a unified, professional user experience.
