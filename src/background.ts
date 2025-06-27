// Background script to handle port connections and message routing
console.log('StreamProbe background script loaded');

// Store active connections
const connections = new Map<number, chrome.runtime.Port>();

// Handle connections from content scripts and popup
chrome.runtime.onConnect.addListener((port) => {
  console.log('Background: Port connected:', port.name);

  if (port.name === 'videoMonitor') {
    // Get the tab ID from the port
    const tabId = port.sender?.tab?.id;
    
    if (tabId) {
      connections.set(tabId, port);
      console.log(`Background: Registered connection for tab ${tabId}`);
    }

    // Handle messages from content script or popup
    port.onMessage.addListener((message, sender) => {
      console.log('Background: Received message:', message, 'from:', sender);
      
      // Route messages between popup and content script
      if (message.type === 'startMonitoring' || message.type === 'stopMonitoring') {
        // Message from popup to content script
        const senderTabId = port.sender?.tab?.id;
        if (senderTabId) {
          const targetPort = connections.get(senderTabId);
          if (targetPort) {
            targetPort.postMessage(message);
          }
        }
      } else if (message.type === 'videoStats') {
        // Message from content script to popup
        // Broadcast to all connected ports (popup will filter)
        connections.forEach((connPort, tabId) => {
          if (connPort !== port) { // Don't send back to sender
            try {
              connPort.postMessage(message);
            } catch (error) {
              console.log(`Background: Failed to send to port for tab ${tabId}:`, error);
              connections.delete(tabId);
            }
          }
        });
      }
    });

    // Clean up on disconnect
    port.onDisconnect.addListener(() => {
      console.log('Background: Port disconnected:', port.name);
      const tabId = port.sender?.tab?.id;
      if (tabId) {
        connections.delete(tabId);
      }
    });
  }
});

// Clean up connections when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  connections.delete(tabId);
  console.log(`Background: Cleaned up connection for closed tab ${tabId}`);
});
