import { Article, formatDate } from "@/utils/articleUtils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareMenu } from "./article/ShareMenu";
import { EditForm } from "./article/EditForm";
import { AdminControls } from "./article/AdminControls";

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
  if (isEditing && editForm && onEditFormChange) {
    return (
      <EditForm
        article={article}
        editForm={editForm}
        onEditFormChange={onEditFormChange}
        onCancelEdit={onCancelEdit}
        onSaveEdit={onSaveEdit}
      />
    );
  }

  return (
    <Card className="group bg-secondary/50 backdrop-blur-sm p-6 rounded-lg border border-primary/10 hover:border-primary/30 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="text-primary border-primary">
            {article.language}
          </Badge>
          {isAdmin && (
            <AdminControls
              article={article}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ShareMenu
            articleTitle={article.title}
            articleUrl={article.url}
          />
          <span className="text-sm text-gray-400 font-medium">
            {formatDate(article.date)}
          </span>
        </div>
      </div>
      <h3 className="text-xl font-serif mb-3 text-white hover:text-primary transition-colors">
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {article.title}
        </a>
      </h3>
      <p className="text-gray-400 mb-4 line-clamp-3">{article.summary}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-primary/80">{article.source}</span>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
        >
          Read Full Article →
        </a>
      </div>
    </Card>
  );
};