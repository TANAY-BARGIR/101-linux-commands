import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

interface RelatedPostsProps {
  posts: Array<{
    title: string;
    slug: string;
    date: string;
    readingTime: string;
    category: {
      name: string;
      slug: string;
    };
  }>;
  className?: string;
}

export function RelatedPosts({ posts, className }: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <div className={cn('', className)}>
      <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group p-4 bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{post.date}</span>
              <span className="mx-2">|</span>
              <Clock className="mr-1 h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
