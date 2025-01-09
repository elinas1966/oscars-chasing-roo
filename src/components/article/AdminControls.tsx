import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { Article } from "@/utils/articleUtils";

interface AdminControlsProps {
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  article: Article;
}

export const AdminControls = ({ onEdit, onDelete, article }: AdminControlsProps) => {
  return (
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
};