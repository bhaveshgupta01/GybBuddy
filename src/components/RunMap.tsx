import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GpsPoint, PlannedRoute } from '../types';
import { Colors, BorderRadius, Spacing, FontSize } from '../constants/theme';

interface RunMapProps {
  currentLocation: GpsPoint | null;
  breadcrumbs: GpsPoint[];
  route?: PlannedRoute | null;
  showMap?: boolean;
}

export function RunMap({ currentLocation, breadcrumbs, route, showMap = true }: RunMapProps) {
  const mapRef = useRef<MapView>(null);

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
        <Text style={styles.placeholderIcon}>📍</Text>
        <Text style={styles.placeholderText}>Acquiring GPS...</Text>
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
        customMapStyle={lightMapStyle}
      >
        {/* Planned route */}
        {route && route.polyline.length > 0 && (
          <Polyline
            coordinates={route.polyline}
            strokeColor={Colors.primaryMint}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Completed route */}
        {breadcrumbCoords.length > 1 && (
          <Polyline
            coordinates={breadcrumbCoords}
            strokeColor={Colors.primary}
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
              <View style={styles.startDot} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

// Light, soft map style matching the ethereal aesthetic
const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e8e8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e7f2' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4ecd6' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '300',
  },
  startMarker: {
    padding: 4,
  },
  startDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.surfaceLowest,
  },
});
