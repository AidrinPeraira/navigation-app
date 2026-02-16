"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SavedRoutesDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="bg-background/80 backdrop-blur-md border border-white/10"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>Home → Office</DropdownMenuItem>
        <DropdownMenuItem>Airport Route</DropdownMenuItem>
        <DropdownMenuItem>City Center</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
