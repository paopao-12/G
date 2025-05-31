const API_URL = 'http://localhost:3000/api';

export const fetchRoutes = async () => {
  try {
    const response = await fetch(`${API_URL}/routes`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
};

export const calculateFare = async (origin: string, destination: string) => {
  try {
    const response = await fetch(`${API_URL}/fares?origin=${origin}&destination=${destination}`);
    return await response.json();
  } catch (error) {
    console.error('Error calculating fare:', error);
    throw error;
  }
}; 