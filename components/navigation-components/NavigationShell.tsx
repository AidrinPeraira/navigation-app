"use client";

import { useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import RouteSidebar from "./RouteSidebar";
import PlaceSidebar from "./PlaceSidebar";
import { PlaceData } from "@/types/DataType";
import { useSearchParams } from "next/navigation";
import { useMapbox } from "@/components/navigation-context/map-context";

export type UiMode =
  | "idle"
  | "searching"
  | "place-selected"
  | "routing"
  | "navigating";

export default function NavigationShell() {
  const [mode, setMode] = useState<UiMode>("idle");
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [open, setOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  const { selectedPlaces, setSelectedPlaces, buildRoute } = useMapbox();

  const containerRef = useRef<HTMLDivElement>(null);

  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const submit = params.get("submit");

  useEffect(() => {
    if (!query) {
      setPlaces([]);
      setSelectedPlaces([]);
      setOpen(false);
      return;
    }

    setMode("searching");

    const timer = setTimeout(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/geocode?q=${query}`,
      );

      const data = await res.json();
      setPlaces(data.places || []);

      if (submit === "true" && data.places?.length > 0) {
        setSelectedPlaces(data.places);
        setMode("place-selected");
        setOpen(false);
        return;
      }

      setOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, submit, setSelectedPlaces]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handlePlaceSelected(place: PlaceData) {
    setSelectedPlaces([place]);
    setMode("place-selected");
    setOpen(false);
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <SearchBar />

        {open && places.length > 0 && (
          <div className="absolute w-[380px] mt-2 rounded-lg border bg-background shadow-md z-50">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => handlePlaceSelected(place)}
                className="w-full text-left px-4 py-2 hover:bg-muted transition"
              >
                <div className="font-medium">{place.text}</div>
                <div className="text-xs text-muted-foreground">
                  {place.place_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "place-selected" && (
        <PlaceSidebar
          onShowDirections={async () => {
            try {
              setIsRouting(true);
              await buildRoute();
              setMode("routing");
            } finally {
              setIsRouting(false);
            }
          }}
          onStartNavigation={() => setMode("navigating")}
          place={selectedPlaces[0]}
          isLoading={isRouting}
        />
      )}

      {(mode === "routing" || mode === "navigating") && (
        <RouteSidebar
          isNavigating={mode === "navigating"}
          onStart={() => setMode("navigating")}
          onEnd={() => setMode("routing")}
        />
      )}
    </>
  );
}
