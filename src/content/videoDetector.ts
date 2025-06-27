// Content script to detect and monitor video elements on the page
let activeVideo: HTMLVideoElement | null = null;
let port: chrome.runtime.Port | null = null;
let cleanup: (() => void) | null = null;
let monitoringInterval: number | null = null;
let isMonitoring = false;
let youtubePlayer: any = null; // YouTube player API reference

// Connect to the extension
function connectToExtension() {
  console.log("Connecting to extension...");
  port = chrome.runtime.connect({ name: "videoMonitor" });

  // Listen for commands from the extension popup
  port.onMessage.addListener((message) => {
    console.log("Content script received message:", message);

    if (message.type === "startMonitoring" && !isMonitoring) {
      console.log("Starting video monitoring by user request");
      isMonitoring = true;
      startMonitoring();
    } else if (message.type === "stopMonitoring" && isMonitoring) {
      console.log("Stopping video monitoring by user request");
      isMonitoring = false;
      stopMonitoring();
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("Disconnected from extension");
    port = null;
    stopMonitoring();
  });
}

function stopMonitoring() {
  isMonitoring = false;
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  activeVideo = null;
}

// Find video elements on the page (including YouTube)
function findVideoElements(): HTMLVideoElement[] {
  console.log("Searching for video elements...");
  
  // Standard HTML5 video elements
  let videos = Array.from(document.querySelectorAll("video"));
  
  // Platform-specific video detection
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    console.log("Detected YouTube - looking for YouTube video elements");
    
    // YouTube uses specific selectors for their video player
    const youtubeSelectors = [
      'video.video-stream',           // Main YouTube video element
      '.html5-video-player video',    // YouTube HTML5 player
      '#movie_player video',          // YouTube movie player
      '.ytp-html5-video',            // YouTube player video
      'video.html5-main-video',       // Another YouTube selector
      '#player video',                // Generic player video
    ];
    
    for (const selector of youtubeSelectors) {
      const youtubeVideos = Array.from(document.querySelectorAll(selector)) as HTMLVideoElement[];
      if (youtubeVideos.length > 0) {
        console.log(`Found ${youtubeVideos.length} YouTube videos with selector: ${selector}`);
        videos = videos.concat(youtubeVideos);
      }
    }
    
    // Try to access YouTube's player API if available
    try {
      const moviePlayer = document.getElementById('movie_player');
      if (moviePlayer && (moviePlayer as any).getPlayerState) {
        console.log('Found YouTube player API');
        youtubePlayer = moviePlayer;
      }
    } catch (e) {
      console.log('YouTube API not available:', e);
    }
  } else if (hostname.includes('vimeo.com')) {
    console.log("Detected Vimeo - looking for Vimeo video elements");
    const vimeoVideos = Array.from(document.querySelectorAll('video, .vp-video video, .player video')) as HTMLVideoElement[];
    if (vimeoVideos.length > 0) {
      videos = videos.concat(vimeoVideos);
    }
  } else if (hostname.includes('twitch.tv')) {
    console.log("Detected Twitch - looking for Twitch video elements");
    const twitchVideos = Array.from(document.querySelectorAll('video, .video-player video, .player-video video')) as HTMLVideoElement[];
    if (twitchVideos.length > 0) {
      videos = videos.concat(twitchVideos);
    }
  } else if (hostname.includes('netflix.com')) {
    console.log("Detected Netflix - looking for Netflix video elements");
    const netflixVideos = Array.from(document.querySelectorAll('video, .VideoContainer video, .NFPlayer video')) as HTMLVideoElement[];
    if (netflixVideos.length > 0) {
      videos = videos.concat(netflixVideos);
    }
  }
  
  // Remove duplicates
  const uniqueVideos = videos.filter((video, index, self) => 
    self.indexOf(video) === index && video.videoWidth > 0
  );
  
  console.log(`Found ${uniqueVideos.length} unique video elements`);
  return uniqueVideos;
}

// Monitor regular HTML5 video
function monitorVideo(video: HTMLVideoElement) {
  console.log("Starting to monitor video:", video);
  if (!port) {
    connectToExtension();
  }

  const sendUpdate = () => {
    if (!port || !isMonitoring) return;

    const buffered = video.buffered;
    const bufferRanges = [];

    for (let i = 0; i < buffered.length; i++) {
      bufferRanges.push({
        start: buffered.start(i),
        end: buffered.end(i),
      });
    }

    // Calculate estimated bitrate based on video width only
    const estimatedBitrate = calculateEstimatedBitrate(video.videoWidth);

    // Enhanced buffer analysis
    const currentBufferEnd = bufferRanges.length > 0 
      ? Math.max(...bufferRanges.map(range => range.end))
      : video.currentTime;
    const bufferAhead = currentBufferEnd - video.currentTime;
    const isBuffering = video.readyState < 3; // HAVE_FUTURE_DATA or less
    
    const stats = {
      width: video.videoWidth,
      height: video.videoHeight,
      currentTime: video.currentTime,
      bufferRanges,
      playbackRate: video.playbackRate,
      duration: video.duration || 0,
      paused: video.paused,
      src: video.src || "embedded-video",
      bitrate: estimatedBitrate,
      // Additional buffer health metrics
      bufferAhead: bufferAhead,
      isBuffering: isBuffering,
      readyState: video.readyState,
      networkState: video.networkState
    };

    console.log("Sending enhanced video stats:", stats);
    port.postMessage({
      type: "videoStats",
      stats,
    });
  };

  // Send initial stats
  if (video.readyState >= 1) {
    sendUpdate();
  }

  // Monitor video events
  const events = [
    "loadedmetadata",
    "timeupdate",
    "progress",
    "waiting",
    "playing",
    "pause",
    "ended",
  ];

  const eventHandlers = events.map((event) => {
    const handler = () => sendUpdate();
    video.addEventListener(event, handler);
    return { event, handler };
  });

  // Set up more frequent updates for better buffer monitoring
  monitoringInterval = window.setInterval(sendUpdate, 500); // Update every 500ms for real-time buffer tracking

  // Cleanup function
  cleanup = () => {
    eventHandlers.forEach(({ event, handler }) => {
      video.removeEventListener(event, handler);
    });
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  };
}

// Calculate estimated bitrate based on video dimensions
function calculateEstimatedBitrate(width: number): number {
  // Simple estimation based on resolution
  if (width >= 1920) return 8000000; // 1080p ~8Mbps
  if (width >= 1280) return 4000000; // 720p ~4Mbps
  if (width >= 854) return 2500000; // 480p ~2.5Mbps
  return 1000000; // Default ~1Mbps
}

// Start monitoring process
function startMonitoring() {
  if (!isMonitoring) return;

  // Special handling for major video platforms
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    console.log('YouTube detected - using enhanced detection strategy');
    startYouTubeMonitoring();
    return;
  }

  // Standard video monitoring for other sites
  const videos = findVideoElements();

  if (videos.length > 0) {
    activeVideo = videos[0]; // Monitor the first video found
    monitorVideo(activeVideo);
  } else {
    console.log("No videos found to monitor");
  }

  // Set up a MutationObserver to detect dynamically added videos
  const observer = new MutationObserver((mutations) => {
    if (activeVideo || !isMonitoring) return; // Already monitoring a video or stopped

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const videos = findVideoElements();
        if (videos.length > 0) {
          activeVideo = videos[0];
          monitorVideo(activeVideo);
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Add to cleanup
  const originalCleanup = cleanup;
  cleanup = () => {
    originalCleanup?.();
    observer.disconnect();
  };
}

// Enhanced monitoring for YouTube
function startYouTubeMonitoring() {
  let attempts = 0;
  const maxAttempts = 20; // Try for up to 10 seconds
  
  const findAndMonitorYouTubeVideo = () => {
    attempts++;
    console.log(`YouTube detection attempt ${attempts}/${maxAttempts}`);
    
    const videos = findVideoElements();
    
    if (videos.length > 0) {
      console.log('Found YouTube video element!');
      activeVideo = videos[0];
      monitorVideo(activeVideo);
      return;
    }
    
    if (attempts < maxAttempts) {
      setTimeout(findAndMonitorYouTubeVideo, 500); // Try again in 500ms
    } else {
      console.log('Failed to find YouTube video after maximum attempts');
    }
  };

  // Start searching
  findAndMonitorYouTubeVideo();
  
  // Also set up observer for dynamic loading
  const observer = new MutationObserver((mutations) => {
    if (activeVideo || !isMonitoring) return;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const videos = findVideoElements();
        if (videos.length > 0) {
          console.log('Found YouTube video via MutationObserver');
          activeVideo = videos[0];
          monitorVideo(activeVideo);
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Add to cleanup
  const originalCleanup = cleanup;
  cleanup = () => {
    originalCleanup?.();
    observer.disconnect();
  };
}

// Initialize connection when the script loads
connectToExtension();

// Don't automatically start monitoring - wait for user command
console.log(
  "Video detector loaded and waiting for user command to start monitoring"
);
