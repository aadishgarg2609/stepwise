import React, { useEffect, useState, useRef } from 'react';
import { Alert, Platform, StyleSheet, Image, View, Text } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { geoContains } from 'd3-geo';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const geojsonPolygon = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"coordinates":[[[77.4092963664661,28.512546749161643],[77.40866437828896,28.511682889661827],[77.4098188100266,28.51107077921978],[77.4104367540217,28.512164183684803],[77.4092963664661,28.512546749161643]]],"type":"Polygon"}}]}
// Define Location and NavOBJ types
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
    distance,
    latitude,
    longitude,
    instruct: function () {
      return this.distance > 0
        ? `${this.instruction} ${this.distance} meters`
        : this.instruction;
    },
  };
};

const HomeScreen = () => {
  const [location, setLocation] = useState<LocationType>(null);
  const latestLocation = useRef<LocationType>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [instruction, setInstruction] = useState<string>('Fetching instructions...');
  const [insideGeoJSON, setInsideGeoJSON] = useState<boolean>(false);

  const navList: NavOBJ[] = [
    createNavOBJ('Walk forward for', 10, 28.5121332, 77.409751),
    createNavOBJ('Turn left and continue for', 4, 28.5121265, 77.4095868),
    createNavOBJ('Take the elevator to the ground floor', 0, 28.5119985, 77.4096666),
  ];

  // Function to handle location updates
  const getLocationUpdates = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required.');
      return;
    }

    await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        setLocation({ latitude, longitude });
        latestLocation.current = { latitude, longitude };

        //inside geojson check
        const isInside = geojsonPolygon.features.some((feature:any) =>
          geoContains(feature.geometry.coordinates, [longitude, latitude])
        );
        console.log(`User is inside geoJson: ${isInside}`);
        setInsideGeoJSON(isInside);
      }
    );
  };

  useEffect(() => {
    getLocationUpdates();
  }, []);

  useEffect(() => {
    if (!insideGeoJSON) {
      Speech.speak("You are outside the path");
    }
  }, [insideGeoJSON]);

  useEffect(() => {
    if (currentStep < navList.length && latestLocation.current) {
      const { latitude, longitude } = latestLocation.current;
      const target = navList[currentStep];

      const distance = getDistanceBetweenCoords(latitude, longitude, target.latitude, target.longitude);
      console.log(`distance to next turn: ${ Number(distance)}`);
      if (distance < 2) {
        const nextInstruction = target.instruct();
        Speech.speak(nextInstruction);
        setInstruction(nextInstruction);
        setCurrentStep((prevStep) => prevStep + 1);
      }
    }
  }, [location, currentStep]);

  

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
        <ThemedText type="title">Step-by-Step Navigation</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.instructionContainer}>
        <ThemedText type="subtitle">Current Instruction</ThemedText>
        <ThemedText>{instruction}</ThemedText>
      </ThemedView>
      {location ? (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Your Current Location</ThemedText>
          <ThemedText>
            Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
          </ThemedText>
           <ThemedText>
            {insideGeoJSON ? "You are inside the area." : "You are outside the area."}
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

// Function to calculate distance between two coordinates
const getDistanceBetweenCoords = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
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
    marginVertical: 16,
  },
  instructionContainer: {
    padding: 16,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    marginBottom: 16,
  },
  stepContainer: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
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
