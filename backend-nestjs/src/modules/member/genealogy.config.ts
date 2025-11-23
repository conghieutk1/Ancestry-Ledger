export const GenealogyConfig = {
  // Vietnamese Marriage Law (Luật Hôn nhân và Gia đình):
  // Cấm kết hôn trong phạm vi 3 đời (Forbid within 3 generations).

  // Mapping Distance (Graph Steps) to Generations (Legal):
  // Distance 2: Siblings (Anh chị em ruột) -> Đời thứ 2.
  // Distance 3: Uncle/Aunt - Niece/Nephew (Cô dì chú bác - cháu) -> Đời thứ 3 (lệch).
  // Distance 4: First Cousins (Anh em họ / Con chú con bác) -> Đời thứ 3.

  // Therefore, Distance 4 is INCLUDED in the forbidden range.
  FORBIDDEN_GENERATION_LIMIT: 4,

  // Explicit flags for clarity
  FORBID_SIBLINGS: true,
  FORBID_ANCESTOR_DESCENDANT: true,
  ALLOW_COUSIN_MARRIAGE: false, // Cousins (Distance 4) are forbidden.

  // Minimum Age Requirements (Vietnamese Law)
  MIN_AGE_MALE: 20,
  MIN_AGE_FEMALE: 18,
};
