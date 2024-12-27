import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ArticleForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    source: "",
    url: "",
    language: "EN",
  });

  const { mutate: addArticle, isPending } = useMutation({
    mutationFn: async (articleData: typeof formData) => {
      const { error } = await supabase.from("articles").insert([
        {
          ...articleData,
          date: new Date().toISOString().split('T')[0],
        }
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Success",
        description: "Article added successfully",
      });
      setFormData({
        title: "",
        summary: "",
        source: "",
        url: "",
        language: "EN",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add article: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addArticle(formData);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Article</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <Textarea
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <Input
            value={formData.source}
            onChange={(e) =>
              setFormData({ ...formData, source: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <Input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <Select
            value={formData.language}
            onValueChange={(value) =>
              setFormData({ ...formData, language: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN">English</SelectItem>
              <SelectItem value="ES">Spanish</SelectItem>
              <SelectItem value="FR">French</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add Article"}
        </Button>
      </form>
    </Card>
  );
};

export default ArticleForm;