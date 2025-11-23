import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { OptimizedImage } from '@/components/optimized-image';
import { getLatestGuides } from '@/lib/guides';
import type { Guide } from '@/lib/guides';

interface LatestGuidesProps {
  className?: string;
}

export default async function LatestGuides({ className }: LatestGuidesProps) {
  const latestGuides: Guide[] = await getLatestGuides(6);

  return (
    <section className={cn('', className)}>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Latest Guides</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Step-by-step tutorials to boost your DevOps skills
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {latestGuides.map((guide, index) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="relative h-48 overflow-hidden">
              <OptimizedImage
                src={guide.image || '/placeholder.svg'}
                alt={guide.title}
                fill
                priority={index === 0}
                className="transition-transform group-hover:scale-105 object-cover"
              />
            </div>
            <div className="flex-1 p-6">
              <Badge variant="secondary" className="mb-2">
                <span>{guide.category?.name ?? 'Uncategorized'}</span>
              </Badge>
              <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {guide.title}
              </h3>
              <p className="mt-2 text-muted-foreground line-clamp-3">{guide.description}</p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{guide.publishedAt?.split('T')[0] ?? 'Unknown date'}</span>
                <span className="mx-2">|</span>
                <Clock className="mr-1 h-4 w-4" />
                <span>{guide.readingTime ?? 'Quick read'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
