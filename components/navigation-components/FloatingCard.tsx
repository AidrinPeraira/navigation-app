import GpsButton from "@/components/navigation-components/GpsButton";
import MapContainer from "@/components/navigation-components/MapContainer";
import NavigationShell from "@/components/navigation-components/NavigationShell";
import MapProvider from "@/components/navigation-context/map-provider";
import { Card } from "@/components/ui/card";

export default function FloatingCard() {
  return (
    <MapProvider>
      <div className="flex items-center justify-center h-screen md:min-h-screen p-2 md:p-6">
        <Card
          className="
        relative 
        w-full 
        max-w-6xl 
        /* Mobile: fill most of the screen height. Desktop: maintain 16/10 ratio */
        h-[90vh] md:h-auto md:aspect-[16/10] 
        overflow-hidden 
        border-white/10 
        bg-white/5 
        backdrop-blur-xl 
        shadow-2xl 
        rounded-2xl"
        >
          <div className="absolute top-6 left-6 z-20">
            <NavigationShell />
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
