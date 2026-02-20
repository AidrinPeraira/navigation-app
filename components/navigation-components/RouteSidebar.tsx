"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RouteInfo } from "@/types/DataType";
import { Plus, ChevronLeft } from "lucide-react";
import { useState } from "react";

type Props = {
  routes: RouteInfo[];
  activeRoute: RouteInfo | null;
  onSelectRoute: (route: RouteInfo) => void;

  isNavigating: boolean;
  onStart: () => void;
  onEnd: () => void;
};

export default function RouteSidebar({
  routes,
  activeRoute,
  onSelectRoute,
  isNavigating,
  onStart,
  onEnd,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`
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
        <h3 className="text-sm font-semibold">Route</h3>

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
