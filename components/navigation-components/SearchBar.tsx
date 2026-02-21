"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (inputValue) {
        params.set("q", inputValue);
      } else {
        params.delete("q");
      }

      params.delete("submit");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <div className="relative w-full max-w-[250px] md:max-w-[380px] mx-2">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={inputValue}
        placeholder="Search destination..."
        className="pl-9 bg-background/80 backdrop-blur-md border-white/10"
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const params = new URLSearchParams(searchParams.toString());
            params.set("submit", "true");
            router.replace(`?${params.toString()}`);
          }
        }}
      />
    </div>
  );
}
