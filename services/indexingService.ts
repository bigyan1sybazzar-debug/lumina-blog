// services/indexingService.ts

const INDEX_NOW_URL = 'https://api.indexnow.org/indexnow';
const API_KEY = '697e5283984a4b3f85621c84e6be1cab'; // Must match the .txt file in /public
const HOST = 'https://bigyann.com.np/'; // Replace with your actual domain

export const notifyIndexNow = async (urls: string[]) => {
  if (!urls.length) return;

  try {
    const response = await fetch(INDEX_NOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: HOST,
        key: API_KEY,
        keyLocation: `https://${HOST}/${API_KEY}.txt`,
        urlList: urls,
      }),
    });

    if (response.ok) {
      console.log('IndexNow notification successful for:', urls);
    } else {
      console.error('IndexNow error status:', response.status);
    }
  } catch (error) {
    console.error('Failed to notify IndexNow:', error);
  }
};