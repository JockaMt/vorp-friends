import { VALIDATION, FILE_UPLOAD } from '@/constants';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  if (username.length < VALIDATION.USERNAME.MIN_LENGTH || 
      username.length > VALIDATION.USERNAME.MAX_LENGTH) {
    return false;
  }
  return VALIDATION.USERNAME.PATTERN.test(username);
}

export function validatePassword(password: string): boolean {
  return password.length >= VALIDATION.PASSWORD.MIN_LENGTH && 
         password.length <= VALIDATION.PASSWORD.MAX_LENGTH;
}

export function validatePostContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= VALIDATION.POST.MAX_LENGTH;
}

export function validateCommentContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= VALIDATION.COMMENT.MAX_LENGTH;
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    return {
      isValid: false,
      error: `Arquivo muito grande. Máximo ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP',
    };
  }

  return { isValid: true };
}

export function validateImageFiles(files: FileList | File[]): { isValid: boolean; error?: string } {
  const fileArray = Array.from(files);

  if (fileArray.length > FILE_UPLOAD.MAX_FILES) {
    return {
      isValid: false,
      error: `Máximo ${FILE_UPLOAD.MAX_FILES} arquivos permitidos`,
    };
  }

  for (const file of fileArray) {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}