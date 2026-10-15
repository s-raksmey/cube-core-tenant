export const MAX_ARTICLE_IMAGE_BYTES = 1000 * 1024;

const extensions: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export function articleImageFileError(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (
    !extensions[file.type]?.includes(extension) ||
    !file.size ||
    file.size > MAX_ARTICLE_IMAGE_BYTES
  ) {
    return "Choose a PNG, JPEG, or WebP image up to 1000 KB.";
  }
  return null;
}

export async function articleImageToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
