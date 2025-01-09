import { Article } from "@/utils/articleUtils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EditFormProps {
  article: Article;
  editForm: Partial<Article>;
  onEditFormChange: (field: keyof Article, value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
}

export const EditForm = ({
  article,
  editForm,
  onEditFormChange,
  onCancelEdit,
  onSaveEdit,
}: EditFormProps) => {
  return (
    <Card className="bg-secondary/50 backdrop-blur-sm p-6 rounded-lg border border-primary/10">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={editForm?.title}
            onChange={(e) => onEditFormChange('title', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <Textarea
            value={editForm?.summary}
            onChange={(e) => onEditFormChange('summary', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <Input
            value={editForm?.source}
            onChange={(e) => onEditFormChange('source', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <Input
            value={editForm?.url}
            onChange={(e) => onEditFormChange('url', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select
            value={editForm?.language}
            onChange={(e) => onEditFormChange('language', e.target.value)}
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
};