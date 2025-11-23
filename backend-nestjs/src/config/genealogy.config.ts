/**
 * Genealogy Marriage Rules Configuration
 * Định cấu hình các quy tắc hôn nhân theo quy định gia tộc/dân tộc
 */

export const GENEALOGY_RULES = {
  // Khoảng cách huyết thống tối thiểu để kết hôn
  // 1 = anh em ruột
  // 2 = chú/cô/bác
  // 3 = em họ cùng ông bà
  // -1 = không có liên hệ huyết thống
  MIN_CONSANGUINITY_DISTANCE: 3,

  // Cấm kết hôn với anh em ruột
  FORBID_SIBLINGS: true,

  // Cấm kết hôn với tổ tiên/hậu duệ
  FORBID_ANCESTOR_DESCENDANT: true,

  // Cho phép kết hôn với em họ (nếu MIN_CONSANGUINITY_DISTANCE >= 3)
  ALLOW_COUSIN_MARRIAGE: true,

  // Thông báo lỗi (có thể dịch/customize)
  ERROR_MESSAGES: {
    SIBLINGS:
      'Cannot marry siblings - Genealogical restriction (Không được kết hôn với anh em ruột)',
    ANCESTOR_DESCENDANT:
      'Cannot marry ancestors and descendants - Genealogical restriction (Không được kết hôn với tổ tiên/hậu duệ)',
    SAME_GENDER:
      'Marriage must be between a Male and a Female (Genealogy convention)',
    DIFFERENT_MEMBERS: 'Partners must be different members',
  },
};
