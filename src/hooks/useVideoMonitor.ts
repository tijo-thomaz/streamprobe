import { useState, useEffect, useRef } from 'react';
import { VideoStats } from '../types';

interface VideoMonitorOptions {
    url: string;
    onStatsUpdate?: (stats: VideoStats) => void;
}

interface BufferRange {
    start: number;
    end: number;
}

export function useVideoMonitor({ url, onStatsUpdate }: VideoMonitorOptions) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isBuffering, setIsBuffering] = useState(false);
    const [stats, setStats] = useState<VideoStats>({
        width: 0,
        height: 0,
        currentTime: 0,
        bufferRanges: [],
        playbackRate: 1,
        duration: 0,
        paused: true,
        src: url,
        bitrate: 0
    });

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.src = url;

        const getBufferRanges = (): BufferRange[] => {
            const ranges: BufferRange[] = [];
            const buffered = video.buffered;
            
            for (let i = 0; i < buffered.length; i++) {
                ranges.push({
                    start: buffered.start(i),
                    end: buffered.end(i)
                });
            }
            return ranges;
        };

        const updateStats = () => {
            const newStats: VideoStats = {
                width: video.videoWidth,
                height: video.videoHeight,
                currentTime: video.currentTime,
                bufferRanges: getBufferRanges(),
                playbackRate: video.playbackRate,
                duration: video.duration || 0,
                paused: video.paused,
                src: video.src,
                bitrate: 0 // This will be updated by the content script for YouTube videos
            };
            setStats(newStats);
            onStatsUpdate?.(newStats);
        };

        const handleWaiting = () => {
            setIsBuffering(true);
            updateStats();
        };

        const handlePlaying = () => {
            setIsBuffering(false);
            updateStats();
        };

        const handleProgress = () => {
            updateStats();
        };

        // Calculate buffer ahead time
        const getBufferAheadTime = () => {
            const ranges = getBufferRanges();
            if (ranges.length === 0) return 0;
            
            // Find the appropriate buffer range
            for (const range of ranges) {
                if (range.start <= video.currentTime && video.currentTime <= range.end) {
                    return range.end - video.currentTime;
                }
            }
            return 0;
        };

        // Monitor buffering every second
        const bufferInterval = setInterval(() => {
            const bufferAhead = getBufferAheadTime();
            if (bufferAhead < 0.5) { // Less than 500ms of buffer ahead
                setIsBuffering(true);
            } else {
                setIsBuffering(false);
            }
            updateStats();
        }, 1000);

        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('progress', handleProgress);
        video.addEventListener('timeupdate', updateStats);
        video.addEventListener('loadedmetadata', updateStats);
        video.addEventListener('durationchange', updateStats);

        return () => {
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('progress', handleProgress);
            video.removeEventListener('timeupdate', updateStats);
            video.removeEventListener('loadedmetadata', updateStats);
            video.removeEventListener('durationchange', updateStats);
            clearInterval(bufferInterval);
            video.src = '';
        };
    }, [url, onStatsUpdate]);

    const getBufferingProgress = () => {
        const video = videoRef.current;
        if (!video || !stats.duration) return 0;

        // Find the furthest buffered point
        const maxBufferedEnd = Math.max(
            ...stats.bufferRanges.map(range => range.end),
            0
        );
        
        return (maxBufferedEnd / stats.duration) * 100;
    };

    return {
        videoRef,
        isBuffering,
        stats,
        bufferingProgress: getBufferingProgress()
    };
} 