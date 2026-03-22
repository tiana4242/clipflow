import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.getCurrentUrl();

export async function generateTitleSuggestions(topic: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/generate-titles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate titles')
    }

    const data = await response.json()
    return data.titles || []
  } catch (error) {
    console.error('Error generating titles:', error)
    // Return fallback titles if API fails
    return [
      `Amazing ${topic} Content You Need to See`,
      `This ${topic} Hack Will Blow Your Mind`,
      `${topic} Tips That Actually Work`,
      `Why ${topic} Is Taking Over`,
      `The Ultimate ${topic} Guide`,
    ]
  }
}