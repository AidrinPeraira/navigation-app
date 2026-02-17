"use client";

import { Button } from "@/components/ui/button";
import { PlaceData } from "@/types/DataType";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

type Props = {
  onShowDirections: () => void;
  onStartNavigation: () => void;
  place: PlaceData | null;
};

export default function PlaceSidebar({
  onShowDirections,
  onStartNavigation,
  place,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`
        fixed z-30
        left-4 bottom-4
        md:top-24 md:left-6 md:bottom-auto
        w-[90vw] md:w-72
        p-4
        rounded-xl
        bg-background/90 backdrop-blur-md
        border border-white/10
        shadow-xl
        flex flex-col gap-3
        transition-transform duration-300 ease-in-out

        ${
          collapsed
            ? "translate-y-[calc(100%-3.5rem)] md:-translate-x-[calc(100%-3.5rem)]"
            : "translate-x-0 translate-y-0"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Selected Place</h3>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle panel"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-180 md:rotate-0" : "md:rotate-180"
            }`}
          />
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium">{place?.text}</p>
        <p className="text-xs text-muted-foreground">{place?.place_name}</p>
      </div>

      <div className="flex gap-2 mt-2">
        <Button variant="outline" onClick={onShowDirections}>
          Show Directions
        </Button>

        <Button onClick={onStartNavigation}>Start Navigation</Button>
      </div>
    </div>
  );
}
