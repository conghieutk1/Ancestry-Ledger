# Genealogy Marriage Validation Implementation

## 📋 Overview

Hệ thống đã được cập nhật để **kiểm tra huyết thống khi kết hôn**, ngăn chặn:
- ✅ Anh em ruột kết hôn
- ✅ Tổ tiên/hậu duệ kết hôn
- ✅ Người cùng gia đình gần cách kết hôn

## 🔧 Files Triển Khai

### 1. **genealogy.service.ts** (NEW)
Dịch vụ kiểm tra mối quan hệ huyết thống

```typescript
// Kiểm tra anh em ruột
await genealogyService.areSiblings(memberId1, memberId2): boolean

// Kiểm tra tổ tiên-hậu duệ
await genealogyService.isDescendant(ancestorId, descendantId): boolean

// Tính khoảng cách huyết thống
await genealogyService.getConsanguinityDistance(memberId1, memberId2): number

// Lấy loại mối quan hệ (Vietnamese description)
await genealogyService.getRelationshipType(memberId1, memberId2): string
```

### 2. **marriage.service.ts** (UPDATED)
Thêm validation trong method `create()`:

```typescript
// Trước khi tạo marriage record, kiểm tra:
1. Anh em ruột? → Reject "Cannot marry siblings"
2. Tổ tiên-hậu duệ? → Reject "Cannot marry ancestors and descendants"
3. Giới tính? → Auto-swap để đảm bảo partner1=MALE, partner2=FEMALE
```

### 3. **member.module.ts** (UPDATED)
Thêm `GenealogyService` vào providers:

```typescript
providers: [MemberService, MarriageService, GenealogyService],
exports: [MemberService, MarriageService, GenealogyService],
```

### 4. **genealogy.config.ts** (NEW)
Cấu hình quy tắc hôn nhân:

```typescript
MIN_CONSANGUINITY_DISTANCE: 3  // Tối thiểu 3 generation xa
FORBID_SIBLINGS: true
FORBID_ANCESTOR_DESCENDANT: true
ALLOW_COUSIN_MARRIAGE: true
```

## 🧪 Test Cases

### Test 1: Anh em ruột
```bash
# Tạo cha mẹ
POST /api/members
- fullName: "Ông A"
- gender: MALE

# Tạo con thứ nhất
POST /api/members
- fullName: "Anh C"
- father: "Ông A ID"
- gender: MALE

# Tạo con thứ hai
POST /api/members
- fullName: "Chị D"
- father: "Ông A ID"
- gender: FEMALE

# Cố gắng kết hôn (sẽ reject)
POST /api/marriages
{
  "partner1Id": "Anh C ID",
  "partner2Id": "Chị D ID",
  "status": "MARRIED"
}
→ ERROR: "Cannot marry siblings - Genealogical restriction"
```

### Test 2: Cha con
```bash
POST /api/marriages
{
  "partner1Id": "Ông A ID",      // Cha
  "partner2Id": "Chị D ID",       // Con gái
  "status": "MARRIED"
}
→ ERROR: "Cannot marry ancestors and descendants"
```

### Test 3: Không có liên hệ huyết thống (OK)
```bash
# Tạo người ngoài tộc
POST /api/members
- fullName: "Người ngoài tộc"
- gender: FEMALE
- father: null
- mother: null

# Kết hôn OK
POST /api/marriages
{
  "partner1Id": "Anh C ID",
  "partner2Id": "Người ngoài tộc ID",
  "status": "MARRIED"
}
→ SUCCESS: Marriage record created
```

### Test 4: Auto-swap gender
```bash
# Gửi nữ làm partner1, nam làm partner2
POST /api/marriages
{
  "partner1Id": "Chị D ID",       // FEMALE
  "partner2Id": "Anh C ID",       // MALE
  "status": "MARRIED"
}
→ SUCCESS: Tự động swap
   Lưu: partner1 = "Anh C ID" (MALE)
        partner2 = "Chị D ID" (FEMALE)
```

## 🚀 Cách Sử Dụng

### Frontend (React/Next.js)
```typescript
// Khi người dùng chọn vợ/chồng
const handleCreateMarriage = async (spouseId: string) => {
  try {
    const response = await fetch('/api/marriages', {
      method: 'POST',
      body: JSON.stringify({
        partner1Id: currentMemberId,
        partner2Id: spouseId,
        status: 'MARRIED',
        startDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Error messages sẽ là:
      // - "Cannot marry siblings..."
      // - "Cannot marry ancestors..."
      console.error(error.message);
      alert(error.message);
    } else {
      alert('Kết hôn thành công!');
    }
  } catch (err) {
    console.error(err);
  }
};
```

### Backend API Response
```json
// Success
{
  "id": "uuid",
  "partner1": { ... },
  "partner2": { ... },
  "status": "MARRIED",
  "startDate": "2025-11-23",
  "createdAt": "2025-11-23T10:30:00Z"
}

// Error
{
  "statusCode": 400,
  "message": "Cannot marry siblings - Genealogical restriction (Không được kết hôn với anh em ruột)",
  "error": "Bad Request"
}
```

## 📊 Database Diagram

```
Members (id, fullName, father_id, mother_id, gender, ...)
  ↓
  ├── father_id → Members.id
  └── mother_id → Members.id

Marriages (id, partner1_id, partner2_id, status, ...)
  ↓
  ├── partner1_id → Members.id (MALE)
  └── partner2_id → Members.id (FEMALE)
```

## 🔍 Algorithm Explanation

### areSiblings Algorithm
```
Anh em ruột = Cùng cha hoặc cùng mẹ
```

### isDescendant Algorithm (Recursive)
```
isDescendant(ancestorId, memberId):
  1. Check if member.father == ancestorId → true
  2. Check if member.mother == ancestorId → true
  3. Recursively check parent's parents
  4. Return false if not found
```

### getConsanguinityDistance Algorithm
```
distance = 1  → anh em ruột (cùng cha hoặc mẹ)
distance = 2  → chú/cô/bác (anh em của cha/mẹ)
distance = 3  → em họ cùng ông bà
distance = -1 → không có liên hệ
```

## ⚙️ Configuration

Tính năng có thể được điều chỉnh trong `genealogy.config.ts`:

```typescript
// Cho phép kết hôn em họ
ALLOW_COUSIN_MARRIAGE: true

// Thay đổi thông báo lỗi
ERROR_MESSAGES: {
  SIBLINGS: 'Custom message...',
  ANCESTOR_DESCENDANT: 'Custom message...',
}
```

## 🐛 Known Limitations

1. **Performance**: Recursive ancestor check có thể chậm trên tree sâu (50+ generation)
   - Fix: Thêm caching hoặc denormalization của ancestor path

2. **Complex Genealogy**: Không hỗ trợ:
   - Nuôi dạy (adoption)
   - Họ hàng qua vợ chồng
   - Hôn nhân lâu đài (multiple marriages)

3. **Data Migration**: Cần chạy script để fix existing marriages nếu có:
   ```sql
   -- Swap partner1/partner2 nếu partner1 là FEMALE
   UPDATE marriages
   SET partner1_id = temp,
       partner2_id = partner1_id
   WHERE ... (check gender logic)
   ```

## 📝 Next Steps

1. ✅ Triển khai validation logic
2. ⏳ Test với backend running
3. ⏳ Update frontend error handling
4. ⏳ Add migration script (nếu có existing data)
5. ⏳ Document API endpoints
