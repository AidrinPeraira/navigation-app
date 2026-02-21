"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceData } from "@/types/DataType";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MapPin,
  Navigation,
  Loader2,
  Check,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMapbox } from "@/components/navigation-context/map-context";

type SearchTarget = "origin" | "stop" | "destination";

type Props = {
  isNavigating: boolean;
  onStart: () => void | Promise<void>;
  onEnd: () => void;
};

export default function RouteSidebar({ isNavigating, onStart, onEnd }: Props) {
  const {
    origin,
    originPlace,
    setOriginPlace,
    destination,
    setDestination,
    setSelectedPlaces,
    route,
    activeRoute,
    setActiveRoute,
    stops,
    addStop,
    removeStop,
    buildRoute,
    clearRoutes,
    previewPlace,
    setPreviewPlace,
    locationError,
  } = useMapbox();

  const [collapsed, setCollapsed] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Carousel search state
  const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceData[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setPreviewPlace(null);
      setCarouselIndex(0);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${searchQuery}`);
        const data = await res.json();
        const places = data.places || [];
        setSearchResults(places);
        setCarouselIndex(0);
        if (places.length > 0) {
          setPreviewPlace(places[0]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchQuery, setPreviewPlace]);

  // Update preview when carousel index changes
  useEffect(() => {
    if (searchResults.length > 0 && carouselIndex < searchResults.length) {
      setPreviewPlace(searchResults[carouselIndex]);
    }
  }, [carouselIndex, searchResults, setPreviewPlace]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openSearch(target: SearchTarget) {
    setSearchTarget(target);
    setSearchQuery("");
    setSearchResults([]);
    setCarouselIndex(0);
  }

  function closeSearch() {
    setSearchTarget(null);
    setSearchQuery("");
    setSearchResults([]);
    setPreviewPlace(null);
    setCarouselIndex(0);
  }

  function prevResult() {
    setCarouselIndex((i) => (i > 0 ? i - 1 : searchResults.length - 1));
  }

  function nextResult() {
    setCarouselIndex((i) => (i < searchResults.length - 1 ? i + 1 : 0));
  }

  async function handleSelect() {
    const place = searchResults[carouselIndex];
    if (!place) return;

    const target = searchTarget;
    closeSearch();

    try {
      setIsRebuilding(true);

      if (target === "origin") {
        setOriginPlace(place);
        await buildRoute(undefined, place);
      } else if (target === "destination") {
        setDestination(place);
        await new Promise((r) => setTimeout(r, 50));
        await buildRoute();
      } else if (target === "stop") {
        const newStops = [...stops, place];
        addStop(place);
        await buildRoute(newStops);
      }
    } finally {
      setIsRebuilding(false);
    }
  }

  async function handleRemoveStop(index: number) {
    const newStops = stops.filter((_, i) => i !== index);
    removeStop(index);
    try {
      setIsRebuilding(true);
      await buildRoute(newStops);
    } finally {
      setIsRebuilding(false);
    }
  }

  async function handleClearOrigin() {
    setOriginPlace(null);
    try {
      setIsRebuilding(true);
      await buildRoute(undefined, null);
    } finally {
      setIsRebuilding(false);
    }
  }

  function handleCancel() {
    closeSearch();
    clearRoutes();
    setSelectedPlaces([]);
    setOriginPlace(null);
    for (let i = stops.length - 1; i >= 0; i--) {
      removeStop(i);
    }
    onEnd();
  }

  function formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
  }

  function formatDistance(meters: number): string {
    const km = meters / 1000;
    return km < 1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`;
  }

  const currentResult = searchResults[carouselIndex];

  // ── Shared inner content ────────────────────────────────────────────────────
  const inner = (
    <>
      {/* Origin */}
      <div className="flex items-center gap-2">
        <Navigation className="h-4 w-4 shrink-0 text-blue-500" />
        <Input value={origin} readOnly className="bg-muted/50 cursor-default" />
        {originPlace ? (
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-8 w-8"
            onClick={handleClearOrigin}
          >
            <X className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-8 w-8"
            onClick={() => openSearch("origin")}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Location error banner */}
      {locationError && !originPlace && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-amber-200">{locationError}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-fit text-xs h-7"
              onClick={() => openSearch("origin")}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Set Origin
            </Button>
          </div>
        </div>
      )}

      {/* Stops */}
      {stops.map((stop, index) => (
        <div key={`stop-${index}`} className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
          <Input
            value={stop.text}
            readOnly
            className="bg-muted/50 cursor-default"
          />
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-8 w-8"
            onClick={() => handleRemoveStop(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Add Stop button */}
      {searchTarget !== "stop" && (
        <Button
          variant="outline"
          className="flex gap-2"
          onClick={() => openSearch("stop")}
        >
          <Plus className="h-4 w-4" />
          Add Stop
        </Button>
      )}

      {/* Destination */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-red-500" />
        <Input
          value={destination?.text ?? ""}
          readOnly
          className="bg-muted/50 cursor-default"
        />
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 h-8 w-8"
          onClick={() => openSearch("destination")}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      {/* Carousel Search Panel */}
      {searchTarget && (
        <div
          ref={searchRef}
          className="rounded-lg border bg-background/95 p-3 flex flex-col gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {searchTarget === "origin"
                ? "Set Origin"
                : searchTarget === "stop"
                  ? "Add Stop"
                  : "Change Destination"}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-6 w-6"
              onClick={closeSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <Input
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />

          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {!isSearching && searchResults.length > 0 && currentResult && (
            <div className="flex flex-col gap-2">
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="font-medium text-sm">
                    {currentResult.text}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {currentResult.place_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={prevResult}
                  disabled={searchResults.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-xs text-muted-foreground flex-1 text-center">
                  {carouselIndex + 1} / {searchResults.length}
                </span>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={nextResult}
                  disabled={searchResults.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button size="sm" className="ml-2 gap-1" onClick={handleSelect}>
                  <Check className="h-3 w-3" />
                  Select
                </Button>
              </div>
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              No places found
            </p>
          )}
        </div>
      )}

      {/* Route alternatives */}
      {route.length > 1 && (
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-xs font-medium text-muted-foreground">
            Route alternatives
          </span>
          {route.map((r, i) => (
            <button
              key={i}
              onClick={() => setActiveRoute(r)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                r === activeRoute
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-transparent hover:bg-muted"
              }`}
            >
              <span className="font-medium">{formatDuration(r.duration)}</span>
              <span className="text-muted-foreground ml-2">
                {formatDistance(r.distance)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Single route info */}
      {route.length === 1 && activeRoute && (
        <div className="text-sm text-muted-foreground px-1">
          {formatDuration(activeRoute.duration)} ·{" "}
          {formatDistance(activeRoute.distance)}
        </div>
      )}

      {/* Rebuilding indicator */}
      {isRebuilding && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating route...
        </div>
      )}

      {/* Action Buttons */}
      {!isNavigating ? (
        <div className="mt-2 flex flex-col gap-2">
          <Button
            className="gap-1.5"
            disabled={isStarting || isRebuilding}
            onClick={async () => {
              try {
                setIsStarting(true);
                await onStart();
              } finally {
                setIsStarting(false);
              }
            }}
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Start Navigation
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 text-muted-foreground"
            onClick={handleCancel}
            disabled={isStarting || isRebuilding}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="destructive" onClick={onEnd}>
          End Navigation
        </Button>
      )}
    </>
  );

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
          max-h-[80vh]
          ${collapsed ? "translate-y-[calc(100%-2.75rem)]" : "translate-y-0"}
        `}
      >
        {/* Pull handle / header row */}
        <button
          className="flex items-center justify-between w-full px-4 h-11 shrink-0"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle panel"
        >
          <span className="font-semibold text-sm">Route</span>
          <ChevronUp
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Scrollable content */}
        {!collapsed && (
          <div className="px-4 pb-5 flex flex-col gap-3 overflow-y-auto">
            {inner}
          </div>
        )}
      </div>

      {/* ── Desktop: left-side slide-out panel ── */}
      <div
        className={`
          hidden md:flex
          fixed z-30
          top-24 left-0
          w-96
          flex-col gap-3
          transition-transform duration-300 ease-in-out
          ${collapsed ? "-translate-x-[calc(100%-2.75rem)]" : "translate-x-6"}
        `}
      >
        <div
          className="
            flex flex-col gap-3
            bg-background/90 backdrop-blur-md
            border border-white/10
            shadow-xl
            rounded-xl
            p-4
            max-h-[80vh] overflow-y-auto
          "
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
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {!collapsed && inner}
        </div>
      </div>
    </>
  );
}
