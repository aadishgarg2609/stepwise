

import React, { useEffect, useState, useRef } from 'react';
import { Alert, Platform, StyleSheet, Image, View, Text } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { geoContains } from 'd3-geo';
import { getCompassDirection, getRhumbLineBearing } from 'geolib';
import { Magnetometer } from 'expo-sensors';
import pointInPolygon from 'point-in-polygon';


import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const geojsonPolygon = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"coordinates":[[[77.4087526056237,28.513452713581785],[77.40747129214316,28.51349511135423],[77.40599697746796,28.511427022364344],[77.40851135413175,28.509325915486414],[77.41176556870556,28.510569625060455],[77.41054858895473,28.512675418063893],[77.4087526056237,28.513452713581785]]],"type":"Polygon"}}]}
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

type hardcodeOBJ = {
  instr: string;
  time: number;
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
  const [isAligned, setIsAligned] = useState<{
    isAligned: boolean;
    nearestDistance: number;
    bearing: number;
  }>({
    isAligned: false,
    bearing: 0,
    nearestDistance: 0
  });
  const [heading, setHeading] = useState(0);
  const [loopCounting, setLoopCounting] = useState<boolean>(false);


  const navList: NavOBJ[] = [
    createNavOBJ('Walk forward and scan your ticket for steps:', 20, 28.512043110921407, 77.40944701343976),
    createNavOBJ('Turn right, stay towards rhe right side of the platform, and continue for steps:', 30, 28.668415, 77.250398),
    createNavOBJ('Climb the stairs for steps:', 50, 28.668383, 77.250551),
    createNavOBJ('Turn left and continue for steps:', 21, 28.668339, 77.250736),
    createNavOBJ('Turn left and descend the stairs for steps:', 50, 28.668467, 77.250774),
    createNavOBJ('The platform is on your left. Take the metro heading to welcome metro station', 0, 28.668517, 77.250603),
  ];

  useEffect(() => {
    getLocationUpdates();
  }, []);

  useEffect(() => {
    if (insideGeoJSON) {
      Speech.speak("You are too close to the ledge");
    }
  }, [insideGeoJSON]);

  useEffect(() => {

    if (location && heading !== null) {
      console.log("Location and heading are valid:", location, heading);
      const { latitude, longitude } = location;

      // Find the nearest waypoint
      const nearestWaypoint = navList.reduce((prev, curr) => {
        const prevDistance = getDistanceBetweenCoords(
          latitude, longitude,
          prev.latitude, prev.longitude
        );
        const currDistance = getDistanceBetweenCoords(
          latitude, longitude,
          curr.latitude, curr.longitude
        );
        return prevDistance < currDistance ? prev : curr;
      });

      const nearestDistance = getDistanceBetweenCoords(
        latitude, longitude,
        nearestWaypoint.latitude, nearestWaypoint.longitude
      );

      console.log(`Distance to nearest waypoint: ${nearestDistance} meters`);

      // Calculate the bearing to the nearest waypoint
      const bearing = getRhumbLineBearing(
        { latitude, longitude },
        { latitude: nearestWaypoint.latitude, longitude: nearestWaypoint.longitude }
      );

      // Determine alignment with waypoint direction
      const alignmentThreshold = 15; // Degrees
      const difference = Math.abs(heading - bearing);
      // if (!isAligned.isAligned) {
        setIsAligned({
          ...isAligned,
          isAligned: difference <= alignmentThreshold || difference >= 360 - alignmentThreshold,
          bearing: bearing,
          nearestDistance: nearestDistance
        });

      // }
    }
  }, [location, heading]);


  useEffect(() => {
    if (!isAligned.isAligned) {
      if (loopCounting) return;
      const direction = heading > isAligned.bearing
        ? "Turn left slightly"
        : "Turn right slightly";

      Speech.speak(`${direction} to align with the waypoint.`);
      console.log(`${direction} to align with the waypoint.`);
    } else {
      if (loopCounting) {
        return;
      }
      setLoopCounting(true);
      const stepsToWaypoint: number = Math.round((isAligned.nearestDistance / 0.75) * 1.5); // Steps estimated (0.75m step length)
      Speech.speak(`Aligned. Move forward for approximately ${stepsToWaypoint} steps.`);
      console.log(`Aligned. Move forward for approximately ${stepsToWaypoint} steps.`);
    }
  }, [isAligned.isAligned]);

  useEffect(() => {
    console.log("main interval running");
    if (currentStep < navList.length && latestLocation.current) {
      const { latitude, longitude } = latestLocation.current;
      const target = navList[currentStep];

      const distance = getDistanceBetweenCoords(latitude, longitude, target.latitude, target.longitude);
      console.log(`distance to next turn: ${Number(distance)}`);
      if (distance < 7) { //shouldTriggerCondition
        //setShouldTriggerCondition(false);
        const nextInstruction = target.instruct();
        Speech.speak(nextInstruction);
        setInstruction(nextInstruction);
        setCurrentStep((prevStep) => prevStep + 1);
      }
    }
  }, [location, currentStep]); //, shouldTriggerCondition

  useEffect(() => {
    const subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      const heading = Math.atan2(y, x) * (180 / Math.PI);
      setHeading(Math.floor((heading + 360) % 360)); // Normalize to 0-360°
    });

    return () => subscription.remove();
  }, []);


  // Function to handle location updates
  const getLocationUpdates = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required.');
      return;
    }

    const magnetometerPermission = await Magnetometer.isAvailableAsync();
    if (!magnetometerPermission) {
      Alert.alert('Magnetometer Unavailable', 'Magnetometer access is required.');
      return false;
    }

    await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        setLocation({ latitude, longitude });
        latestLocation.current = { latitude, longitude };

        //inside geojson check
        for (const feature of geojsonPolygon.features) {
          const coordinates: any = feature.geometry.coordinates;
          const isInside = pointInPolygon( [ longitude,latitude],coordinates[0]);
          console.log(isInside, JSON.stringify(coordinates), longitude, latitude, ' input to geoCOntains ');
          if (isInside) {
            console.log(isInside, '----------isInside---------------');
            setInsideGeoJSON(true);
            break;
          }
        }
        // setInsideGeoJSON(isInside);
      }
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#29353b', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/stepwisebanner.png')}
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
