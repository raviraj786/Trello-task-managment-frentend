// utils/localTaskSync.js
export const saveTasksToLocal = (projectId, tasks) => {
  try {
    const key = `tasks_${projectId}`;
    localStorage.setItem(key, JSON.stringify(tasks));
    console.log('Saved to local storage:', tasks);
    return true;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    return false;
  }
};

export const loadTasksFromLocal = (projectId) => {
  try {
    const key = `tasks_${projectId}`;
    const data = localStorage.getItem(key);
    const parsedData = data ? JSON.parse(data) : null;
    console.log('Loaded from local storage:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return null;
  }
};

export const clearTasksFromLocal = (projectId) => {
  try {
    const key = `tasks_${projectId}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing local storage:', error);
    return false;
  }
};