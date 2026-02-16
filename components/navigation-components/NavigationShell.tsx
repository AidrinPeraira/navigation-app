"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import RouteSidebar from "./RouteSidebar";

export default function NavigationShell() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <>
      <SearchBar onFocus={() => setShowSidebar(true)} />

      {showSidebar && (
        <RouteSidebar
          isNavigating={isNavigating}
          onStart={() => {
            setIsNavigating(true);
            setShowSidebar(false);
          }}
          onEnd={() => {
            setIsNavigating(false);
            setShowSidebar(true);
          }}
          onCollapse={() => setShowSidebar(false)}
        />
      )}
    </>
  );
}
