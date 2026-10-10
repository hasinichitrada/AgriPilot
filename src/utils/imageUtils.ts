import type { ImageData } from '../types/agri.ts';

export async function processImageFile(file: File): Promise<ImageData> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Please select a JPG, JPEG, PNG, or WebP image.');
  }

  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    throw new Error('Image size exceeds 10MB. Please choose a smaller photo.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fullDataUrl = e.target?.result as string;
      if (!fullDataUrl) {
        return reject(new Error('Failed to read image file.'));
      }
      // Extract base64 without prefix
      const commaIndex = fullDataUrl.indexOf(',');
      const data = commaIndex >= 0 ? fullDataUrl.slice(commaIndex + 1) : fullDataUrl;

      resolve({
        data,
        fullDataUrl,
        mimeType: file.type || 'image/jpeg',
        filename: file.name,
        sizeBytes: file.size
      });
    };
    reader.onerror = () => reject(new Error('Error reading image file.'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
