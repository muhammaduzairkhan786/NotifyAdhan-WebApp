import { useRef, useEffect, useState } from 'react';
import { FaPlay, FaStop, FaVolumeUp, FaVolumeMute, FaMusic } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function AudioPlayer({ nextPrayer, notifications, audioSources, onUnmuteRequest }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    // 'enabled' state is now primarily for the "Global Master Switch" handled by parent or local privacy check?
    // Finally, let's keep local 'enabled' for the browser autoplay policy interaction, 
    // but use 'notifications' prop to decide if we SHOULD play for this specific prayer.
    const [enabled, setEnabled] = useState(false);

    const lastPlayedRef = useRef(null);
    const [currentSrc, setCurrentSrc] = useState('/makkah.mp3');

    // GitHub Raw URLs (Stable & Hotlinkable) -> Served via jsDelivr for performance
    const MAKKAH_URL = 'https://cdn.jsdelivr.net/gh/achaudhry/adhan@master/Adhan-Makkah.mp3';
    const MADINA_URL = 'https://cdn.jsdelivr.net/gh/achaudhry/adhan@master/Adhan-Madinah.mp3';
    const MISHARY_URL = 'https://cdn.jsdelivr.net/gh/achaudhry/adhan@master/Adhan-Mishary-Rashid-Al-Afasy.mp3';

    // Update audio source when next upcoming prayer changes or settings change
    useEffect(() => {
        if (nextPrayer && audioSources) {
            const preferredSource = audioSources[nextPrayer.name];
            if (preferredSource === 'madina') setCurrentSrc(MADINA_URL);
            else if (preferredSource === 'mishary') setCurrentSrc(MISHARY_URL);
            else setCurrentSrc(MAKKAH_URL);
        }
    }, [nextPrayer, audioSources]);

    useEffect(() => {
        // Check strict equality to 0 diff (prayer start)
        if (enabled && nextPrayer && nextPrayer.diff === 0) {
            // Check if notification is enabled for this specific prayer AND we haven't played it yet
            if (notifications && notifications[nextPrayer.name] && lastPlayedRef.current !== nextPrayer.name) {
                playAudio();
                lastPlayedRef.current = nextPrayer.name;
            }
        }

        // Reset if prayer changes (e.g. next day or we moved past the minute)
        if (nextPrayer && lastPlayedRef.current !== nextPrayer.name && nextPrayer.diff !== 0) {
            // Optional: reset logic if needed, but simple check above protects us.
            // We don't strictly need to nullify it immediately, but it's safe.
        }
    }, [nextPrayer, enabled, notifications]);

    const playAudio = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            // Ensure we are playing the correct src just in case
            if (nextPrayer && audioSources) {
                const preferredSource = audioSources[nextPrayer.name];
                let targetUrl = MAKKAH_URL;
                if (preferredSource === 'madina') targetUrl = MADINA_URL;
                if (preferredSource === 'mishary') targetUrl = MISHARY_URL;

                if (audioRef.current.src !== targetUrl) {
                    audioRef.current.src = targetUrl;
                }
            } audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay blocked", e));
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const toggleEnable = () => {
        const newState = !enabled;
        setEnabled(newState);
        if (newState) {
            // Play silent audio to unlock AudioContext
            const a = new Audio();
            a.play().catch(() => { });
            if (onUnmuteRequest) onUnmuteRequest();
        }
    };

    return (
        <motion.div
            className="glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ padding: '20px', marginTop: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
        >
            <audio ref={audioRef} src={currentSrc} preload="none" onEnded={() => setIsPlaying(false)} />

            {isPlaying && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, opacity: 0.1, background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}></div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
                <button
                    onClick={toggleEnable}
                    className="secondary"
                    style={{
                        borderColor: enabled ? 'var(--text-secondary)' : 'var(--accent-color)',
                        color: enabled ? 'var(--text-secondary)' : 'var(--accent-color)',
                        backgroundColor: 'transparent'
                    }}
                >
                    {enabled ? <FaVolumeUp /> : <FaVolumeMute />}
                    {enabled ? 'Auto-Adhan Active' : 'Enable Adhan System'}
                </button>

                <AnimatePresence mode='wait'>
                    {!isPlaying ? (
                        <motion.button
                            key="play"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={playAudio}
                            style={{ padding: '12px', borderRadius: '50%', minWidth: 'auto' }}
                            title="Test Adhan Voice"
                        >
                            <FaPlay style={{ marginLeft: '4px' }} />
                        </motion.button>
                    ) : (
                        <motion.button
                            key="stop"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={stopAudio}
                            style={{ backgroundColor: '#FF3B30', padding: '12px', borderRadius: '50%', minWidth: 'auto' }}
                            title="Stop Audio"
                        >
                            <FaStop />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {enabled && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: '0.8rem', marginTop: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <FaMusic size={10} />
                    {isPlaying
                        ? 'Playing Adhan...'
                        : (nextPrayer ? `Next: Adhan (${audioSources?.[nextPrayer.name] === 'madina' ? 'Madina' : 'Makkah'})` : 'Standing by...')
                    }
                </motion.p>
            )}
        </motion.div>
    );
}
