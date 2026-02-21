"use client";

import { useMapbox } from "@/components/navigation-context/map-context";
import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Navigation mode constants
const NAV_PITCH = 60;
const NAV_ZOOM = 17;
const OVERVIEW_PITCH = 0;
const OVERVIEW_ZOOM_DELTA = -3; // step back from nav zoom when exiting nav

export default function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const {
    setMap,
    map,
    selectedPlaces,
    setSelectedPlaces,
    route,
    setActiveRoute,
    stops,
    previewPlace,
    currentCoords,
    isNavigating,
  } = useMapbox();

  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const previewMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const geolocateRef = useRef<mapboxgl.GeolocateControl | null>(null);

  // Track latest heading from GeolocateControl events
  const headingRef = useRef<number>(0);

  const { theme } = useTheme();

  // ── Create map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapRef.current,
      style: `mapbox://styles/mapbox/${theme ?? "dark"}-v11`,
      center: [76.27, 9.93],
      zoom: 10,
      pitch: 0,
      bearing: 0,
    });

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });

    geolocateRef.current = geolocate;
    // bottom-right keeps it away from sidebars; margin applied via CSS below
    mapInstance.addControl(geolocate, "bottom-right");

    mapInstance.on("load", () => {
      geolocate.trigger();
    });

    // Capture heading from geolocate events
    geolocate.on("geolocate", (e: any) => {
      if (e.coords?.heading != null) {
        headingRef.current = e.coords.heading;
      }
    });

    setMap(mapInstance);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstance.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          essential: true,
        });
      },
      () => {
        console.warn("User denied geolocation");
      },
    );

    return () => mapInstance.remove();
  }, [setMap, theme]);

  // ── Navigation mode: tilt, follow heading ────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    if (isNavigating && currentCoords) {
      // Fly to user position with pitch and heading-based bearing
      map.flyTo({
        center: [currentCoords.lng, currentCoords.lat],
        zoom: NAV_ZOOM,
        pitch: NAV_PITCH,
        bearing: headingRef.current,
        duration: 1200,
        essential: true,
      });

      // Keep camera locked to user while navigating
      const onGeolocate = (e: any) => {
        if (!isNavigating) return;
        const { longitude, latitude, heading } = e.coords;
        headingRef.current = heading ?? headingRef.current;
        map.easeTo({
          center: [longitude, latitude],
          bearing: headingRef.current,
          pitch: NAV_PITCH,
          duration: 500,
          easing: (t) => t,
        });
      };

      geolocateRef.current?.on("geolocate", onGeolocate);

      return () => {
        geolocateRef.current?.off("geolocate", onGeolocate);
      };
    } else {
      // Exit navigation mode — reset to overview
      map.flyTo({
        pitch: OVERVIEW_PITCH,
        bearing: 0,
        zoom: Math.max(10, map.getZoom() + OVERVIEW_ZOOM_DELTA),
        duration: 800,
      });
    }
  }, [isNavigating, map, currentCoords]);

  // ── Click-to-select route on the map ────────────────────────────────────────
  useEffect(() => {
    if (!map || route.length === 0) return;

    const handlers: {
      id: string;
      click: () => void;
      enter: () => void;
      leave: () => void;
    }[] = [];

    route.forEach((r, index) => {
      const id = `route-${index}`;
      if (!map.getLayer(id)) return;

      const onClick = () => setActiveRoute(r);
      const onEnter = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const onLeave = () => {
        map.getCanvas().style.cursor = "";
      };

      map.on("click", id, onClick);
      map.on("mouseenter", id, onEnter);
      map.on("mouseleave", id, onLeave);

      handlers.push({ id, click: onClick, enter: onEnter, leave: onLeave });
    });

    return () => {
      handlers.forEach(({ id, click, enter, leave }) => {
        map.off("click", id, click);
        map.off("mouseenter", id, enter);
        map.off("mouseleave", id, leave);
      });
    };
  }, [map, route, setActiveRoute]);

  // ── Destination / selected place markers ─────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    selectedPlaces.forEach((place, index) => {
      const marker = new mapboxgl.Marker({
        color: `${index === 0 ? "#ef4444" : "#3b82f6"}`,
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedPlaces([place, ...selectedPlaces]);
      });

      markersRef.current.push(marker);
    });

    if (selectedPlaces.length === 1) {
      const selected = selectedPlaces[0];
      map.flyTo({ center: [selected.lng, selected.lat], zoom: 14 });
    }

    if (selectedPlaces.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      selectedPlaces.forEach((place) => bounds.extend([place.lng, place.lat]));
      map.fitBounds(bounds, { padding: 80, duration: 800 });
    }
  }, [selectedPlaces, map]);

  // ── Stop markers (amber) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    stops.forEach((stop) => {
      const marker = new mapboxgl.Marker({ color: "#f59e0b" })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);
      stopMarkersRef.current.push(marker);
    });
  }, [stops, map]);

  // ── Preview marker (green) ────────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }

    if (previewPlace) {
      const marker = new mapboxgl.Marker({ color: "#22c55e" })
        .setLngLat([previewPlace.lng, previewPlace.lat])
        .addTo(map);

      previewMarkerRef.current = marker;

      map.flyTo({
        center: [previewPlace.lng, previewPlace.lat],
        zoom: 14,
        duration: 600,
      });
    }
  }, [previewPlace, map]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Map canvas */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/*
        Push the Mapbox-injected geolocate button away from the bottom edge
        so it sits clearly inside the map.
        .mapboxgl-ctrl-bottom-right is the container Mapbox uses.
      */}
      <style>{`
        .mapboxgl-ctrl-bottom-right {
          bottom: 1.5rem !important;
          right: 1rem !important;
        }
      `}</style>

      {/* ── Navigation heading arrow overlay ── */}
      {/* Placed bottom-LEFT so it never overlaps the geolocate button (bottom-right) */}
      {isNavigating && (
        <div
          className="
            pointer-events-none
            absolute bottom-8 left-6
            z-20
            flex flex-col items-center gap-1
          "
        >
          {/* Compass / heading arrow */}
          <div
            className="
              w-14 h-14
              rounded-full
              bg-background/80 backdrop-blur-sm
              border border-white/20
              shadow-xl
              flex items-center justify-center
            "
            style={{ transform: `rotate(${headingRef.current}deg)` }}
          >
            {/* Arrow SVG — points "up" = direction of travel */}
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Tail */}
              <path
                d="M12 20V8"
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Head */}
              <path
                d="M7 12L12 4L17 12"
                fill="#3b82f6"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span className="text-[10px] font-medium text-white/70 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            Navigating
          </span>
        </div>
      )}
    </div>
  );
}
