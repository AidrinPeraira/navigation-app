"use client";

import SavedRoutesDropdown from "./SavedRoutesDropdown";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Props = {
  onFocus: () => void;
};

export default function SearchBar({ onFocus }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[380px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search destination..."
          onFocus={onFocus}
          className="pl-9 bg-background/80 backdrop-blur-md border-white/10"
        />
      </div>

      <SavedRoutesDropdown />
    </div>
  );
}
