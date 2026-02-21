"use client";

import { Button } from "@/components/ui/button";
import { PlaceData } from "@/types/DataType";
import {
  ChevronLeft,
  ChevronRight,
  Navigation,
  MapPin,
  Clock,
  Route,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  RotateCcw,
  RotateCw,
  Flag,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useMapbox } from "@/components/navigation-context/map-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = {
  distance: number;
  duration: number;
  name: string;
  instruction: string;
  type: string;
  modifier?: string;
  bearing_after?: number;
};

type Leg = {
  summary: string;
  distance: number;
  duration: number;
  steps: Step[];
};

type NavigationData = {
  distance: number;
  duration: number;
  legs: Leg[];
};

type Props = {
  /** Called when the user taps the ✕ / End navigation button */
  onEnd: () => void;
  /** The confirmed destination (used to display its name) */
  destination: PlaceData | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function arrivalTime(durationSeconds: number): string {
  const arrival = new Date(Date.now() + durationSeconds * 1000);
  return arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Returns a Lucide icon component for a Mapbox maneuver type + modifier */
function ManeuverIcon({
  type,
  modifier,
  className,
}: {
  type: string;
  modifier?: string;
  className?: string;
}) {
  const cls = className ?? "h-4 w-4 shrink-0";

  if (type === "arrive") return <Flag className={cls} />;
  if (type === "depart") return <Navigation className={cls} />;
  if (type === "rotary" || type === "roundabout")
    return <RotateCcw className={cls} />;

  switch (modifier) {
    case "left":
    case "sharp left":
      return <ArrowLeft className={cls} />;
    case "right":
    case "sharp right":
      return <ArrowRight className={cls} />;
    case "slight left":
      return <ArrowUpLeft className={cls} />;
    case "slight right":
      return <ArrowUpRight className={cls} />;
    case "uturn":
      return <RotateCw className={cls} />;
    case "straight":
    default:
      return <ArrowUp className={cls} />;
  }
}

/** Accent colour for a maneuver */
function maneuverColor(type: string, modifier?: string): string {
  if (type === "arrive") return "text-green-400";
  if (type === "depart") return "text-blue-400";
  if (modifier === "left" || modifier === "sharp left") return "text-amber-400";
  if (modifier === "right" || modifier === "sharp right")
    return "text-amber-400";
  return "text-muted-foreground";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NavigationSidebar({ onEnd, destination }: Props) {
  const { originPlace, currentCoords, stops } = useMapbox();

  const [collapsed, setCollapsed] = useState(false);
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLeg, setExpandedLeg] = useState<number | null>(0);

  // All steps flattened for the simple single-leg view
  const allSteps: Step[] = navData?.legs.flatMap((l) => l.steps) ?? [];

  // ── Fetch navigation data from the proxy ────────────────────────────────────

  const fetchNavigation = useCallback(async () => {
    if (!destination) return;

    // Resolve start: prefer manual originPlace, fall back to live GPS coords
    const startCoords = originPlace
      ? { lng: originPlace.lng, lat: originPlace.lat }
      : currentCoords;

    if (!startCoords) {
      setError(
        "Could not determine your location. Please set an origin or enable GPS.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startCoord = `${startCoords.lng},${startCoords.lat}`;
      const endCoord = `${destination.lng},${destination.lat}`;

      const waypointsParam =
        stops.length > 0
          ? stops.map((s) => `${s.lng},${s.lat}`).join(";")
          : undefined;

      const params = new URLSearchParams({
        start: startCoord,
        end: endCoord,
        ...(waypointsParam ? { waypoints: waypointsParam } : {}),
      });

      const res = await fetch(`/api/navigation?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to fetch navigation data");
      }

      const data: NavigationData = await res.json();
      setNavData(data);
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [destination, originPlace, currentCoords, stops]);

  // Fetch on mount (once when navigation starts)
  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  // ── Render ──────────────────────────────────────────────────────────────────

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
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold">Navigation</h3>
        </div>

        <div className="flex items-center gap-1">
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
      </div>

      {/* ── Destination label ── */}
      {destination && (
        <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-muted/30 p-3">
          <MapPin className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{destination.text}</p>
            <p className="text-xs text-muted-foreground truncate">
              {destination.place_name}
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calculating directions...
        </div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-red-300">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-fit text-xs h-7"
              onClick={fetchNavigation}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* ── ETA / Summary bar ── */}
      {navData && !isLoading && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-muted/20 p-3">
          <div className="flex flex-col items-center gap-0.5">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold">
              {formatDuration(navData.duration)}
            </span>
            <span className="text-[10px] text-muted-foreground">ETA</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <Route className="h-4 w-4 text-green-400" />
            <span className="text-xs font-semibold">
              {formatDistance(navData.distance)}
            </span>
            <span className="text-[10px] text-muted-foreground">Distance</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <Flag className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold">
              {arrivalTime(navData.duration)}
            </span>
            <span className="text-[10px] text-muted-foreground">Arrival</span>
          </div>
        </div>
      )}

      {/* ── Turn-by-turn steps ── */}
      {navData && !isLoading && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Directions
          </span>

          {/* Multi-leg: collapsible per leg */}
          {navData.legs.length > 1 ? (
            navData.legs.map((leg, legIdx) => (
              <div key={legIdx} className="rounded-lg border border-white/10">
                {/* Leg header */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/30 transition"
                  onClick={() =>
                    setExpandedLeg(expandedLeg === legIdx ? null : legIdx)
                  }
                >
                  <span className="font-medium text-left truncate">
                    {leg.summary || `Leg ${legIdx + 1}`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(leg.duration)} ·{" "}
                      {formatDistance(leg.distance)}
                    </span>
                    <ChevronRight
                      className={`h-3 w-3 transition-transform ${
                        expandedLeg === legIdx ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Leg steps */}
                {expandedLeg === legIdx && (
                  <div className="border-t border-white/10 flex flex-col divide-y divide-white/5">
                    {leg.steps.map((step, stepIdx) => (
                      <StepRow key={stepIdx} step={step} />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            /* Single leg — show steps directly */
            <div className="rounded-lg border border-white/10 flex flex-col divide-y divide-white/5">
              {allSteps.map((step, idx) => (
                <StepRow key={idx} step={step} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── End Navigation ── */}
      <Button variant="destructive" className="mt-1 gap-2" onClick={onEnd}>
        <X className="h-4 w-4" />
        End Navigation
      </Button>
    </div>
  );
}

// ── StepRow sub-component ─────────────────────────────────────────────────────

function StepRow({ step }: { step: Step }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2 hover:bg-muted/20 transition">
      <div className={`mt-0.5 ${maneuverColor(step.type, step.modifier)}`}>
        <ManeuverIcon type={step.type} modifier={step.modifier} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug">{step.instruction}</p>
        {step.name && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {step.name}
          </p>
        )}
      </div>

      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
        {formatDistance(step.distance)}
      </span>
    </div>
  );
}
