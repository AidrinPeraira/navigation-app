"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { LocationInput } from "./NavigationShell";

type Props = {
  origin: LocationInput;
  destination: LocationInput;
  stops: LocationInput[];
  setOrigin: (v: LocationInput) => void;
  setDestination: (v: LocationInput) => void;
  setStops: (v: LocationInput[]) => void;
};

export default function RouteSidebar({
  origin,
  destination,
  stops,
  setOrigin,
  setDestination,
  setStops,
}: Props) {
  function addStop() {
    setStops([...stops, { id: crypto.randomUUID(), value: "" }]);
  }

  function removeStop(id: string) {
    setStops(stops.filter((s) => s.id !== id));
  }

  function updateStop(id: string, value: string) {
    setStops(stops.map((s) => (s.id === id ? { ...s, value } : s)));
  }

  return (
    <div className="absolute top-20 left-0 w-80 p-4 rounded-xl bg-background/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-3">
      <Input
        placeholder="Origin"
        value={origin.value}
        onChange={(e) => setOrigin({ ...origin, value: e.target.value })}
      />

      {stops.map((stop, i) => (
        <div key={stop.id} className="flex gap-2">
          <Input
            placeholder={`Stop ${i + 1}`}
            value={stop.value}
            onChange={(e) => updateStop(stop.id, e.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => removeStop(stop.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" onClick={addStop} className="flex gap-2">
        <Plus className="h-4 w-4" />
        Add Stop
      </Button>

      <Input
        placeholder="Destination"
        value={destination.value}
        onChange={(e) =>
          setDestination({
            ...destination,
            value: e.target.value,
          })
        }
      />
    </div>
  );
}
