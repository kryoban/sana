"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapPinIcon,
  SearchIcon,
  XIcon,
  NavigationIcon,
  LoaderCircleIcon,
  Stethoscope,
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
import { Badge } from "@/components/ui/badge";
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
    map.setView(center, zoom || map.getZoom());
    // Invalidate map size to ensure it renders properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map, forceUpdate]);

  // Also invalidate size on mount and when window resizes
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    // Initial invalidation
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}

// Component to control popup opening/closing
function PopupController({
  selectedDoctorId,
  doctors,
}: {
  selectedDoctorId: string | null;
  doctors: Doctor[];
}) {
  const map = useMap();
  const prevSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedDoctorId) {
      // Close all popups if no doctor is selected
      map.eachLayer((layer: any) => {
        if (layer instanceof (window as any).L?.Marker) {
          if (layer.isPopupOpen && layer.isPopupOpen()) {
            layer.closePopup();
          }
        }
      });
      prevSelectedIdRef.current = null;
      return;
    }

    const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
    if (!selectedDoctor) return;

    // Close previous popup if different doctor was selected
    if (
      prevSelectedIdRef.current &&
      prevSelectedIdRef.current !== selectedDoctorId
    ) {
      const prevDoctor = doctors.find(
        (d) => d.id === prevSelectedIdRef.current
      );
      if (prevDoctor) {
        const prevLat = Array.isArray(prevDoctor.position)
          ? prevDoctor.position[0]
          : prevDoctor.position.lat;
        const prevLon = Array.isArray(prevDoctor.position)
          ? prevDoctor.position[1]
          : prevDoctor.position.lng;
        map.eachLayer((layer: any) => {
          if (layer instanceof (window as any).L?.Marker) {
            const latlng = layer.getLatLng();
            if (
              Math.abs(latlng.lat - prevLat) < 0.0001 &&
              Math.abs(latlng.lng - prevLon) < 0.0001
            ) {
              if (layer.isPopupOpen && layer.isPopupOpen()) {
                layer.closePopup();
              }
            }
          }
        });
      }
    }

    // Open popup for selected doctor
    const timer = setTimeout(() => {
      const doctorLat = Array.isArray(selectedDoctor.position)
        ? selectedDoctor.position[0]
        : selectedDoctor.position.lat;
      const doctorLon = Array.isArray(selectedDoctor.position)
        ? selectedDoctor.position[1]
        : selectedDoctor.position.lng;

      // Find the marker by position and open its popup
      map.eachLayer((layer: any) => {
        if (layer instanceof (window as any).L?.Marker) {
          const latlng = layer.getLatLng();
          // Check if this marker matches the selected doctor's position
          if (
            Math.abs(latlng.lat - doctorLat) < 0.0001 &&
            Math.abs(latlng.lng - doctorLon) < 0.0001
          ) {
            try {
              layer.openPopup();
            } catch (e) {
              console.error("Error opening popup:", e);
            }
          }
        }
      });
    }, 500);

    prevSelectedIdRef.current = selectedDoctorId;
    return () => clearTimeout(timer);
  }, [selectedDoctorId, doctors, map]);

  return null;
}

// Component for doctor marker with popup control
function DoctorMarker({
  doctor,
  isSelected,
  onSelect,
  markerRef,
  readonly = false,
}: {
  doctor: Doctor;
  isSelected: boolean;
  onSelect: () => void;
  markerRef: (ref: any) => void;
  readonly?: boolean;
}) {
  const markerRefInternal = useRef<any>(null);

  useEffect(() => {
    if (markerRefInternal.current) {
      markerRef(markerRefInternal.current);
    }
  }, [markerRef]);

  return (
    <MapMarker
      ref={(ref) => {
        markerRefInternal.current = ref;
        if (ref) {
          markerRef(ref);
        }
      }}
      position={doctor.position}
      icon={
        <div
          className={`size-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg border-2 ${
            isSelected
              ? "border-blue-500 ring-4 ring-blue-500/30"
              : "border-white"
          }`}
        >
          <Stethoscope className="size-5" />
        </div>
      }
      interactive={!readonly}
      eventHandlers={
        readonly
          ? {}
          : {
              click: () => {
                onSelect();
              },
            }
      }
    >
      {!readonly && (
        <MapPopup>
          <div className="p-2 space-y-2">
            <h3 className="font-semibold text-lg mb-1">{doctor.name}</h3>
            {doctor.specialty && (
              <p className="text-sm text-muted-foreground mb-2">
                {doctor.specialty}
              </p>
            )}
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm text-muted-foreground">
                Distanță: {doctor.distance} km
              </span>
            </div>
            <Badge
              variant={doctor.hasSeats ? "default" : "secondary"}
              className="text-xs"
            >
              {doctor.hasSeats
                ? "Locuri disponibile: Da"
                : "Locuri disponibile: Nu"}
            </Badge>
          </div>
        </MapPopup>
      )}
    </MapMarker>
  );
}

// Custom locate button component
function LocateButton({
  onClick,
  isLocating,
}: {
  onClick: () => void;
  isLocating: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      onClick={onClick}
      disabled={isLocating}
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

// Doctor data type
export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  position: LatLngExpression;
  distance: number; // in km
  hasSeats: boolean;
}

// Mock doctors data (30 doctors)
const MOCK_DOCTORS: Omit<Doctor, "distance" | "position">[] = [
  {
    id: "1",
    name: "Dr. Maria Popescu",
    specialty: "Medic pediatru",
    hasSeats: true,
  },
  { id: "2", name: "Dr. Ion Georgescu", hasSeats: true },
  {
    id: "3",
    name: "Dr. Elena Radu",
    specialty: "Gastroenterolog",
    hasSeats: false,
  },
  {
    id: "4",
    name: "Dr. Alexandru Dumitru",
    specialty: "Cardiolog",
    hasSeats: true,
  },
  { id: "5", name: "Dr. Ana Constantinescu", hasSeats: true },
  {
    id: "6",
    name: "Dr. Mihai Ionescu",
    specialty: "Endocrinolog",
    hasSeats: false,
  },
  {
    id: "7",
    name: "Dr. Carmen Stanciu",
    specialty: "Medic pediatru",
    hasSeats: true,
  },
  { id: "8", name: "Dr. Radu Vasile", hasSeats: true },
  {
    id: "9",
    name: "Dr. Laura Petrescu",
    specialty: "Pneumolog",
    hasSeats: false,
  },
  {
    id: "10",
    name: "Dr. Andrei Moldovan",
    specialty: "Nefrolog",
    hasSeats: true,
  },
  { id: "11", name: "Dr. Daniela Neagu", hasSeats: true },
  {
    id: "12",
    name: "Dr. Cristian Badea",
    specialty: "Reumatolog",
    hasSeats: false,
  },
  {
    id: "13",
    name: "Dr. Simona Marin",
    specialty: "Medic pediatru",
    hasSeats: true,
  },
  { id: "14", name: "Dr. Florin Gheorghe", hasSeats: true },
  {
    id: "15",
    name: "Dr. Ioana Nistor",
    specialty: "Dermatolog",
    hasSeats: false,
  },
  { id: "16", name: "Dr. Bogdan Toma", specialty: "Neurolog", hasSeats: true },
  { id: "17", name: "Dr. Raluca Stoica", hasSeats: true },
  {
    id: "18",
    name: "Dr. Adrian Costache",
    specialty: "Gastroenterolog",
    hasSeats: false,
  },
  {
    id: "19",
    name: "Dr. Gabriela Enache",
    specialty: "Cardiolog",
    hasSeats: true,
  },
  { id: "20", name: "Dr. Marius Popa", hasSeats: true },
  {
    id: "21",
    name: "Dr. Diana Cirstea",
    specialty: "Endocrinolog",
    hasSeats: false,
  },
  {
    id: "22",
    name: "Dr. Liviu Andrei",
    specialty: "Medic pediatru",
    hasSeats: true,
  },
  { id: "23", name: "Dr. Corina Munteanu", hasSeats: true },
  {
    id: "24",
    name: "Dr. Valentin Serban",
    specialty: "Pneumolog",
    hasSeats: false,
  },
  {
    id: "25",
    name: "Dr. Alina Dobrescu",
    specialty: "Nefrolog",
    hasSeats: true,
  },
  { id: "26", name: "Dr. Catalin Olteanu", hasSeats: true },
  {
    id: "27",
    name: "Dr. Roxana Manole",
    specialty: "Reumatolog",
    hasSeats: false,
  },
  {
    id: "28",
    name: "Dr. Stefan Diaconu",
    specialty: "Dermatolog",
    hasSeats: true,
  },
  { id: "29", name: "Dr. Claudia Ionescu", hasSeats: true },
  {
    id: "30",
    name: "Dr. Mircea Constantin",
    specialty: "Neurolog",
    hasSeats: false,
  },
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate random position within 5km radius, with minimum distance
function generateRandomPosition(
  centerLat: number,
  centerLon: number,
  maxDistanceKm: number = 5,
  minDistanceKm: number = 0.5
): [number, number] {
  // Generate random angle and distance (ensuring minimum distance)
  const angle = Math.random() * 2 * Math.PI;
  // Ensure distance is between minDistanceKm and maxDistanceKm
  const distance =
    minDistanceKm + Math.random() * (maxDistanceKm - minDistanceKm);

  const latOffset = (distance * Math.cos(angle)) / 111;
  const lonOffset =
    (distance * Math.sin(angle)) /
    (111 * Math.cos((centerLat * Math.PI) / 180));

  return [centerLat + latOffset, centerLon + lonOffset];
}

// Geocoding function
async function geocodeAddress(address: string): Promise<{
  coordinates: LatLngExpression;
  displayName: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "SanaApp/1.0",
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

// Autocomplete function
async function getAutocompleteSuggestions(
  query: string
): Promise<Array<{ displayName: string; coordinates: LatLngExpression }>> {
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
          "User-Agent": "SanaApp/1.0",
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

interface DoctorSelectionMapProps {
  initialAddress?: string;
  onAddressSelected?: (address: string, coordinates: LatLngExpression) => void;
  onDoctorSelected?: (doctor: Doctor) => void;
  readonly?: boolean;
}

export function DoctorSelectionMap({
  initialAddress = "",
  onAddressSelected,
  onDoctorSelected,
  readonly = false,
}: DoctorSelectionMapProps) {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([
    44.4268, 26.1025,
  ]); // Bucharest default
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [searchAddress, setSearchAddress] = useState(initialAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: LatLngExpression;
    displayName: string;
  } | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    Array<{ displayName: string; coordinates: LatLngExpression }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentLocation, setCurrentLocation] =
    useState<LatLngExpression | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const shouldShowSuggestionsRef = useRef(true);
  const suggestionsListRef = useRef<HTMLDivElement>(null);

  // Generate doctors when location is selected
  useEffect(() => {
    if (selectedLocation) {
      const [lat, lon] = Array.isArray(selectedLocation.coordinates)
        ? selectedLocation.coordinates
        : [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng];

      // Generate 10 random doctors within 5km
      const generatedDoctors: Doctor[] = [];
      const usedIndices = new Set<number>();

      while (
        generatedDoctors.length < 10 &&
        usedIndices.size < MOCK_DOCTORS.length
      ) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * MOCK_DOCTORS.length);
        } while (usedIndices.has(randomIndex));

        usedIndices.add(randomIndex);

        const mockDoctor = MOCK_DOCTORS[randomIndex];
        // Generate position with minimum 0.5km distance
        const [doctorLat, doctorLon] = generateRandomPosition(lat, lon, 3, 0.5);
        const distance = calculateDistance(lat, lon, doctorLat, doctorLon);

        generatedDoctors.push({
          ...mockDoctor,
          position: [doctorLat, doctorLon] as LatLngExpression,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        });
      }

      // Sort by distance
      generatedDoctors.sort((a, b) => a.distance - b.distance);

      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        setDoctors(generatedDoctors);
      }, 0);
    } else {
      setDoctors([]);
    }
  }, [selectedLocation]);

  // Debounced autocomplete search
  useEffect(() => {
    if (!shouldShowSuggestionsRef.current) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (searchAddress.trim().length >= 3) {
        setIsLoadingSuggestions(true);
        const suggestions = await getAutocompleteSuggestions(searchAddress);
        setAutocompleteSuggestions(suggestions);
        setHighlightedIndex(-1);
        if (shouldShowSuggestionsRef.current) {
          setShowSuggestions(suggestions.length > 0);
        }
        setIsLoadingSuggestions(false);
      } else {
        setAutocompleteSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }, 300);

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

  // Initial geocoding if address is provided
  useEffect(() => {
    if (initialAddress && initialAddress.trim() && !selectedLocation) {
      const performInitialSearch = async () => {
        setIsSearching(true);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        shouldShowSuggestionsRef.current = false;
        const result = await geocodeAddress(initialAddress);

        if (result) {
          setMapCenter(result.coordinates);
          setMapZoom(15);
          setSelectedLocation({
            coordinates: result.coordinates,
            displayName: result.displayName,
          });
          setSelectedDoctor(null);
          setSearchAddress(result.displayName);
          setAutocompleteSuggestions([]);
          onAddressSelected?.(result.displayName, result.coordinates);
        } else {
          alert("Adresă negăsită. Te rog încearcă o altă adresă.");
          setSelectedLocation(null);
          setDoctors([]);
        }

        setIsSearching(false);
      };

      performInitialSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

  // Handle address search
  const handleSearch = useCallback(
    async (address?: string) => {
      const query = address || searchAddress;
      if (!query.trim()) return;

      setIsSearching(true);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      shouldShowSuggestionsRef.current = false;
      const result = await geocodeAddress(query);

      if (result) {
        setMapCenter(result.coordinates);
        setMapZoom(15);
        setSelectedLocation({
          coordinates: result.coordinates,
          displayName: result.displayName,
        });
        setSelectedDoctor(null);
        setSearchAddress(result.displayName);
        setAutocompleteSuggestions([]);
        onAddressSelected?.(result.displayName, result.coordinates);
      } else {
        alert("Adresă negăsită. Te rog încearcă o altă adresă.");
        setSelectedLocation(null);
        setDoctors([]);
      }

      setIsSearching(false);
    },
    [searchAddress, onAddressSelected]
  );

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback(
    (suggestion: { displayName: string; coordinates: LatLngExpression }) => {
      shouldShowSuggestionsRef.current = false;
      setSearchAddress(suggestion.displayName);
      setShowSuggestions(false);
      setAutocompleteSuggestions([]);
      setHighlightedIndex(-1);
      setMapCenter(suggestion.coordinates);
      setMapZoom(15);
      setSelectedLocation({
        coordinates: suggestion.coordinates,
        displayName: suggestion.displayName,
      });
      setSelectedDoctor(null);
      onAddressSelected?.(suggestion.displayName, suggestion.coordinates);
    },
    [onAddressSelected]
  );

  // Get user's current location
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      let isMounted = true;

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
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      };

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

      const timeoutId = setTimeout(getInitialLocation, 0);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  // Handle clicking the locate button
  const handleLocateClick = useCallback(() => {
    if (currentLocation) {
      const locationArray = Array.isArray(currentLocation)
        ? currentLocation
        : [currentLocation.lat, currentLocation.lng];
      const newLocation: LatLngExpression = [
        locationArray[0] as number,
        locationArray[1] as number,
      ];
      setMapCenter(newLocation);
      setMapZoom(15);
      setForceUpdateCounter((prev) => prev + 1);
    } else {
      setIsLocating(true);
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location: LatLngExpression = [latitude, longitude];
            setCurrentLocation(location);
            setMapCenter(location);
            setMapZoom(15);
            setForceUpdateCounter((prev) => prev + 1);
            setIsLocating(false);
          },
          (error) => {
            console.error("Location error:", error);
            alert(
              "Nu s-a putut găsi locația ta. Te rog verifică permisiunile browserului."
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

  // Handle doctor selection from list or map
  const handleDoctorSelect = useCallback(
    (doctor: Doctor) => {
      // Clear previous selection popup
      if (selectedDoctor && markerRefs.current[selectedDoctor.id]) {
        const prevMarker = markerRefs.current[selectedDoctor.id];
        if (prevMarker && typeof prevMarker.closePopup === "function") {
          prevMarker.closePopup();
        }
      }

      // Set new selection
      setSelectedDoctor(doctor);
      setMapCenter(doctor.position);
      setMapZoom(16);
      setForceUpdateCounter((prev) => prev + 1);
    },
    [selectedDoctor]
  );

  return (
    <div
      className={`relative rounded-lg overflow-hidden border bg-background flex flex-col transition-all duration-300 ${
        readonly ? "h-[200px] w-[200px]" : "h-[500px] w-full"
      }`}
    >
      <div className="flex h-full w-full min-h-0">
        {/* Doctors list - left side */}
        {doctors.length > 0 && !readonly && (
          <div className="w-80 border-r bg-background overflow-y-auto flex-shrink-0 flex flex-col">
            <div className="p-4 border-b flex-shrink-0">
              <h3 className="font-semibold text-lg">
                Medici de familie ({doctors.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Ordonați după distanță
              </p>
            </div>
            <div className="divide-y flex-1 overflow-y-auto">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => handleDoctorSelect(doctor)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                    selectedDoctor?.id === doctor.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{doctor.name}</h4>
                      {doctor.specialty && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {doctor.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {doctor.distance} km
                    </span>
                    <Badge
                      variant={doctor.hasSeats ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {doctor.hasSeats
                        ? "Locuri disponibile: Da"
                        : "Locuri disponibile: Nu"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map - right side - always visible */}
        <div
          className="flex-1 relative min-w-0"
          style={{
            height: readonly ? "200px" : "500px",
            minWidth: readonly ? "200px" : "300px",
          }}
        >
          <MapLayers>
            <Map
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%", position: "relative" }}
              dragging={!readonly}
              touchZoom={!readonly}
              doubleClickZoom={!readonly}
              scrollWheelZoom={!readonly}
              boxZoom={!readonly}
              keyboard={!readonly}
            >
              <MapTileLayer />
              <MapCenterUpdater
                center={mapCenter}
                zoom={mapZoom}
                forceUpdate={forceUpdateCounter}
              />
              {!readonly && <MapZoomControl />}

              {/* Current location marker */}
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
                  interactive={!readonly}
                >
                  {!readonly && (
                    <MapPopup>
                      <div className="p-2">
                        <h3 className="font-semibold text-lg mb-1">
                          Locația ta
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Poziția curentă
                        </p>
                      </div>
                    </MapPopup>
                  )}
                </MapMarker>
              )}

              {/* Selected location marker */}
              {selectedLocation && (
                <MapMarker
                  position={selectedLocation.coordinates}
                  icon={
                    <div className="size-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-lg border-2 border-white ring-4 ring-yellow-500/30">
                      <MapPinIcon className="size-6" />
                    </div>
                  }
                  interactive={!readonly}
                >
                  {!readonly && (
                    <MapPopup>
                      <div className="p-2">
                        <h3 className="font-semibold text-lg mb-1">
                          Adresa selectată
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedLocation.displayName}
                        </p>
                      </div>
                    </MapPopup>
                  )}
                </MapMarker>
              )}

              {/* Component to control popup opening */}
              {!readonly && (
                <PopupController
                  selectedDoctorId={selectedDoctor?.id || null}
                  doctors={doctors}
                />
              )}

              {/* Doctor markers */}
              {doctors.map((doctor) => (
                <DoctorMarker
                  key={doctor.id}
                  doctor={doctor}
                  isSelected={selectedDoctor?.id === doctor.id}
                  onSelect={() => {
                    if (!readonly) {
                      handleDoctorSelect(doctor);
                    }
                  }}
                  markerRef={(ref: any) => {
                    if (ref) {
                      markerRefs.current[doctor.id] = ref;
                    }
                  }}
                  readonly={readonly}
                />
              ))}
            </Map>

            {/* Overlay to block all interactions when readonly */}
            {readonly && (
              <div
                className="absolute inset-0 z-[2000] cursor-not-allowed"
                style={{ pointerEvents: "all" }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
            )}

            {/* Locate button */}
            {!readonly && (
              <LocateButton
                onClick={handleLocateClick}
                isLocating={isLocating}
              />
            )}

            {/* Floating action button for selected doctor */}
            {selectedDoctor && !readonly && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
                <Button
                  onClick={() => onDoctorSelected?.(selectedDoctor)}
                  size="lg"
                  className={`shadow-lg ${
                    selectedDoctor.hasSeats
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  {selectedDoctor.hasSeats
                    ? "Alege medic"
                    : "Înscrie-te pe lista de așteptare"}
                </Button>
              </div>
            )}

            {/* Search bar overlay */}
            {!readonly && (
              <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md">
                <div className="relative">
                  <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Caută o adresă..."
                        value={searchAddress}
                        onChange={(e) => {
                          setSearchAddress(e.target.value);
                          setHighlightedIndex(-1);
                          shouldShowSuggestionsRef.current = true;
                          if (e.target.value.trim().length >= 3) {
                            setShowSuggestions(true);
                          }
                        }}
                        onFocus={() => {
                          if (
                            autocompleteSuggestions.length > 0 &&
                            shouldShowSuggestionsRef.current
                          ) {
                            setShowSuggestions(true);
                            setHighlightedIndex(-1);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            if (autocompleteSuggestions.length > 0) {
                              if (
                                !showSuggestions &&
                                shouldShowSuggestionsRef.current
                              ) {
                                setShowSuggestions(true);
                              }
                              setHighlightedIndex((prev) =>
                                prev < autocompleteSuggestions.length - 1
                                  ? prev + 1
                                  : 0
                              );
                            }
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            if (autocompleteSuggestions.length > 0) {
                              if (
                                !showSuggestions &&
                                shouldShowSuggestionsRef.current
                              ) {
                                setShowSuggestions(true);
                              }
                              setHighlightedIndex((prev) => {
                                if (prev <= 0) {
                                  return autocompleteSuggestions.length - 1;
                                }
                                return prev - 1;
                              });
                            }
                          } else if (e.key === "Enter") {
                            e.preventDefault();
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
                            e.preventDefault();
                            setSearchAddress("");
                            setSelectedLocation(null);
                            setDoctors([]);
                            setShowSuggestions(false);
                            setAutocompleteSuggestions([]);
                            setHighlightedIndex(-1);
                            shouldShowSuggestionsRef.current = true;
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
                            {autocompleteSuggestions.map(
                              (suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectSuggestion(suggestion);
                                  }}
                                  onMouseEnter={() =>
                                    setHighlightedIndex(index)
                                  }
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
                              )
                            )}
                          </div>
                        )}
                      {isLoadingSuggestions && searchAddress.length >= 3 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg px-3 py-2 z-[1001]">
                          <div className="text-sm text-muted-foreground">
                            Se încarcă sugestii...
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
            )}
          </MapLayers>
        </div>
      </div>
    </div>
  );
}
