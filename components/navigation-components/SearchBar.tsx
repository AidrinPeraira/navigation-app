"use client";

import SavedRoutesDropdown from "./SavedRoutesDropdown";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SyntheticEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("q") ?? "";

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[380px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          placeholder="Search destination..."
          className="pl-9 bg-background/80 backdrop-blur-md border-white/10"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <SavedRoutesDropdown />
    </div>
  );
}
