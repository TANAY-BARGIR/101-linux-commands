import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GuidePartNavigationProps {
  previousPart?: {
    slug: string;
    title: string;
  };
  nextPart?: {
    slug: string;
    title: string;
  };
  guideSlug: string;
  isOverview?: boolean;
}

export function GuidePartNavigation({
  previousPart,
  nextPart,
  guideSlug,
  isOverview = false,
}: GuidePartNavigationProps) {
  return (
    <div className="flex justify-between mt-8 pt-6">
      <div>
        {!isOverview &&
          (previousPart ? (
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/guides/${guideSlug}/${previousPart.slug}`}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/guides/${guideSlug}`}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </Link>
            </Button>
          ))}
      </div>
      <div>
        {nextPart && (
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/guides/${guideSlug}/${nextPart.slug}`}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
