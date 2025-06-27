export type NetworkCondition = '3g' | '4g' | '5g';

export interface NetworkMetrics {
    latency: string;
    bitrate: string;
    bufferTime: string;
}

export interface StreamMetrics {
    buffering: string;
    latency: string;
    bitrate: string;
    hasLag: boolean;
    progress: number;
}

export interface BufferRange {
    start: number;
    end: number;
}

export interface VideoStats {
    width: number;
    height: number;
    currentTime: number;
    bufferRanges: BufferRange[];
    playbackRate: number;
    duration: number;
    paused: boolean;
    src: string;
    bitrate: number;
    // Enhanced buffer health metrics
    bufferAhead?: number;
    isBuffering?: boolean;
    readyState?: number;
    networkState?: number;
}

export interface StreamProbeProps {
    onClose: () => void;
    initialCondition?: NetworkCondition;
} 