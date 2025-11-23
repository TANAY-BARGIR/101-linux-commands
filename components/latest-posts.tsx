import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { getLatestPosts } from '@/lib/posts';
import type { Post } from '@/lib/posts';

interface LatestPostsProps {
  className?: string;
}

export default async function LatestPosts({ className }: LatestPostsProps) {
  const latestPosts: Post[] = await getLatestPosts(6);
  return (
    <section className={cn('', className)}>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Latest Posts</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Stay up to date with the latest DevOps content
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/posts">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group p-6 bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <Badge variant="secondary" className="mb-2">
              <span>{post.category?.name ?? 'Uncategorized'}</span>
            </Badge>
            <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="mt-2 text-muted-foreground line-clamp-3">{post.excerpt}</p>
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{post.date}</span>
              <span className="mx-2">|</span>
              <Clock className="mr-1 h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
