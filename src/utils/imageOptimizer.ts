export interface OptimizedImageResult {
  file: File;
  previewDataUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  wasCompressed: boolean;
}

function readFileAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to generate image preview.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read image data.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to decode selected image file.'));
    img.src = objectUrl;
  });
}

/**
 * Resizes oversized images to maxDimension and re-encodes as lightweight WebP/JPEG
 * for faster gallery rendering and ImgBB uploads while preserving animated GIFs.
 */
export async function optimizeImageFile(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<OptimizedImageResult> {
  const maxDimension = options.maxDimension ?? 1400;
  const quality = options.quality ?? 0.84;

  // Preserve animated GIFs untouched
  if (file.type === 'image/gif') {
    const previewDataUrl = await readFileAsDataUrl(file);
    return {
      file,
      previewDataUrl,
      originalSize: file.size,
      optimizedSize: file.size,
      width: 0,
      height: 0,
      wasCompressed: false,
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    const longest = Math.max(srcW, srcH);
    const scale = longest > maxDimension ? maxDimension / longest : 1;
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    // Skip canvas re-encode if already compact & within target dimensions
    if (scale === 1 && file.size <= 220 * 1024) {
      const previewDataUrl = await readFileAsDataUrl(file);
      return {
        file,
        previewDataUrl,
        originalSize: file.size,
        optimizedSize: file.size,
        width: targetW,
        height: targetH,
        wasCompressed: false,
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const previewDataUrl = await readFileAsDataUrl(file);
      return {
        file,
        previewDataUrl,
        originalSize: file.size,
        optimizedSize: file.size,
        width: srcW,
        height: srcH,
        wasCompressed: false,
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Prefer WebP for best quality-to-size ratio, fallback to JPEG
    let targetMime = 'image/webp';
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, targetMime, quality)
    );

    if (!blob || (blob.type && blob.type !== 'image/webp')) {
      targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, targetMime, quality)
      );
    }

    if (!blob || (scale === 1 && blob.size >= file.size)) {
      const previewDataUrl = await readFileAsDataUrl(file);
      return {
        file,
        previewDataUrl,
        originalSize: file.size,
        optimizedSize: file.size,
        width: targetW,
        height: targetH,
        wasCompressed: false,
      };
    }

    const ext = targetMime === 'image/webp' ? 'webp' : targetMime === 'image/png' ? 'png' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const optimizedFile = new File([blob], `${baseName}.${ext}`, {
      type: targetMime,
      lastModified: Date.now(),
    });
    const previewDataUrl = await readFileAsDataUrl(optimizedFile);

    return {
      file: optimizedFile,
      previewDataUrl,
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      width: targetW,
      height: targetH,
      wasCompressed: true,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
