"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapPinIcon,
  SearchIcon,
  XIcon,
  NavigationIcon,
  LoaderCircleIcon,
} from "lucide-react";
import {
  Map,
  MapTileLayer,
  MapMarker,
  MapPopup,
  MapZoomControl,
  MapLayers,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

// Component to update map view when center changes
function MapCenterUpdater({
  center,
  zoom,
  forceUpdate,
}: {
  center: LatLngExpression;
  zoom?: number;
  forceUpdate?: number;
}) {
  const map = useMap();

  useEffect(() => {
    // Always update the map view, even if coordinates appear the same
    // This ensures navigation works every time the button is clicked
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map, forceUpdate]);

  return null;
}

// Custom locate button component
function LocateButton({
  onClick,
  isLocating,
  hasLocation,
}: {
  onClick: () => void;
  isLocating: boolean;
  hasLocation: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      onClick={onClick}
      disabled={isLocating}
      title={
        isLocating
          ? "Locating..."
          : hasLocation
          ? "Go to your location"
          : "Get your location"
      }
      aria-label={
        isLocating
          ? "Locating..."
          : hasLocation
          ? "Go to your location"
          : "Get your location"
      }
      className="absolute right-1 bottom-1 z-[1000] border"
    >
      {isLocating ? (
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <NavigationIcon />
      )}
    </Button>
  );
}

// Define a type for your custom pin data
interface PinData {
  id: string;
  position: LatLngExpression;
  title: string;
  description: string;
  category?: string;
}

// Example custom pins data
const initialPins: PinData[] = [
  {
    id: "1",
    position: [44.4268, 26.1025] as LatLngExpression, // Bucharest coordinates
    title: "Hospital Central",
    description: "Main hospital facility with emergency services",
    category: "hospital",
  },
  {
    id: "2",
    position: [44.4378, 26.0967] as LatLngExpression,
    title: "Clinic North",
    description: "Specialized clinic for outpatient care",
    category: "clinic",
  },
  {
    id: "3",
    position: [44.4158, 26.1085] as LatLngExpression,
    title: "Pharmacy Center",
    description: "24/7 pharmacy with prescription services",
    category: "pharmacy",
  },
];

// Custom marker icons based on category
const getCustomIcon = (category?: string) => {
  const baseClasses = "size-8 text-primary";

  switch (category) {
    case "hospital":
      return (
        <div
          className={`${baseClasses} rounded-full bg-red-500 flex items-center justify-center text-white`}
        >
          <MapPinIcon className="size-5" />
        </div>
      );
    case "clinic":
      return (
        <div
          className={`${baseClasses} rounded-full bg-blue-500 flex items-center justify-center text-white`}
        >
          <MapPinIcon className="size-5" />
        </div>
      );
    case "pharmacy":
      return (
        <div
          className={`${baseClasses} rounded-full bg-green-500 flex items-center justify-center text-white`}
        >
          <MapPinIcon className="size-5" />
        </div>
      );
    default:
      return (
        <div
          className={`${baseClasses} rounded-full bg-primary flex items-center justify-center text-primary-foreground`}
        >
          <MapPinIcon className="size-5" />
        </div>
      );
  }
};

// Geocoding result type
interface GeocodeResult {
  coordinates: LatLngExpression;
  displayName: string;
}

// Autocomplete suggestion type
interface AutocompleteSuggestion {
  displayName: string;
  coordinates: LatLngExpression;
}

// Geocoding function using OpenStreetMap Nominatim API (free, no API key required)
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "YourAppName/1.0", // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        coordinates: [
          parseFloat(data[0].lat),
          parseFloat(data[0].lon),
        ] as LatLngExpression,
        displayName: data[0].display_name || address,
      };
    }

    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

// Autocomplete function using OpenStreetMap Nominatim API
async function getAutocompleteSuggestions(
  query: string
): Promise<AutocompleteSuggestion[]> {
  if (!query.trim() || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5`,
      {
        headers: {
          "User-Agent": "YourAppName/1.0", // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error("Autocomplete failed");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        displayName: item.display_name,
        coordinates: [
          parseFloat(item.lat),
          parseFloat(item.lon),
        ] as LatLngExpression,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error getting autocomplete suggestions:", error);
    return [];
  }
}

export function MapExample() {
  const [pins, setPins] = useState<PinData[]>(initialPins);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([
    44.4268, 26.1025,
  ]); // Bucharest default
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{
    coordinates: LatLngExpression;
    displayName: string;
  } | null>(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    AutocompleteSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentLocation, setCurrentLocation] =
    useState<LatLngExpression | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const shouldShowSuggestionsRef = useRef(true); // Track if we should show suggestions
  const suggestionsListRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete search
  useEffect(() => {
    // Only show suggestions if user is actively typing (not after selection/search)
    if (!shouldShowSuggestionsRef.current) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (searchAddress.trim().length >= 3) {
        setIsLoadingSuggestions(true);
        const suggestions = await getAutocompleteSuggestions(searchAddress);
        setAutocompleteSuggestions(suggestions);
        setHighlightedIndex(-1); // Reset highlighted index when suggestions change
        // Only show if we're still in "typing mode"
        if (shouldShowSuggestionsRef.current) {
          setShowSuggestions(suggestions.length > 0);
        }
        setIsLoadingSuggestions(false);
      } else {
        setAutocompleteSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchAddress]);

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (
      highlightedIndex >= 0 &&
      suggestionsListRef.current &&
      showSuggestions
    ) {
      const listElement = suggestionsListRef.current;
      const highlightedElement = listElement.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex, showSuggestions]);

  // Handle address search
  const handleSearch = useCallback(
    async (address?: string) => {
      const query = address || searchAddress;
      if (!query.trim()) return;

      setIsSearching(true);
      setShowSuggestions(false); // Hide suggestions when searching
      setHighlightedIndex(-1); // Reset highlighted index
      shouldShowSuggestionsRef.current = false; // Prevent suggestions from reopening
      const result = await geocodeAddress(query);

      if (result) {
        setMapCenter(result.coordinates);
        setMapZoom(18); // Zoom to 90% (level 18 out of 20)
        setSearchedLocation({
          coordinates: result.coordinates,
          displayName: result.displayName,
        });
        setSelectedPin(null); // Clear any selected pin
        setSearchAddress(result.displayName); // Update input with full address
        setAutocompleteSuggestions([]); // Clear suggestions
      } else {
        alert("Address not found. Please try a different address.");
        setSearchedLocation(null);
      }

      setIsSearching(false);
    },
    [searchAddress]
  );

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      shouldShowSuggestionsRef.current = false; // Prevent suggestions from reopening
      setSearchAddress(suggestion.displayName);
      setShowSuggestions(false);
      setAutocompleteSuggestions([]); // Clear suggestions
      setHighlightedIndex(-1); // Reset highlighted index
      setMapCenter(suggestion.coordinates);
      setMapZoom(18); // Zoom to 90% (level 18 out of 20)
      setSearchedLocation({
        coordinates: suggestion.coordinates,
        displayName: suggestion.displayName,
      });
      setSelectedPin(null);
    },
    []
  );

  // Get user's current location on mount and always track it
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      let isMounted = true;

      // Get initial location
      const getInitialLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) return;
            const { latitude, longitude } = position.coords;
            const location: LatLngExpression = [latitude, longitude];
            setCurrentLocation(location);
          },
          (error) => {
            if (!isMounted) return;
            console.error("Location error:", error);
            // Don't show alert on initial load - user can still use the locate button
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache for 1 minute
          }
        );
      };

      // Watch position to keep it updated
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMounted) return;
          const { latitude, longitude } = position.coords;
          const location: LatLngExpression = [latitude, longitude];
          setCurrentLocation(location);
        },
        (error) => {
          if (!isMounted) return;
          console.error("Location watch error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );

      // Get initial location after a brief delay to avoid synchronous setState
      const timeoutId = setTimeout(getInitialLocation, 0);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  // Handle clicking the locate button - just pan/zoom to current location
  const handleLocateClick = useCallback(() => {
    if (currentLocation) {
      // Create a new array reference to ensure React detects the change
      // Also increment force update counter to ensure map updates
      const locationArray = Array.isArray(currentLocation)
        ? currentLocation
        : [currentLocation.lat, currentLocation.lng];
      const newLocation: LatLngExpression = [
        locationArray[0] as number,
        locationArray[1] as number,
      ];
      setMapCenter(newLocation);
      setMapZoom(18); // Zoom to 90% (level 18 out of 20)
      setForceUpdateCounter((prev) => prev + 1); // Force update
    } else {
      // Try to get location if we don't have it
      setIsLocating(true);
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location: LatLngExpression = [latitude, longitude];
            setCurrentLocation(location);
            setMapCenter(location);
            setMapZoom(18);
            setForceUpdateCounter((prev) => prev + 1); // Force update
            setIsLocating(false);
          },
          (error) => {
            console.error("Location error:", error);
            alert(
              "Unable to find your location. Please check your browser permissions."
            );
            setIsLocating(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      }
    }
  }, [currentLocation]);

  return (
    <div className="w-full h-[600px] relative rounded-lg overflow-hidden border">
      <MapLayers>
        <Map center={mapCenter} zoom={mapZoom} className="w-full h-full">
          <MapTileLayer />
          <MapCenterUpdater
            center={mapCenter}
            zoom={mapZoom}
            forceUpdate={forceUpdateCounter}
          />
          <MapZoomControl />

          {/* Always show current location marker */}
          {currentLocation && (
            <MapMarker
              position={currentLocation}
              iconAnchor={[8, 8]}
              icon={
                <div
                  className="relative"
                  style={{ width: "16px", height: "16px" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full bg-blue-600 border-2 border-white shadow-lg z-10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 rounded-full bg-blue-600/30 animate-ping" />
                </div>
              }
            >
              <MapPopup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg mb-1">Your Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Current position
                  </p>
                </div>
              </MapPopup>
            </MapMarker>
          )}

          {/* Render searched location marker (temporary) */}
          {searchedLocation && (
            <MapMarker
              position={searchedLocation.coordinates}
              icon={
                <div className="size-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-lg border-2 border-white ring-4 ring-yellow-500/30">
                  <MapPinIcon className="size-6" />
                </div>
              }
              eventHandlers={{
                click: () => {
                  // Optionally show details when clicked
                },
              }}
            >
              <MapPopup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg mb-1">
                    Searched Location
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {searchedLocation.displayName}
                  </p>
                  <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                    Search Result
                  </span>
                </div>
              </MapPopup>
            </MapMarker>
          )}

          {/* Render custom pins */}
          {pins.map((pin) => (
            <MapMarker
              key={pin.id}
              position={pin.position}
              icon={getCustomIcon(pin.category)}
              eventHandlers={{
                click: () => {
                  setSelectedPin(pin);
                  setSearchedLocation(null); // Clear searched location when clicking a pin
                },
              }}
            >
              <MapPopup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg mb-1">{pin.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {pin.description}
                  </p>
                  {pin.category && (
                    <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                      {pin.category}
                    </span>
                  )}
                </div>
              </MapPopup>
            </MapMarker>
          ))}
        </Map>

        {/* Custom locate button - positioned absolutely over the map */}
        <LocateButton
          onClick={handleLocateClick}
          isLocating={isLocating}
          hasLocation={!!currentLocation}
        />

        {/* Search bar overlay - positioned to avoid zoom controls */}
        <div className="absolute top-4 left-[60px] right-4 z-[1000] max-w-md">
          <div className="relative">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search for an address..."
                  value={searchAddress}
                  onChange={(e) => {
                    setSearchAddress(e.target.value);
                    setHighlightedIndex(-1); // Reset highlighted index when typing
                    // Re-enable suggestions when user starts typing
                    shouldShowSuggestionsRef.current = true;
                    if (e.target.value.trim().length >= 3) {
                      setShowSuggestions(true);
                    }
                  }}
                  onFocus={() => {
                    // Only show existing suggestions if user is actively typing
                    if (
                      autocompleteSuggestions.length > 0 &&
                      shouldShowSuggestionsRef.current
                    ) {
                      setShowSuggestions(true);
                      setHighlightedIndex(-1); // Reset highlighted index on focus
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestions
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (autocompleteSuggestions.length > 0) {
                        // Show suggestions if hidden
                        if (
                          !showSuggestions &&
                          shouldShowSuggestionsRef.current
                        ) {
                          setShowSuggestions(true);
                        }
                        // Navigate down through suggestions
                        setHighlightedIndex(
                          (prev) =>
                            prev < autocompleteSuggestions.length - 1
                              ? prev + 1
                              : 0 // Wrap to first if at end
                        );
                      }
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      if (autocompleteSuggestions.length > 0) {
                        // Show suggestions if hidden
                        if (
                          !showSuggestions &&
                          shouldShowSuggestionsRef.current
                        ) {
                          setShowSuggestions(true);
                        }
                        // Navigate up through suggestions
                        setHighlightedIndex((prev) => {
                          if (prev <= 0) {
                            // If at first item or nothing selected, go to last item (wrap)
                            return autocompleteSuggestions.length - 1;
                          }
                          return prev - 1;
                        });
                      }
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      // If a suggestion is highlighted, select it; otherwise perform search
                      if (
                        highlightedIndex >= 0 &&
                        highlightedIndex < autocompleteSuggestions.length
                      ) {
                        handleSelectSuggestion(
                          autocompleteSuggestions[highlightedIndex]
                        );
                      } else {
                        handleSearch();
                      }
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                      setHighlightedIndex(-1);
                    }
                  }}
                  className={`bg-background/95 backdrop-blur-sm h-9 text-sm ${
                    searchAddress ? "pr-8" : ""
                  }`}
                />
                {searchAddress && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent input blur when clicking clear button
                      e.preventDefault();
                      setSearchAddress("");
                      setSearchedLocation(null);
                      setShowSuggestions(false);
                      setAutocompleteSuggestions([]);
                      setHighlightedIndex(-1); // Reset highlighted index
                      shouldShowSuggestionsRef.current = true; // Re-enable suggestions after clear
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors text-muted-foreground hover:text-foreground z-10"
                    aria-label="Clear search"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
                {/* Autocomplete suggestions dropdown */}
                {showSuggestions &&
                  autocompleteSuggestions.length > 0 &&
                  !isLoadingSuggestions && (
                    <div
                      ref={suggestionsListRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg max-h-60 overflow-y-auto z-[1001]"
                    >
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent input blur when clicking suggestion
                            e.preventDefault();
                            handleSelectSuggestion(suggestion);
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`w-full text-left px-3 py-2 transition-colors border-b last:border-b-0 cursor-pointer ${
                            highlightedIndex === index
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <MapPinIcon className="size-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-foreground line-clamp-2">
                              {suggestion.displayName}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                {isLoadingSuggestions && searchAddress.length >= 3 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg px-3 py-2 z-[1001]">
                    <div className="text-sm text-muted-foreground">
                      Loading suggestions...
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching}
                size="sm"
                className={`h-9 transition-colors ${
                  searchAddress.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-background/95 backdrop-blur-sm border-2 border-blue-400/50 hover:border-blue-500 hover:bg-blue-50/50"
                }`}
              >
                <SearchIcon
                  className={`size-4 ${
                    searchAddress.trim()
                      ? "text-white"
                      : "text-blue-600 opacity-80"
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Selected pin details card */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md">
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold text-lg mb-1">
                {selectedPin.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedPin.description}
              </p>
              {selectedPin.category && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">
                    Category:
                  </span>
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                    {selectedPin.category}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setMapCenter(selectedPin.position);
                  setMapZoom(18); // Zoom to 90% (level 18 out of 20)
                  setSelectedPin(null);
                  setSearchedLocation(null); // Clear searched location
                }}
              >
                Navigate to this location
              </Button>
            </div>
          </div>
        )}
      </MapLayers>
    </div>
  );
}
