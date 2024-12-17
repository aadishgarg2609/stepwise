import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


const Stack = createNativeStackNavigator();
const router = useRouter();

const HomeScreen = ({ }) => {
  useEffect(() => {
    // Set a timeout to display the alert after 3 seconds
    const timer = setTimeout(() => {
      Speech.speak("We have detected that you have exited the metro ");
      Alert.alert(
        "We have detected that you ahave exited the metro",
        "Is this true?",
        
        [
          { text: "Yes", onPress: () => router.push('./navigation'), },
          { text: "No", onPress: () => console.log("User denied presence near Shastri Park") },
        ]
      );
    }, 3000);
    Speech.speak("Starting your navigation to Krishnanagar Metro Station Exit");

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, []);

  const destinations = [
    { id: 1, name: 'NOIDA', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnYBIEy6BdDiCn-nNxnZP1lk12nKF4U89tdw&s' },
    { id: 2, name: 'DELHI', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxTOMJj02UDRT8YIaUFVCjCZxFMjcHK7ym5Q&s' },
    { id: 3, name: 'GURGAON', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHi9NGOq05C98jNdeNlSO8l3dDSpASViJp_w&s' },
  ];

  const popularPlaces = [
    { id: 1, name: 'SECTOR 137 STATION', image: 'https://content.jdmagicbox.com/v2/comp/delhi/u7/011pxx11.xx11.220127183432.u8u7/catalogue/noida-sector-137-metro-station-noida-metro-railway-station-fpcvptob7k.jpg' },
    { id: 2, name: 'SHASTRI PARK', image: 'https://housing.com/news/wp-content/uploads/2023/05/Shastri-Park-Metro-Station-Delhi-Route-timings-01.png' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="gray" />
          <Text style={styles.searchText}>Search destinations...</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="mic" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Main Heading */}
        <Text style={styles.heading}>WHERE SHOULD WE TAKE YOU?</Text>

        {/* Destinations Grid */}
        <View style={styles.destinationsGrid}>
          {destinations.map((destination) => (
            <TouchableOpacity key={destination.id} style={styles.destinationItem}>
              <Image
                source={{ uri: destination.image }}
                style={styles.destinationImage}
              />
              <Text style={styles.destinationText}>{destination.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Section */}
        <Text style={styles.subheading}>MOST POPULAR</Text>
        <View style={styles.popularGrid}>
          {popularPlaces.map((place) => (
            <TouchableOpacity key={place.id} style={styles.popularItem}>
              <Image
                source={{ uri: place.image }}
                style={styles.popularImage}
              />
              <Text style={styles.popularText}>{place.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="globe-outline" size={24} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="create-outline" size={24} color="gray" />
          <Text style={styles.navText}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="gray" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchText: {
    marginLeft: 8,
    color: 'gray',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  destinationsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  destinationItem: {
    width: '30%',
    alignItems: 'center',
  },
  destinationImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subheading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  popularGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  popularItem: {
    width: '48%',
  },
  popularImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  popularText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: 'gray',
  },
});

// App component with navigation container
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default HomeScreen;