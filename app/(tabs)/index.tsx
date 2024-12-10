import React, { useEffect, useState, useRef } from 'react';
import { Alert, Platform, StyleSheet, Image } from 'react-native';
import * as Location from 'expo-location'; // Importing expo-location

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Tts from 'react-native-tts';
//import { useSpeechSynthesis} from '@/react-speech-kit';

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

//const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationType>(null);
  const latestLocation = useRef<LocationType>(null); // Ref to store the latest location

  const[instructiondist, setInstruction] = useState<any>({});
  const[iterator, setIterator] = useState<number>(0);


  // Use watchPositionAsync for continuous location updates
  useEffect(() => {
    const getLocation = async () => {
      // Request location permission for Android and iOS
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        return;
      }

      // Watch for location updates
      const locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 }, // Update every 1 second or 1 meter
        (newLocation) => {
          setLocation({
            latitude: newLocation?.coords?.latitude,
            longitude: newLocation?.coords?.longitude,
          });

          latestLocation.current = {
            latitude: newLocation?.coords?.latitude,
            longitude: newLocation?.coords?.longitude,
          };

          console.log('Location:', newLocation?.coords?.latitude, newLocation?.coords?.longitude); // Log the location
          //const distance1 = getDistanceBetweenCoords(newLocation.coords.latitude, newLocation.coords.longitude, 28.5125971, 77.4099894); 
          //console.log(`Distance: ${distance1.toFixed(2)} meters`);
        }
      );

      // Cleanup on component unmount
      return () => locationSubscription.remove();
    };

    // Call getLocation on initial load
    getLocation();
  }, []);

  const navList: NavOBJ[] = [
    createNavOBJ('Turn left in steps:', 10.0, 28.512174801930026, 77.40950426667415),
    createNavOBJ('Go straight', 0.0, 37.7849, -122.4294),
    createNavOBJ('Turn right', 5.0, 37.7949, -122.4394),
  ];
  
  // Now you can use latestLocation.current inside your loop
  setInterval(()=>{
    const nav = navList[iterator];
     if (latestLocation.current) {
       const distance = getDistanceBetweenCoords(
         latestLocation.current.latitude,
         latestLocation.current.longitude,
         nav.latitude,
         nav.longitude
       );
       console.log("distance to turn is: " + distance + "current i is " + iterator);
       if (distance < 10) {
         console.log(`Instruction: ${nav.instruct()}`);
         setInstruction({instruction:`Instruction: ${nav.instruct()}`})
         setIterator(iterator+1) // Exit the loop once the distance is less than 10 meters
       }
  //     await delay(1000);
     }
   },1000)

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
}

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
