'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollText } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>('');

  React.useEffect(() => {
    // Parse headings from content
    const extractHeadings = () => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingsList: Heading[] = [];

      headingElements.forEach((heading) => {
        const element = heading as HTMLHeadingElement;
        const id = element.id;
        const text = element.textContent || '';
        const level = parseInt(element.tagName.charAt(1));

        if (id && text) {
          headingsList.push({ id, text, level });
        }
      });

      setHeadings(headingsList);
    };

    extractHeadings();
  }, [content]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0% -80% 0%',
        threshold: 0,
      }
    );

    // Observe all headings
    const headingElements = document.querySelectorAll(
      'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'
    );
    headingElements.forEach((element) => observer.observe(element));

    return () => {
      headingElements.forEach((element) => observer.unobserve(element));
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className={cn('sticky top-8', className)}>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted px-4 py-3 flex items-center gap-2">
          <ScrollText className="h-4 w-4" />
          <span className="font-medium">Table of Contents</span>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {headings.map((heading) => (
              <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    'block py-1 text-sm transition-colors hover:text-primary',
                    activeId === heading.id ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(heading.id);
                    if (element) {
                      const yOffset = -80; // Adjust for fixed header
                      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function useTOC(content: string): Heading[] {
  const [headings, setHeadings] = React.useState<Heading[]>([]);

  React.useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const extractedHeadings: Heading[] = [];
    headingElements.forEach((element) => {
      const heading = element as HTMLHeadingElement;
      const id = heading.id;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));

      if (id && text) {
        extractedHeadings.push({ id, text, level });
      }
    });

    setHeadings(extractedHeadings);
  }, [content]);

  return headings;
}
