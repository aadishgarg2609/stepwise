import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// Define a task name
const BACKGROUND_FETCH_TASK = "background-fetch-task";

// Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Perform your background job logic here
    console.log("Background fetch executed!");

    // Return a successful result
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error(error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task
export const registerBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 1, // Minimum interval in seconds
    });
    console.log("Background fetch registered!");
  } catch (error) {
    console.error("Error registering background fetch:", error);
  }
};

// Unregister the task
const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("Background fetch unregistered!");
  } catch (error) {
    console.error("Error unregistering background fetch:", error);
  }
};

