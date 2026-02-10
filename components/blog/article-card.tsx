import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, calculateReadingTime } from "@/lib/utils";
import { Clock } from "lucide-react";

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image_url: string | null;
    published_at: string;
    content: string;
    author: {
      display_name: string;
      avatar_url: string | null;
    };
    categories: Array<{
      name: string;
    }>;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const readingTime = calculateReadingTime(article.content);

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
        {article.cover_image_url && (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {article.categories.map((category, idx) => (
              <Badge key={idx} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
          <h3 className="text-xl font-bold line-clamp-2">{article.title}</h3>
        </CardHeader>
        <CardContent className="flex-1">
          {article.excerpt && (
            <p className="text-muted-foreground line-clamp-3">{article.excerpt}</p>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={article.author.avatar_url || undefined} />
              <AvatarFallback>
                {article.author.display_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{article.author.display_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{formatDate(article.published_at)}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{readingTime} min</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
