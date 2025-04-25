
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Article } from "@/utils/articleUtils";

interface SearchBarProps {
  articles: Article[];
  onSearch: (term: string) => void;
}

export const SearchBar = ({ articles, onSearch }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onSearch(selectedValue);
    setOpen(false);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  const searchSuggestions = Array.from(
    new Set(
      articles
        .map(article => article.title.toLowerCase())
        .filter(title => title.includes(value.toLowerCase()))
    )
  ).slice(0, 5);

  return (
    <div className="relative flex items-center gap-2 w-full max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1 flex items-center">
            <Input
              placeholder="Search articles..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                onSearch(e.target.value);
              }}
              className="w-full"
            />
          </div>
        </PopoverTrigger>
        {value && (
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {searchSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
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
