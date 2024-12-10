import React, { useEffect, useState, useRef } from 'react';
import { Alert, Platform, StyleSheet, Image } from 'react-native';
import * as Location from 'expo-location';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type LocationType = {
  latitude: number;
  longitude: number;
} | null;

type NavOBJ = {
  instruction: string;
  distance: number;
  latitude: number;
  longitude: number;
  instruct: () => string;
};

// Function to create a NavOBJ
const createNavOBJ = (instruction: string, distance: number, latitude: number, longitude: number): NavOBJ => {
  return {
    instruction,
    distance: distance * 1.5,
    latitude,
    longitude,
    instruct: function () {
      return this.distance > 0
        ? `${this.instruction} ${this.distance}`
        : this.instruction;
    },
  };
};

const HomeScreen = () => {
  const [location, setLocation] = useState<LocationType>(null);
  const latestLocation = useRef<LocationType>(null); // Ref to store the latest location
  const [instructiondist, setInstruction] = useState<any>({});
  const [iterator, setIterator] = useState<number>(0); // Maintain iterator in state
  const iteratorRef = useRef(iterator); // Store iterator in a ref to prevent dependency re-renders

  const navList: NavOBJ[] = [
    createNavOBJ('Turn left in steps:', 10.0, 28.512174801930026, 77.40950426667415),
    createNavOBJ('Go straight', 0.0, 37.7849, -122.4294),
    createNavOBJ('Turn right', 5.0, 37.7949, -122.4394),
  ];

  // Fetch location and set up interval for navigation updates
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        return;
      }
  
      const locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });
          latestLocation.current = { latitude, longitude };
        }
      );
  
      return () => locationSubscription.remove();
    };
  
    getLocation();
  }, []); // Only runs once on mount
  
  useEffect(() => {
    iteratorRef.current = iterator; // Keep ref updated
  
    const interval = setInterval(() => {
      if (iteratorRef.current < navList.length) {
        const nav = navList[iteratorRef.current];
        if (latestLocation.current) {
          const distance = getDistanceBetweenCoords(
            latestLocation.current.latitude,
            latestLocation.current.longitude,
            nav.latitude,
            nav.longitude
          );
  
          console.log("Distance to turn:", distance, "Current iterator:", iteratorRef.current);
  
          if (distance < 10) {
            console.log(`Instruction: ${nav.instruct()}`);
            setInstruction({ instruction: nav.instruct() });
            setIterator((prevIterator) => prevIterator + 1); // Safely update state
          }
        }
      }
    }, 1000);
  
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [navList]); // Only re-run when navList changes
  

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{instructiondist?.instruction}</ThemedText>
      </ThemedView>
      {location ? (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Your Location</ThemedText>
          <ThemedText>
            Latitude: {location.latitude}, Longitude: {location.longitude}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Fetching your location...</ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
};

const getDistanceBetweenCoords = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Radius of Earth in meters
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

export default HomeScreen;
