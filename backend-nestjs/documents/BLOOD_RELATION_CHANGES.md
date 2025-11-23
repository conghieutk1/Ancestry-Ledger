# Thay Đổi Triển Khai - Blood Relation Validation in Marriage

## 📌 Tóm Tắt

Triển khai **kiểm tra huyết thống** khi kết hôn để ngăn chặn:

-   Anh em ruột kết hôn
-   Tổ tiên/hậu duệ kết hôn
-   Người cùng gia đình gần cách kết hôn

---

## 📁 Files Tạo Mới

### 1. `backend-nestjs/src/modules/member/genealogy.service.ts`

**Mục đích**: Dịch vụ kiểm tra mối quan hệ huyết thống

**Methods chính**:

-   `areSiblings(memberId1, memberId2)` - Kiểm tra anh em ruột
-   `isDescendant(ancestorId, memberId)` - Kiểm tra tổ tiên/hậu duệ (recursive)
-   `getConsanguinityDistance(memberId1, memberId2)` - Tính khoảng cách huyết thống
-   `getRelationshipType(memberId1, memberId2)` - Lấy mô tả mối quan hệ (Vietnamese)
-   `getSiblings(memberId)` (private) - Helper lấy tất cả anh em ruột
-   `getAncestorDepth()` (private) - Helper tính độ sâu ancestor

**Lines**: ~300 lines

---

### 2. `backend-nestjs/src/config/genealogy.config.ts`

**Mục đích**: Cấu hình quy tắc hôn nhân theo quy định gia tộc

**Config**:

```typescript
MIN_CONSANGUINITY_DISTANCE: 3     // Tối thiểu 3 generation
FORBID_SIBLINGS: true
FORBID_ANCESTOR_DESCENDANT: true
ALLOW_COUSIN_MARRIAGE: true
ERROR_MESSAGES: { ... }
```

**Lines**: ~30 lines

---

### 3. `GENEALOGY_IMPLEMENTATION.md` (Documentation)

Hướng dẫn chi tiết triển khai, test cases, cách sử dụng

---

## 📝 Files Chỉnh Sửa

### 1. `backend-nestjs/src/modules/member/marriage.service.ts`

**Thay đổi**:

-   ✅ Import `GenealogyService`
-   ✅ Thêm `genealogyService` vào constructor
-   ✅ Thêm validation trước khi tạo marriage:
    -   Kiểm tra `areSiblings()` → Reject nếu là anh em ruột
    -   Kiểm tra `isDescendant()` → Reject nếu là tổ tiên/hậu duệ

**Lines thêm**: ~40 lines (trong method `create()`)

**Error messages**:

```
"Cannot marry siblings - Genealogical restriction (Không được kết hôn với anh em ruột)"
"Cannot marry ancestors and descendants - Genealogical restriction (Không được kết hôn với tổ tiên/hậu duệ)"
```

---

### 2. `backend-nestjs/src/modules/member/member.module.ts`

**Thay đổi**:

-   ✅ Import `GenealogyService`
-   ✅ Thêm `GenealogyService` vào `providers`
-   ✅ Thêm `GenealogyService` vào `exports`

**Lines thêm**: 2 lines

---

## 🔄 Flow Diagram

```
POST /api/marriages (với partner1Id, partner2Id)
  ↓
MarriageService.create()
  ↓
  ├─→ Fetch both partners from DB
  ├─→ [NEW] GenealogyService.areSiblings(p1, p2)?
  │    ├─ YES → BadRequestException "Cannot marry siblings"
  │    └─ NO → Continue
  ├─→ [NEW] GenealogyService.isDescendant(p1, p2)?
  │    ├─ YES → BadRequestException "Cannot marry ancestors"
  │    └─ NO → Continue
  ├─→ Auto-swap để partner1=MALE, partner2=FEMALE
  ├─→ Close previous active marriages
  └─→ Create new marriage record
```

---

## ✅ Testing Checklist

-   [ ] Backend compiles without errors
-   [ ] Genealogy.service instantiates correctly
-   [ ] areSiblings() returns true/false correctly
-   [ ] isDescendant() handles recursive ancestry
-   [ ] Marriage creation rejects siblings
-   [ ] Marriage creation rejects ancestors/descendants
-   [ ] Marriage creation accepts unrelated partners
-   [ ] Gender auto-swap works (p1=M, p2=F)
-   [ ] Error messages display correctly on frontend

---

## 🚀 Deployment Steps

1. **Compile backend**:

    ```bash
    cd backend-nestjs
    npm run build
    ```

2. **Test locally**:

    ```bash
    npm run start:dev
    ```

3. **Run test cases** (see GENEALOGY_IMPLEMENTATION.md)

4. **Deploy to production** (if no issues found)

5. **Optional: Run migration** for existing data
    ```sql
    -- Check if any marriages have partner1=FEMALE, partner2=MALE
    SELECT * FROM marriages
    JOIN members p1 ON marriages.partner1_id = p1.id
    WHERE p1.gender = 'FEMALE'
    -- Swap them if needed
    ```

---

## 📊 Complexity Analysis

| Operation                | Time                                | Space      |
| ------------------------ | ----------------------------------- | ---------- |
| areSiblings              | O(1) - 2 DB queries                 | O(1)       |
| isDescendant             | O(D) - D = tree depth (max 50)      | O(D) stack |
| getConsanguinityDistance | O(D)                                | O(D)       |
| create (full)            | O(N + D) where N = active marriages | O(D)       |

---

## 🔐 Security Notes

-   Validation happens **server-side only**
-   Frontend cannot bypass these checks
-   Config can be updated without code changes
-   Error messages don't expose internal structure

---

## 📚 References

-   Genealogy terminology: https://en.wikipedia.org/wiki/Kinship
-   Vietnamese family relations: https://vi.wikipedia.org/wiki/Quan_h%C3%A0_gia_pha
-   NestJS services: https://docs.nestjs.com/providers/services
