"use client";

import { Button } from "@/components/ui/button";
import { PlaceData } from "@/types/DataType";
import { ChevronLeft, ChevronUp, Loader2, Navigation } from "lucide-react";
import { useState } from "react";

type Props = {
  onShowDirections: () => void;
  onStartNavigation: () => void;
  place: PlaceData | null;
  isLoading: boolean;
};

export default function PlaceSidebar({
  onShowDirections,
  onStartNavigation,
  place,
  isLoading,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ── Mobile: bottom action-bar drawer ── */}
      <div
        className={`
          md:hidden
          fixed z-30 bottom-0 left-0 right-0
          bg-background/95 backdrop-blur-md
          border-t border-white/10
          shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${collapsed ? "translate-y-[calc(100%-2.75rem)]" : "translate-y-0"}
        `}
      >
        {/* Pull handle / header row */}
        <button
          className="flex items-center justify-between w-full px-4 h-11 shrink-0"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle panel"
        >
          <span className="font-semibold text-sm">Selected Place</span>
          <ChevronUp
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Content */}
        <div className="px-4 pb-5 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">{place?.text}</p>
            <p className="text-xs text-muted-foreground">{place?.place_name}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onShowDirections}
              disabled={isLoading}
              className="flex gap-1.5 flex-1 min-w-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span className="truncate">Finding routes…</span>
                </>
              ) : (
                "Show Directions"
              )}
            </Button>

            <Button
              onClick={onStartNavigation}
              disabled={isLoading}
              className="flex gap-1.5 flex-1 min-w-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span className="truncate">Starting…</span>
                </>
              ) : (
                <>
                  <Navigation className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Start Navigation</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Desktop: left-side slide-out panel ── */}
      <div
        className={`
          hidden md:flex
          fixed z-30
          top-24 left-0
          w-72
          flex-col gap-3
          transition-transform duration-300 ease-in-out
          ${collapsed ? "-translate-x-[calc(100%-2.75rem)]" : "translate-x-6"}
        `}
      >
        {/* Card body */}
        <div
          className="
            flex flex-col gap-3
            bg-background/90 backdrop-blur-md
            border border-white/10
            shadow-xl
            rounded-xl
            p-4
          "
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
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {!collapsed && (
            <>
              <div>
                <p className="text-sm font-medium">{place?.text}</p>
                <p className="text-xs text-muted-foreground">
                  {place?.place_name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={onShowDirections}
                  disabled={isLoading}
                  className="flex gap-1.5 flex-1 min-w-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                      <span className="truncate">Finding routes…</span>
                    </>
                  ) : (
                    "Show Directions"
                  )}
                </Button>

                <Button
                  onClick={onStartNavigation}
                  disabled={isLoading}
                  className="flex gap-1.5 flex-1 min-w-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                      <span className="truncate">Starting…</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Start</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
