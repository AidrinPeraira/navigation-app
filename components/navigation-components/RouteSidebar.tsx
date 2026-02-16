"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ChevronLeft } from "lucide-react";

type Props = {
  isNavigating: boolean;
  onStart: () => void;
  onEnd: () => void;
  onCollapse: () => void;
};

export default function RouteSidebar({
  isNavigating,
  onStart,
  onEnd,
  onCollapse,
}: Props) {
  return (
    <div
      className="
        fixed z-30
        left-4 bottom-4
        md:top-24 md:left-6 md:bottom-auto
        w-[90vw] md:w-80
        p-4
        rounded-xl
        bg-background/90 backdrop-blur-md
        border border-white/10
        shadow-xl
        flex flex-col gap-3
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Route</h3>
        <Button size="icon" variant="ghost" onClick={onCollapse}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Inputs */}
      <Input placeholder="Origin" />
      <Input placeholder="Stop 1" />
      <Button variant="outline" className="flex gap-2">
        <Plus className="h-4 w-4" />
        Add Stop
      </Button>
      <Input placeholder="Destination" />

      {/* Action Buttons */}
      {!isNavigating ? (
        <Button className="mt-2" onClick={onStart}>
          Start Navigation
        </Button>
      ) : (
        <Button variant="destructive" onClick={onEnd}>
          End Navigation
        </Button>
      )}
    </div>
  );
}
