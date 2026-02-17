"use client";

import { Button } from "@/components/ui/button";
import { PlaceData } from "@/types/DataType";

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
  return (
    <div
      className="
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
      "
    >
      <h3 className="font-semibold">Selected Place</h3>

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
