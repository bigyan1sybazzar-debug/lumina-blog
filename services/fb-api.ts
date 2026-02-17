// src/api/football.ts
const TOKEN = 'TFScYsACFnJEB1NTzOtzneONrDqb8UOos6AwbqCXsD5AWEFTsHOnO5MLy5xQ'; // Your token
const BASE_URL = '/api/football'; // Proxied URL (no CORS)

export const footballApi = {
  // Live matches (in-play)
  liveMatches: async () => {
    const res = await fetch(`${BASE_URL}/livescores/inplay?api_token=${TOKEN}&include=participants;scores;periods;events;league.country;round`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return res.json();
  },

  // Upcoming matches (next 7 days)
  upcomingMatches: async () => {
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const endDate = in7Days.toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/fixtures?api_token=${TOKEN}&filter[starts_between]=${today},${endDate}&include=participants;league.country;round`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return res.json();
  },

  // Recent matches (last 7 days)
  recentMatches: async () => {
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() - 7);
    const startDate = in7Days.toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/fixtures?api_token=${TOKEN}&filter[starts_between]=${startDate},${today}&include=participants;league.country;round`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return res.json();
  },
};