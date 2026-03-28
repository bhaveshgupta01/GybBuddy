import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GpsPoint, PlannedRoute } from '../types';
import { Colors } from '../constants/theme';

interface RunMapProps {
  currentLocation: GpsPoint | null;
  breadcrumbs: GpsPoint[];
  route?: PlannedRoute | null;
  showMap?: boolean;
}

export function RunMap({ currentLocation, breadcrumbs, route, showMap = true }: RunMapProps) {
  const mapRef = useRef<MapView>(null);

  // Follow user location
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [currentLocation]);

  if (!showMap || !currentLocation) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>📍 Acquiring GPS...</Text>
      </View>
    );
  }

  const breadcrumbCoords = breadcrumbs.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={darkMapStyle}
      >
        {/* Planned route */}
        {route && route.polyline.length > 0 && (
          <Polyline
            coordinates={route.polyline}
            strokeColor={Colors.routePlanned}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Completed route */}
        {breadcrumbCoords.length > 1 && (
          <Polyline
            coordinates={breadcrumbCoords}
            strokeColor={Colors.routeCompleted}
            strokeWidth={5}
          />
        )}

        {/* Start marker */}
        {breadcrumbs.length > 0 && (
          <Marker
            coordinate={{
              latitude: breadcrumbs[0].latitude,
              longitude: breadcrumbs[0].longitude,
            }}
            title="Start"
          >
            <View style={styles.startMarker}>
              <Text style={styles.markerText}>🟢</Text>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

// Dark map style for the fitness theme
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  startMarker: {
    padding: 2,
  },
  markerText: {
    fontSize: 16,
  },
});
