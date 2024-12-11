import axios from 'axios';

// Define the function to fetch YouTube data
export async function fetchYouTubeData(videoId: string): Promise<any> {
    // Base URL of the API
    const baseURL = 'http://5.223.49.42:8080/fetch/youtube';

    try {
        // Make the GET request with the video ID as a query parameter
        const response = await axios.get(`${baseURL}`, {
            params: {
                id: videoId,
            },
        });

        // Return the data from the response
        return response.data;
    } catch (error) {
        // Handle errors by logging and re-throwing them
        console.error('Error fetching YouTube data:', error);
        throw error;
    }
}