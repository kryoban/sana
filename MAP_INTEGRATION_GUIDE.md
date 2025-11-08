# Map Integration Guide

## Overview

We've successfully integrated **shadcn-map** into the project, which provides a beautiful, interactive map component built specifically for shadcn/ui projects using Leaflet and React Leaflet.

## Why shadcn-map?

✅ **Minimal Effort**: Designed specifically for shadcn/ui projects  
✅ **No API Keys Required**: Uses free OpenStreetMap tiles  
✅ **Custom Pins**: Fully supports custom React components as markers  
✅ **Current Location**: Built-in locate control  
✅ **Address Search**: Easy to integrate with geocoding APIs  
✅ **Custom Popups**: Show detailed information when clicking pins  
✅ **Dark Mode Support**: Automatic theme switching  
✅ **SSR Compatible**: Works seamlessly with Next.js  

## Installation Status

✅ shadcn-map component installed  
✅ Leaflet dependencies added  
✅ Theme provider configured  
✅ CSS styles configured  

## Features Implemented

### 1. Custom Pins ✅
- Define custom markers using React components
- Different icons based on category (hospital, clinic, pharmacy)
- Fully customizable appearance

### 2. Navigate to Current Location ✅
- Built-in `MapLocateControl` component
- Automatically requests browser location permission
- Centers map on user's location
- Shows location marker with pulse animation

### 3. Navigate to Desired Address ✅
- Address search using OpenStreetMap Nominatim API (free, no API key)
- Search bar integrated with shadcn/ui Input component
- Automatically centers map on found address

### 4. Show Custom Details on Pin Click ✅
- Custom popups with detailed information
- Uses shadcn/ui styling
- Can include buttons, images, and formatted content

## Usage Example

See `components/map-example.tsx` for a complete working example.

### Basic Usage

```tsx
import {
  Map,
  MapTileLayer,
  MapMarker,
  MapPopup,
  MapZoomControl,
  MapLocateControl,
  MapLayers,
} from "@/components/ui/map";

function MyMap() {
  return (
    <div className="w-full h-[600px]">
      <MapLayers>
        <Map center={[44.4268, 26.1025]} zoom={13}>
          <MapTileLayer />
          <MapZoomControl />
          <MapLocateControl />
          
          <MapMarker position={[44.4268, 26.1025]}>
            <MapPopup>
              <div>Custom popup content</div>
            </MapPopup>
          </MapMarker>
        </Map>
      </MapLayers>
    </div>
  );
}
```

### Custom Pins

```tsx
<MapMarker
  position={[44.4268, 26.1025]}
  icon={
    <div className="size-8 rounded-full bg-red-500 flex items-center justify-center">
      <MapPinIcon className="size-5 text-white" />
    </div>
  }
>
  <MapPopup>
    <div>Hospital Information</div>
  </MapPopup>
</MapMarker>
```

### Address Search

The example includes a geocoding function using OpenStreetMap Nominatim:

```tsx
async function geocodeAddress(address: string): Promise<LatLngExpression | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    {
      headers: {
        "User-Agent": "YourAppName/1.0", // Required by Nominatim
      },
    }
  );
  
  const data = await response.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as LatLngExpression;
  }
  return null;
}
```

## Components Available

- `Map` - Main map container
- `MapTileLayer` - Tile layer for the map (automatic dark/light mode)
- `MapMarker` - Marker/pin component
- `MapPopup` - Popup for markers
- `MapTooltip` - Tooltip for markers
- `MapZoomControl` - Zoom in/out controls
- `MapLocateControl` - Current location button
- `MapLayers` - Layer management context
- `MapLayersControl` - Layer switcher dropdown
- `MapCircle`, `MapPolyline`, `MapPolygon` - Shape components
- `MapDrawControl` - Drawing tools (optional)

## Customization

### Custom Marker Icons

You can use any React component as a marker icon:

```tsx
<MapMarker
  position={[lat, lng]}
  icon={<YourCustomIcon />}
/>
```

### Custom Popup Content

Use shadcn/ui components inside popups:

```tsx
<MapPopup>
  <Card>
    <CardHeader>
      <CardTitle>Location Name</CardTitle>
      <CardDescription>Description</CardDescription>
    </CardHeader>
    <CardContent>
      <Button>Action</Button>
    </CardContent>
  </Card>
</MapPopup>
```

### Theme Support

The map automatically switches between light and dark themes based on your theme settings. No additional configuration needed!

## Geocoding Options

### Option 1: OpenStreetMap Nominatim (Current Implementation)
- ✅ Free
- ✅ No API key required
- ⚠️ Rate limits apply (1 request per second recommended)
- ⚠️ Requires User-Agent header

### Option 2: Google Geocoding API
- ✅ More accurate results
- ✅ Higher rate limits
- ❌ Requires API key
- ❌ Usage costs

### Option 3: Mapbox Geocoding API
- ✅ High quality results
- ✅ Good rate limits
- ❌ Requires API key
- ❌ Usage costs

## Next Steps

1. **Customize Pin Data**: Update the `initialPins` array in `map-example.tsx` with your actual locations
2. **Style Custom Icons**: Modify the `getCustomIcon` function to match your design
3. **Add More Features**: 
   - Routes/directions between points
   - Clustering for many markers
   - Custom tile layers
   - Drawing tools
4. **Optimize Geocoding**: Consider caching geocoding results or using a paid service for production

## Resources

- [shadcn-map Documentation](https://shadcn-map.vercel.app/)
- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenStreetMap Nominatim API](https://nominatim.org/release-docs/develop/api/Overview/)

## Troubleshooting

### Map not showing
- Ensure the container has a defined height (e.g., `h-[600px]`)
- Check browser console for errors
- Verify Leaflet CSS is loaded (already configured in `globals.css`)

### Location not working
- Check browser permissions for location access
- Ensure HTTPS (location API requires secure context)
- Test in different browsers

### Geocoding not working
- Check network requests in browser DevTools
- Verify User-Agent header is set
- Consider rate limiting (Nominatim: 1 request/second)

## Comparison with Mapbox

| Feature | shadcn-map (Leaflet) | Mapbox |
|---------|---------------------|--------|
| Cost | Free | Paid (after free tier) |
| API Key | Not required | Required |
| Setup Complexity | Low | Medium |
| Customization | High | Very High |
| Performance | Good | Excellent |
| Best For | Most use cases | Enterprise/High-traffic |

**Recommendation**: shadcn-map is perfect for your requirements and provides minimal effort with maximum results!

