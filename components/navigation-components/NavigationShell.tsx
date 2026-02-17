"use client";

import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";
import RouteSidebar from "./RouteSidebar";
import PlaceSidebar from "./PlaceSidebar";
import { PlaceData } from "@/types/DataType";
import { useSearchParams } from "next/navigation";

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

  const params = useSearchParams();
  const query = params.get("q") ?? "";

  //reacting to search changes
  useEffect(() => {
    if (!query) {
      setPlaces([]);
      setOpen(false);
      return;
    }

    setMode("searching");

    //using debouncing
    const timer = setTimeout(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/geocode?q=${query}`,
        {
          method: "GET",
        },
      );

      const data = await res.json();

      setPlaces(data.places || []);

      setOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    console.log("PLACES UPDATED:", places);
  }, [places]);

  function handleSearch(value: string) {}

  function handlePlaceSelected() {
    setMode("place-selected");
  }

  return (
    <>
      <div className="relative">
        <SearchBar />

        {/* //recomendations card */}
        {open && places.length > 0 && (
          <div className="absolute w-[380px] mt-2 rounded-lg border bg-background shadow-md z-50">
            {places.map((place: PlaceData) => (
              <button
                key={place.id}
                onClick={() => {
                  handlePlaceSelected();
                  setOpen(false);
                }}
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
          onShowDirections={() => setMode("routing")}
          onStartNavigation={() => setMode("navigating")}
        />
      )}

      {(mode === "routing" || mode === "navigating") && (
        <RouteSidebar
          isNavigating={mode === "navigating"}
          onStart={() => setMode("navigating")}
          onEnd={() => setMode("routing")}
          onCollapse={() => setMode("idle")}
        />
      )}
    </>
  );
}
