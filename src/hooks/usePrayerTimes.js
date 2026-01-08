import { useState, useEffect } from 'react';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function usePrayerTimes(city = 'Sheffield', country = 'UK', school = 1, method = 3) { // school 1 = Hanafi, method 3 = MWL
  const [data, setData] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Prayer Times
  useEffect(() => {
    const fetchTimes = async () => {
      try {
        setLoading(true);
        const date = new Date();
        const response = await fetch(
          `https://api.aladhan.com/v1/timingsByCity/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?city=${city}&country=${country}&method=${method}&school=${school}`
        );
        const json = await response.json();

        if (json.code === 200) {
          setData(json.data);
        } else {
          setError('Failed to fetch prayer times');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchTimes();
  }, [city, country, school, method]);

  // key is prayer name, value is "HH:mm" string
  const getNextPrayer = (timings) => {
    if (!timings) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let upcoming = null;
    let minDiff = Infinity;

    for (const name of PRAYER_NAMES) {
      const timeStr = timings[name];
      const [hours, minutes] = timeStr.split(':').map(Number);
      const prayerTimeMinutes = hours * 60 + minutes;

      let diff = prayerTimeMinutes - currentTime;

      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        upcoming = { name, time: timeStr, diff };
      }
    }

    // If no upcoming prayer found today, assume Fajr tomorrow
    if (!upcoming && timings['Fajr']) {
      const [fHours, fMinutes] = timings['Fajr'].split(':').map(Number);
      const fMinutesTotal = fHours * 60 + fMinutes;
      const diff = (24 * 60 - currentTime) + fMinutesTotal;
      upcoming = { name: 'Fajr', time: timings['Fajr'], diff, isTomorrow: true };
    }

    return upcoming;
  };

  // Update Countdown
  useEffect(() => {
    if (!data?.timings) return;

    const interval = setInterval(() => {
      const next = getNextPrayer(data.timings);
      setNextPrayer(next);

      if (next) {
        const hours = Math.floor(next.diff / 60);
        const minutes = next.diff % 60;
        const seconds = 59 - new Date().getSeconds();
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  return {
    times: data?.timings,
    date: data?.date, // Return full date object (contains hijri)
    nextPrayer,
    timeRemaining,
    loading,
    error
  };
}
