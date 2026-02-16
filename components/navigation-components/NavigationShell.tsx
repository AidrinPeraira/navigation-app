"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import RouteSidebar from "./RouteSidebar";

export type LocationInput = {
  id: string;
  value: string;
};

export default function NavigationShell() {
  const [showSidebar, setShowSidebar] = useState(false);

  const [origin, setOrigin] = useState<LocationInput>({
    id: crypto.randomUUID(),
    value: "",
  });

  const [destination, setDestination] = useState<LocationInput>({
    id: crypto.randomUUID(),
    value: "",
  });

  const [stops, setStops] = useState<LocationInput[]>([]);

  return (
    <>
      {/* Top Search */}
      <SearchBar onFocus={() => setShowSidebar(true)} />

      {/* Sidebar */}
      {showSidebar && (
        <RouteSidebar
          origin={origin}
          destination={destination}
          stops={stops}
          setOrigin={setOrigin}
          setDestination={setDestination}
          setStops={setStops}
        />
      )}
    </>
  );
}
