"use client";

import { MapExample } from "@/components/map-example";

export default function MapDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Map Example Demo</h1>
          <p className="text-muted-foreground">
            This is a demo page showcasing the MapExample component with
            interactive map features.
          </p>
        </div>
        <MapExample />
      </div>
    </div>
  );
}
