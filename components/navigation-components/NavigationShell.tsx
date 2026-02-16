"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import RouteSidebar from "./RouteSidebar";
import PlaceSidebar from "./PlaceSidebar";

export type UiMode =
  | "idle"
  | "searching"
  | "place-selected"
  | "routing"
  | "navigating";

export default function NavigationShell() {
  const [mode, setMode] = useState<UiMode>("idle");

  function handleSearch() {
    setMode("searching");
  }

  function handlePlaceSelected() {
    setMode("place-selected");
  }

  return (
    <>
      <SearchBar handleSearch={handleSearch} />

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
