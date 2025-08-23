export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export function validateDescription(description: string): ValidationResult {
  const trimmed = description.trim();
  
  if (!trimmed) {
    return { ok: false, message: "설명을 입력해주세요." };
  }
  
  if (trimmed.length < 1) {
    return { ok: false, message: "설명을 입력해주세요." };
  }
  
  if (trimmed.length > 60) {
    return { ok: false, message: "설명은 60자 이하로 입력해주세요." };
  }
  
  // Check for whitespace-only content (spaces, tabs, newlines)
  if (!/\S/.test(trimmed)) {
    return { ok: false, message: "유효한 설명을 입력해주세요." };
  }
  
  return { ok: true };
}