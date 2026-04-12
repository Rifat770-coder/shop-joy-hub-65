import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
  lazy?: boolean;
  blurDataURL?: string;
  className?: string;
  containerClassName?: string;
  onError?: () => void;
}

/**
 * OptimizedImage component
 * Provides lazy loading, blur-up placeholders, and responsive images
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+',
  lazy = true,
  blurDataURL,
  className,
  containerClassName,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onError]);

  // Generate srcSet for responsive images if width is provided
  const generateSrcSet = () => {
    if (!width || !src || hasError) return undefined;
    
    const baseUrl = src.split('?')[0];
    const extension = baseUrl.split('.').pop();
    const baseName = baseUrl.replace(`.${extension}`, '');
    
    // Generate different sizes for responsive images
    const sizes = [320, 640, 768, 1024, 1280, 1536];
    return sizes
      .map(size => `${baseName}-${size}w.${extension} ${size}w`)
      .join(', ');
  };

  // Generate sizes attribute for responsive images
  const generateSizes = () => {
    if (!width) return undefined;
    
    if (width <= 640) return '(max-width: 640px) 100vw, 640px';
    if (width <= 768) return '(max-width: 768px) 100vw, 768px';
    if (width <= 1024) return '(max-width: 1024px) 100vw, 1024px';
    if (width <= 1280) return '(max-width: 1280px) 100vw, 1280px';
    return '100vw';
  };

  const srcSet = generateSrcSet();
  const sizes = generateSizes();

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        srcSet={srcSet}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300 object-cover',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'opacity-100',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for generating optimized image URLs
 */
export function useOptimizedImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'avif';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;

  if (!src) return '';

  // If it's a data URL or already optimized, return as-is
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // For external URLs, we can't optimize them client-side
  // In a real app, you would use an image CDN or proxy
  try {
    const url = new URL(src);
    if (url.hostname !== window.location.hostname) {
      return src;
    }
  } catch {
    // Relative URL, we can optimize
  }

  // In a production app, you would:
  // 1. Use an image CDN (like Cloudinary, Imgix, or Cloudflare Images)
  // 2. Generate optimized URLs server-side
  // 3. Use a service worker for caching
  
  // For now, return the original src
  // You would replace this with your image optimization service
  let optimizedSrc = src;
  
  // Example: Append query parameters for an imaginary image optimizer
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());
  if (format) params.append('fm', format);
  
  if (params.toString()) {
    optimizedSrc += (src.includes('?') ? '&' : '?') + params.toString();
  }
  
  return optimizedSrc;
}

/**
 * Utility to generate blur data URL for placeholders
 */
export function generateBlurDataURL(width: number, height: number): string {
  // Create a tiny, blurred version of the image
  // In a real app, you would generate this server-side
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient as placeholder
  const gradient = ctx.createLinearGradient(0, 0, 10, 10);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 10, 10);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

export default OptimizedImage;