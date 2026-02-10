"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
  activeCategory?: string;
}

export function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <Link href="/home">
        <Badge
          variant={!activeCategory ? "default" : "outline"}
          className={cn(
            "cursor-pointer whitespace-nowrap",
            !activeCategory && "bg-primary text-primary-foreground"
          )}
        >
          Toutes
        </Badge>
      </Link>
      {categories.map((category) => (
        <Link key={category.id} href={`/home?category=${category.slug}`}>
          <Badge
            variant={activeCategory === category.slug ? "default" : "outline"}
            className={cn(
              "cursor-pointer whitespace-nowrap",
              activeCategory === category.slug && "bg-primary text-primary-foreground"
            )}
          >
            {category.name} ({category.count})
          </Badge>
        </Link>
      ))}
    </div>
  );
}
