'use client';

import Image from 'next/image';
import { getImagePath, getSocialImagePath } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

interface DualFormatImageProps {
  slug: string;
  type: 'posts' | 'guides' | 'exercises';
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}

export function DualFormatImage({
  slug,
  type,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  ...props
}: DualFormatImageProps &
  Omit<
    React.ComponentProps<typeof Image>,
    'src' | 'alt' | 'width' | 'height' | 'fill' | 'priority' | 'className'
  >) {
  // Use SVG for web display (better quality, smaller size)
  const webImageSrc = getImagePath(slug, type, 'web');

  // Use PNG for social sharing (handled in metadata)
  // This component only handles web display

  return (
    <div className={cn('relative', fill ? 'w-full h-full' : '', className)}>
      <Image
        src={webImageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes={fill ? '(max-width: 768px) 100vw, 50vw' : undefined}
        className={cn('object-cover', fill ? 'w-full h-full' : '')}
        {...props}
      />
    </div>
  );
}
