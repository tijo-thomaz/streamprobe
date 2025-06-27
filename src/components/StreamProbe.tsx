import React, { useRef, useCallback, useState, useEffect } from "react";
import { useNetworkSimulation } from "../hooks/useNetworkSimulation";
import { useWaveAnimation } from "../hooks/useWaveAnimation";
import { StreamProbeProps, NetworkCondition, VideoStats } from "../types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Play, 
  StopCircle, 
  Download, 
  X, 
  Video, 
  Wifi, 
  Activity,
  Signal,
  Gauge
} from "lucide-react";

// Sample videos from free CDNs for testing
const SAMPLE_VIDEOS = [
  {
    id: "big_buck_bunny",
    name: "Big Buck Bunny (720p)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Animated short film, 720p quality"
  },
  {
    id: "elephants_dream", 
    name: "Elephants Dream (1080p)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Creative Commons film, 1080p quality"
  },
  {
    id: "for_bigger_blazes",
    name: "For Bigger Blazes (4K)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
    description: "High quality demo video, 4K"
  }
];

export const StreamProbe: React.FC<StreamProbeProps> = ({
  onClose,
  initialCondition = "3g",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(SAMPLE_VIDEOS[0]);
  const monitoringInterval = useRef<number | null>(null);

  const {
    condition,
    metrics,
    changeCondition,
  } = useNetworkSimulation({
    initialCondition,
    onMetricsUpdate: (metrics) => {
      console.log("Network metrics updated:", metrics);
    },
  });

  useWaveAnimation(canvasRef, {
    color: "#00E5FF",
    speed:
      videoStats?.bufferRanges.length === 0
        ? 0.05
        : condition === "3g"
        ? 0.01
        : condition === "4g"
        ? 0.02
        : 0.03,
  });

  // Monitor the embedded video directly
  const monitorEmbeddedVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isMonitoring) return;

    const buffered = video.buffered;
    const bufferRanges = [];

    for (let i = 0; i < buffered.length; i++) {
      bufferRanges.push({
        start: buffered.start(i),
        end: buffered.end(i),
      });
    }

    const currentBufferEnd = bufferRanges.length > 0 
      ? Math.max(...bufferRanges.map(range => range.end))
      : video.currentTime;
    const bufferAhead = currentBufferEnd - video.currentTime;
    
    const stats: VideoStats = {
      width: video.videoWidth,
      height: video.videoHeight,
      currentTime: video.currentTime,
      bufferRanges,
      playbackRate: video.playbackRate,
      duration: video.duration || 0,
      paused: video.paused,
      src: video.src,
      bitrate: calculateEstimatedBitrate(video.videoWidth),
      bufferAhead: bufferAhead,
      isBuffering: video.readyState < 3,
      readyState: video.readyState,
      networkState: video.networkState
    };

    setVideoStats(stats);
  }, [isMonitoring]);

  const calculateEstimatedBitrate = (width: number): number => {
    if (width >= 1920) return 8000000; // 1080p ~8Mbps
    if (width >= 1280) return 4000000; // 720p ~4Mbps
    if (width >= 854) return 2500000; // 480p ~2.5Mbps
    return 1000000; // Default ~1Mbps
  };

  useEffect(() => {
    if (isMonitoring && videoRef.current) {
      monitoringInterval.current = window.setInterval(monitorEmbeddedVideo, 500);
      return () => {
        if (monitoringInterval.current) {
          clearInterval(monitoringInterval.current);
          monitoringInterval.current = null;
        }
      };
    }
  }, [isMonitoring, monitorEmbeddedVideo]);

  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(!isMonitoring);
  }, [isMonitoring]);



  const handleVideoSelect = useCallback((videoId: string) => {
    const video = SAMPLE_VIDEOS.find(v => v.id === videoId);
    if (video) {
      setSelectedVideo(video);
      setIsMonitoring(false);
      setVideoStats(null);
    }
  }, []);



  const handleDownload = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      condition,
      videoStats: {
        resolution: videoStats
          ? `${videoStats.width}x${videoStats.height}`
          : "N/A",
        currentTime: videoStats?.currentTime || 0,
        playbackRate: videoStats?.playbackRate || 1,
        bufferRanges: videoStats?.bufferRanges || [],
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streamprobe-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, condition, videoStats]);

  const getBufferAnalysis = () => {
    if (!videoStats || !videoStats.bufferRanges.length) {
      return {
        bufferTime: "0s",
        health: "poor",
        status: "Buffering...",
        speed: "Slow",
        color: "#ff4444"
      };
    }
    
    const currentBufferEnd = Math.max(
      ...videoStats.bufferRanges.map((range) => range.end)
    );
    const bufferAhead = currentBufferEnd - videoStats.currentTime;
    
    // Determine buffer health based on buffer ahead time
    let health: "excellent" | "good" | "fair" | "poor";
    let status: string;
    let speed: string;
    let color: string;
    
    if (bufferAhead >= 10) {
      health = "excellent";
      status = "Excellent Buffer";
      speed = "Fast";
      color = "#00e676";
    } else if (bufferAhead >= 5) {
      health = "good";
      status = "Good Buffer";
      speed = "Good";
      color = "#4caf50";
    } else if (bufferAhead >= 2) {
      health = "fair";
      status = "Fair Buffer";
      speed = "Okay";
      color = "#ff9800";
    } else {
      health = "poor";
      status = "Low Buffer";
      speed = "Slow";
      color = "#f44336";
    }
    
    return {
      bufferTime: `${bufferAhead.toFixed(1)}s`,
      health,
      status,
      speed,
      color
    };
  };

  const getLatencyStatus = () => {
    // Extract numeric latency from metrics
    const latencyMs = parseInt(metrics.latency.replace(' ms', ''));
    
    if (latencyMs <= 50) {
      return { status: "Excellent", color: "#00e676", icon: "🚀" };
    } else if (latencyMs <= 100) {
      return { status: "Good", color: "#4caf50", icon: "✅" };
    } else if (latencyMs <= 200) {
      return { status: "Fair", color: "#ff9800", icon: "⚠️" };
    } else {
      return { status: "Poor", color: "#f44336", icon: "🐌" };
    }
  };

  const bufferAnalysis = getBufferAnalysis();
  const latencyStatus = getLatencyStatus();

  return (
    <div className="streamprobe-container">
      <div className="streamprobe-header">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-semibold">StreamProbe</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Selection */}
      <div className="mb-4">
        <select 
          value={selectedVideo.id} 
          onChange={(e) => handleVideoSelect(e.target.value)}
          className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {SAMPLE_VIDEOS.map(video => (
            <option key={video.id} value={video.id} className="bg-slate-800 text-white">
              📹 {video.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-400">
          {selectedVideo.description}
        </p>
      </div>

      {/* Embedded Video Player */}
      <div className="streamprobe-video-container">
        <video
          ref={videoRef}
          src={selectedVideo.url}
          controls
          className="streamprobe-video"
          onLoadedMetadata={() => {
            if (isMonitoring) {
              monitorEmbeddedVideo();
            }
          }}
        />
      </div>

      {/* Speed Indicator - Primary Feature */}
      <div className={`streamprobe-speed-indicator speed-${bufferAnalysis.speed.toLowerCase()}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gauge className="h-6 w-6" />
          <Badge variant={bufferAnalysis.speed.toLowerCase() as any} className="text-base px-4 py-2 font-bold">
            {bufferAnalysis.speed.toUpperCase()}
          </Badge>
        </div>
        <div className="text-sm opacity-90">
          {bufferAnalysis.status} • {bufferAnalysis.bufferTime} buffered
        </div>
      </div>

      {/* Latency & Network Info */}
      <div className="streamprobe-metrics-grid">
        <div className={`streamprobe-metric-card latency-${latencyStatus.status.toLowerCase()}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-lg">{latencyStatus.icon}</span>
          </div>
          <div className="text-xs mt-1">
            {latencyStatus.status}
          </div>
        </div>
        <div className="streamprobe-metric-card bg-slate-800 text-white border border-slate-700">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Wifi className="h-4 w-4" />
            <Signal className="h-4 w-4" />
          </div>
          <div className="text-xs mt-1">
            {condition.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Wave Animation */}
      <canvas
        ref={canvasRef}
        className={`streamprobe-wave-canvas transition-opacity duration-300 ${
          isMonitoring ? 'opacity-100' : 'opacity-30'
        }`}
      />

      {/* Progress Bar */}
      {videoStats && (
        <div className="streamprobe-progress">
          <div
            className="streamprobe-progress-bar"
            style={{
              width: `${(videoStats.currentTime / videoStats.duration) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Video Stats */}
      {videoStats && (
        <div className="streamprobe-stats-grid">
          <div className="streamprobe-stat-card">
            <div className="text-slate-400">Resolution</div>
            <div className="font-bold">
              {videoStats.width}×{videoStats.height}
            </div>
          </div>
          <div className="streamprobe-stat-card">
            <div className="text-slate-400">Bitrate</div>
            <div className="font-bold">
              {metrics.bitrate}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="streamprobe-controls">
        <Button
          onClick={toggleMonitoring}
          variant={isMonitoring ? "destructive" : "default"}
          className={`flex-1 ${
            isMonitoring 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {isMonitoring ? (
            <>
              <StopCircle className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start
            </>
          )}
          <span className="ml-1">Monitoring</span>
        </Button>
        
        <select
          value={condition}
          onChange={(e) => changeCondition(e.target.value as NetworkCondition)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg p-3 min-w-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="3g" className="bg-slate-800 text-white">📶 3G</option>
          <option value="4g" className="bg-slate-800 text-white">📶 4G</option>
          <option value="5g" className="bg-slate-800 text-white">📶 5G</option>
        </select>

        <Button
          onClick={handleDownload}
          variant="outline"
          size="icon"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
