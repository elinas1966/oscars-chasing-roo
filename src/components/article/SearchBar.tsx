import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Article } from "@/utils/articleUtils";

interface SearchBarProps {
  articles: Article[];
  onSearch: (term: string) => void;
}

export const SearchBar = ({ articles = [], onSearch }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!value || !articles || !Array.isArray(articles)) {
      setSuggestions([]);
      return;
    }

    try {
      const filtered = articles.filter(article => 
        article && 
        typeof article === 'object' && 
        article.title && 
        typeof article.title === 'string' &&
        article.title.toLowerCase().includes(value.toLowerCase())
      );
      
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

  const showSuggestions = value.length > 0 && suggestions.length > 0;

  return (
    <div className="relative flex items-center gap-2 w-full max-w-sm">
      <div className="flex-1 relative">
        <Input
          placeholder="Search articles..."
          value={value}
          onChange={handleInputChange}
          className="w-full bg-secondary text-secondary-foreground"
          onFocus={() => setOpen(true)}
        />
        
        {showSuggestions && open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-md shadow-md z-50 max-h-[200px] overflow-y-auto">
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
        )}
      </div>
      
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
