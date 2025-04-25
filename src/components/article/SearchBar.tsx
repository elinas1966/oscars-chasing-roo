
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Article } from "@/utils/articleUtils";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface SearchBarProps {
  articles: Article[];
  onSearch: (term: string) => void;
}

export const SearchBar = ({ articles = [], onSearch }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Update suggestions whenever value or articles change
  useEffect(() => {
    if (!value || !articles || !Array.isArray(articles)) {
      setSuggestions([]);
      return;
    }

    try {
      // Safe filtering
      const filtered = articles.filter(article => 
        article && 
        typeof article === 'object' && 
        article.title && 
        typeof article.title === 'string' &&
        article.title.toLowerCase().includes(value.toLowerCase())
      );
      
      // Extract and deduplicate titles
      if (filtered && filtered.length > 0) {
        const titles = filtered.map(article => article.title.toLowerCase());
        const uniqueTitles = Array.from(new Set(titles)).slice(0, 5);
        setSuggestions(uniqueTitles);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error creating search suggestions:", error);
      setSuggestions([]);
    }
  }, [value, articles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch(newValue);
  };

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onSearch(selectedValue);
    setOpen(false);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
    setSuggestions([]);
  };

  // Only show popover if we have suggestions and value
  const showSuggestions = value.length > 0 && suggestions.length > 0;

  return (
    <div className="relative flex items-center gap-2 w-full max-w-sm">
      <Popover open={open && showSuggestions} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1 flex items-center">
            <Input
              placeholder="Search articles..."
              value={value}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </PopoverTrigger>
        {showSuggestions && (
          <PopoverContent className="w-full p-0" align="start">
            <div className="rounded-md bg-popover text-popover-foreground overflow-hidden">
              <div className="p-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    onClick={() => handleSelect(suggestion)}
                    className="flex items-center w-full rounded-sm px-2 py-1.5 text-sm cursor-default select-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <Search className="mr-2 h-4 w-4 shrink-0" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        )}
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
