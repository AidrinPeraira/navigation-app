import GpsButton from "@/components/navigation-components/GpsButton";
import MapContainer from "@/components/navigation-components/MapContainer";
import NavigationShell from "@/components/navigation-components/NavigationShell";
import MapProvider from "@/components/navigation-context/map-provider";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function FloatingCard() {
  return (
    <MapProvider>
      {/* Mobile: no padding, true full-screen. Desktop: centred padded card. */}
      <div className="flex items-center justify-center h-[100dvh] md:min-h-screen md:p-6">
        <Card
          className="
            relative
            w-full
            max-w-6xl
            h-[100dvh] md:h-auto md:aspect-[16/10]
            overflow-hidden
            border-0 md:border md:border-white/10
            bg-white/5
            backdrop-blur-xl
            shadow-2xl
            rounded-none md:rounded-2xl
          "
        >
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 w-full max-w-sm md:max-w-[380px]">
            <Suspense
              fallback={
                <div className="relative w-full max-w-[250px] md:max-w-[380px] mx-2">
                  <div className="h-10 rounded-md bg-white/10 animate-pulse" />
                </div>
              }
            >
              <NavigationShell />
            </Suspense>
          </div>

          <div className="w-full h-full">
            <MapContainer />
            {/* <GpsButton /> */}
          </div>
        </Card>
      </div>
    </MapProvider>
  );
}
