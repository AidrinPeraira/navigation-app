"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceData } from "@/types/DataType";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
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
  onStart: () => void;
  onEnd: () => void;
};

export default function RouteSidebar({ isNavigating, onStart, onEnd }: Props) {
  const {
    origin,
    originPlace,
    setOriginPlace,
    destination,
    setDestination,
    route,
    activeRoute,
    setActiveRoute,
    stops,
    addStop,
    removeStop,
    buildRoute,
    previewPlace,
    setPreviewPlace,
    locationError,
  } = useMapbox();

  const [collapsed, setCollapsed] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

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
        // Destination changed — need a tick for state to settle
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

  return (
    <div
      className={`
        fixed z-30
        left-4 bottom-4
        md:top-24 md:left-6 md:bottom-auto
        w-[90vw] md:w-96
        p-4
        rounded-xl
        bg-background/90 backdrop-blur-md
        border border-white/10
        shadow-xl
        flex flex-col gap-3
        transition-transform duration-300 ease-in-out
        max-h-[80vh] overflow-y-auto

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

          {/* Loading */}
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {/* Carousel result card */}
          {!isSearching && searchResults.length > 0 && currentResult && (
            <div className="flex flex-col gap-2">
              {/* Result card */}
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

              {/* Navigation + Select */}
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

          {/* No results */}
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
