import { Article } from "@/utils/articleUtils";
import { formatDate } from "@/utils/articleUtils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ArticleCardProps {
  article: Article;
  isAdmin: boolean;
  isEditing: boolean;
  editForm?: Partial<Article>;
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onEditFormChange?: (field: keyof Article, value: string) => void;
}

export const ArticleCard = ({
  article,
  isAdmin,
  isEditing,
  editForm,
  onEdit,
  onDelete,
  onCancelEdit,
  onSaveEdit,
  onEditFormChange,
}: ArticleCardProps) => {
  if (isEditing) {
    return (
      <Card className="article-card p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={editForm?.title}
              onChange={(e) => onEditFormChange?.('title', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Summary</label>
            <Textarea
              value={editForm?.summary}
              onChange={(e) => onEditFormChange?.('summary', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <Input
              value={editForm?.source}
              onChange={(e) => onEditFormChange?.('source', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <Input
              value={editForm?.url}
              onChange={(e) => onEditFormChange?.('url', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              value={editForm?.language}
              onChange={(e) => onEditFormChange?.('language', e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
            >
              <option value="EN">English</option>
              <option value="ES">Spanish</option>
              <option value="FR">French</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancelEdit}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={() => onSaveEdit(article.id)}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="article-card p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="text-primary border-primary">
            {article.language}
          </Badge>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(article)}
                className="text-primary hover:text-primary/80"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(article.id)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-400">
          {formatDate(article.date)}
        </span>
      </div>
      <h3 className="text-xl font-serif mb-3">{article.title}</h3>
      <p className="text-gray-400 mb-4">{article.summary}</p>
      <div className="flex justify-end">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors"
        >
          Read More →
        </a>
      </div>
    </Card>
  );
};