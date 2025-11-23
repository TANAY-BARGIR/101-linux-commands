import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User } from 'lucide-react';

interface PostHeaderProps {
  post: {
    title: string;
    date: string;
    readingTime: string;
    category: {
      name: string;
      slug: string;
    };
    author?: {
      name: string;
      slug: string;
    };
  };
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="secondary">
          <Link href={`/categories/${post.category.slug}`}>{post.category.name}</Link>
        </Badge>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-1 h-4 w-4" />
          <span>{post.date}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1 h-4 w-4" />
          <span>{post.readingTime}</span>
        </div>
        {post.author && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-1 h-4 w-4" />
            <Link href={`/authors/${post.author.slug}`}>{post.author.name}</Link>
          </div>
        )}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
    </div>
  );
}
