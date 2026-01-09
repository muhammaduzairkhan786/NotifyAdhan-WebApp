import { useMemo, useState, useEffect, useRef } from 'react'
import { usePrayerTimes } from './hooks/usePrayerTimes'
import AudioPlayer from './components/AudioPlayer'
import { PRAYER_DATA } from './data/virtues'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBell, FaBellSlash, FaCog, FaTimes, FaMoon, FaSun, FaPlay, FaStop, FaBookOpen, FaStar } from 'react-icons/fa'
import './index.css'

function App() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sheffieldPrayerSettings');
    const defaultSettings = {
      notifications: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
      school: 1,
      method: 3, // Default to Muslim World League
      audioSources: { Fajr: 'makkah', Dhuhr: 'makkah', Asr: 'makkah', Maghrib: 'makkah', Isha: 'makkah' }
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge for backward compatibility
      return { ...defaultSettings, ...parsed, audioSources: { ...defaultSettings.audioSources, ...parsed.audioSources } };
    }
    return defaultSettings;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [hoveredPrayer, setHoveredPrayer] = useState(null);
  // Audio preview state
  const [previewAudio, setPreviewAudio] = useState(null);

  useEffect(() => {
    localStorage.setItem('sheffieldPrayerSettings', JSON.stringify(settings));
  }, [settings]);

  const { times, date, nextPrayer, timeRemaining, loading, error } = usePrayerTimes('Sheffield', 'UK', settings.school, settings.method);

  // Prayer Info Logic
  const activeInfo = useMemo(() => {
    if (!hoveredPrayer) return null;
    const data = PRAYER_DATA[hoveredPrayer.name];
    if (!data) return null;

    return {
      virtue: data.virtues[Math.floor(Math.random() * data.virtues.length)],
      recommendation: data.recommendations[Math.floor(Math.random() * data.recommendations.length)]
    };
  }, [hoveredPrayer]);

  const getPrayerTimes = (prayerName) => {
    if (!times) return { start: '', end: '', endLabel: '' };

    let start = times[prayerName];
    let end = '';
    let endLabel = 'Ends';

    if (prayerName === 'Fajr') end = times['Sunrise'];
    else if (prayerName === 'Dhuhr') end = times['Asr'];
    else if (prayerName === 'Asr') end = times['Maghrib'];
    else if (prayerName === 'Maghrib') end = times['Isha'];
    else if (prayerName === 'Isha') {
      end = times['Fajr'];
      endLabel = 'Ends (Fajr)';
    }

    return { start, end, endLabel };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${suffix}`;
  };

  const formatDateUK = (dateObj) => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const toggleNotification = (prayer) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [prayer]: !prev.notifications[prayer]
      }
    }));
  };

  const toggleSchool = () => {
    setSettings(prev => ({
      ...prev,
      school: prev.school === 1 ? 0 : 1
    }));
  };

  const toggleMethod = () => {
    // Toggle between MWL (3), ISNA (2), and Makkah (4)
    setSettings(prev => {
      const next = prev.method === 3 ? 2 : (prev.method === 2 ? 4 : 3);
      return { ...prev, method: next };
    });
  };


  const closeTimeoutRef = useState(null)[1]; // Just a ref actually, standard useRef is better but this is inside component body
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowSettings(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setShowSettings(false);
      // Also stop preview if closing? Maybe yes to be safe
      if (previewAudio) {
        previewAudio.audio.pause();
        setPreviewAudio(null);
      }
    }, 300); // 300ms grace period
  };

  const playPreview = (source, prayerName) => {
    // If clicking the SAME prayer's preview that is currently playing, STOP it.
    if (previewAudio && previewAudio.prayerName === prayerName) {
      previewAudio.audio.pause();
      setPreviewAudio(null);
      return;
    }

    // Stop previous if exists
    if (previewAudio) {
      previewAudio.audio.pause();
    }

    // jsDelivr CDN URLs (Faster low-latency loading compared to raw.github)
    // Sheikh Ali Mulla (Makkah)
    const makkahUrl = 'https://cdn.jsdelivr.net/gh/achaudhry/adhan@master/Adhan-Makkah.mp3';
    // Sheikh Essam Bukhari / Madina
    const madinaUrl = 'https://cdn.jsdelivr.net/gh/achaudhry/adhan@master/Adhan-Madinah.mp3';
    // Sheikh Mishary Rashid Alafasy
    const misharyUrl = 'https://cdn.jsdelivr.net/gh/achaudhry/adhan@master/Adhan-Mishary-Rashid-Al-Afasy.mp3';

    let url = makkahUrl;
    if (source === 'madina') url = madinaUrl;
    if (source === 'mishary') url = misharyUrl;

    const audio = new Audio(url);
    audio.play().catch(e => console.log('Preview blocked', e));
    setPreviewAudio({ audio, prayerName }); // Store prayerName to identify the specific row
    audio.onended = () => setPreviewAudio(null);
  };

  const prayerList = useMemo(() => {
    if (!times) return [];
    const keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    return keys.map(key => ({
      name: key,
      time: times[key],
      isNext: nextPrayer?.name === key
    }));
  }, [times, nextPrayer]);

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="mesh-gradient"></div>

      {/* Settings Container to manage hover state for both button and menu */}
      <div
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.button
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)} // Toggle on click
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '12px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          <FaCog color="var(--text-primary)" size={20} />
        </motion.button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 10, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass"
              style={{
                marginTop: '10px',
                padding: '25px',
                width: '340px',
                maxWidth: '90vw', // Responsive width
                background: 'rgba(20, 20, 25, 0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, background: 'linear-gradient(to right, #fff, #bbb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</h3>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                  v1.2
                </div>
              </div>

              {/* Calculation Section */}
              <div style={{ marginBottom: '30px' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '15px', fontWeight: 600 }}>Calculation</p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <button
                    onClick={toggleSchool}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Asr Method</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#60A5FA', background: 'rgba(96, 165, 250, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                      {settings.school === 1 ? 'Hanafi' : 'Standard'}
                    </span>
                  </button>

                  <button
                    onClick={toggleMethod}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Authority</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#A78BFA', background: 'rgba(167, 139, 250, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                      {settings.method === 3 ? 'MWL' : (settings.method === 2 ? 'ISNA' : 'Makkah')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Voice Selection */}
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '15px', fontWeight: 600 }}>Muazzin Voice</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(prayer => (
                    <div key={prayer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'transparent' }}>
                      <span style={{ fontWeight: 600, width: '60px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{prayer}</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <select
                            value={settings.audioSources[prayer]}
                            onChange={(e) => {
                              setSettings(prev => ({
                                ...prev,
                                audioSources: { ...prev.audioSources, [prayer]: e.target.value }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              fontSize: '0.85rem',
                              background: '#2A2A35',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              cursor: 'pointer',
                              outline: 'none',
                              appearance: 'none',
                              fontWeight: 500
                            }}
                          >
                            <option value="makkah">Makkah (Ali Mulla)</option>
                            <option value="madina">Madina (E. Bukhari)</option>
                            <option value="mishary">Mishary Alafasy</option>
                          </select>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => playPreview(settings.audioSources[prayer], prayer)}
                          title={previewAudio?.prayerName === prayer ? "Stop" : "Preview"}
                          style={{
                            padding: '10px',
                            borderRadius: '50%',
                            background: previewAudio?.prayerName === prayer ? '#EF4444' : '#10B981',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          {previewAudio?.prayerName === prayer ? <FaStop size={10} /> : <FaPlay size={10} style={{ marginLeft: '2px' }} />}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: 'center', marginBottom: '30px', marginTop: '40px' }}
      >
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'serif' }}>
            {formatDateUK()}
          </p>
          <div style={{ padding: '6px 14px', marginTop: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', backdropFilter: 'blur(5px)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Sheffield, UK
            </span>
          </div>
          {date && (
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)', marginTop: '8px', fontWeight: 500 }}>
              {date.hijri?.day} {date.hijri?.month?.en} {date.hijri?.year}
            </span>
          )}
        </div>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: '#FF3B30' }}>{error}</p>}

        <AnimatePresence mode='wait'>
          {!loading && !error && nextPrayer && (
            <motion.div
              key={nextPrayer.name}
              className="glass glass-active"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              style={{ padding: '30px 20px', margin: '20px auto', maxWidth: '400px', borderRadius: '30px', position: 'relative', overflow: 'hidden' }}
            >
              <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1px', position: 'relative', zIndex: 1 }}>Next Prayer</p>
              <h2 style={{ fontSize: '3.5rem', margin: '5px 0', background: 'linear-gradient(45deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative', zIndex: 1 }}>
                {nextPrayer.name}
              </h2>
              <div style={{ fontSize: '1.8rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--accent-color)', position: 'relative', zIndex: 1 }}>
                {timeRemaining || '...'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main style={{ display: 'grid', gap: '12px', maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
        {prayerList.map((p, index) => (
          <motion.div
            key={p.name}
            className={`glass ${p.isNext ? 'glass-active' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredPrayer(p)}
            onMouseLeave={() => setHoveredPrayer(null)}
            onClick={() => setHoveredPrayer(p)} // Touch support: tap to open
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleNotification(p.name); }}
                className="secondary"
                style={{ padding: '8px', minWidth: 'auto', borderRadius: '50%', border: 'none', background: settings.notifications[p.name] ? 'rgba(0,122,255,0.1)' : 'transparent' }}
              >
                {settings.notifications[p.name] ? <FaBell size={14} color="var(--accent-color)" /> : <FaBellSlash size={14} color="var(--text-secondary)" />}
              </button>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{p.name}</span>
            </div>
            <span style={{ fontSize: '1.1rem', color: p.isNext ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
              {formatTime(p.time)}
            </span>
          </motion.div>
        ))}

        <AudioPlayer nextPrayer={nextPrayer} notifications={settings.notifications} audioSources={settings.audioSources} />
      </main>

      {/* Slide Panel */}
      <AnimatePresence mode='wait'>
        {hoveredPrayer && (
          <motion.div
            key="side-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '320px',
              maxWidth: '85vw', // Responsive
              height: '100vh',
              background: 'var(--card-bg)',
              backdropFilter: 'blur(30px)',
              zIndex: 200,
              boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Close Button for touch users */}
            <button
              onClick={() => setHoveredPrayer(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                padding: '10px',
                borderRadius: '50%',
                color: 'var(--text-secondary)'
              }}
            >
              <FaTimes size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: '3rem', color: 'var(--accent-color)', marginBottom: '15px' }}
              >
                {['Fajr', 'Maghrib', 'Isha'].includes(hoveredPrayer.name) ? <FaMoon /> : <FaSun />}
              </motion.div>

              <h2 style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '5px' }}>{hoveredPrayer.name}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Prayer Details</p>
            </div>

            <div style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Begins</span>
                <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{formatTime(getPrayerTimes(hoveredPrayer.name).start)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{getPrayerTimes(hoveredPrayer.name).endLabel}</span>
                <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{formatTime(getPrayerTimes(hoveredPrayer.name).end)}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }} className="side-panel-content">
              {activeInfo?.virtue && (
                <div style={{ position: 'relative', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-color)' }}>
                    <FaStar size={14} />
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Virtue</span>
                  </div>
                  <p style={{ fontStyle: 'italic', marginBottom: '10px', lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '15px' }}>
                    {activeInfo.virtue.text}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 600 }}>
                    — {activeInfo.virtue.source}
                  </p>
                </div>
              )}

              {activeInfo?.recommendation && (
                <div style={{ position: 'relative', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#10B981' }}>
                    <FaBookOpen size={14} />
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Recommended</span>
                  </div>

                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{activeInfo.recommendation.title}</h4>

                  {activeInfo.recommendation.arabic && (
                    <p dir="rtl" style={{ fontSize: '1.5rem', marginBottom: '15px', color: 'var(--text-primary)', fontFamily: 'serif', textAlign: 'center', lineHeight: '2' }}>
                      {activeInfo.recommendation.arabic}
                    </p>
                  )}

                  <p style={{ marginBottom: '10px', lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {activeInfo.recommendation.text}
                  </p>

                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right', fontWeight: 600 }}>
                    — {activeInfo.recommendation.source}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ textAlign: 'center', marginTop: '60px', opacity: 0.6, fontSize: '0.8rem' }}>
        <p> 2026 Sheffield Prayer Times</p>
      </footer>
    </div>
  )
}

export default App
