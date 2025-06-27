import { useState, useEffect, useCallback } from 'react';
import { NetworkCondition, NetworkMetrics } from '../types';

const NETWORK_CONDITIONS: Record<NetworkCondition, NetworkMetrics> = {
    '3g': { latency: '187 ms', bitrate: '2.4 Mbps', bufferTime: '1.6 s' },
    '4g': { latency: '50 ms', bitrate: '10 Mbps', bufferTime: '0.5 s' },
    '5g': { latency: '10 ms', bitrate: '100 Mbps', bufferTime: '0.1 s' }
};

// Network throttling configuration
const THROTTLING_CONFIG: Record<NetworkCondition, { downloadThroughput: number; uploadThroughput: number; latency: number }> = {
    '3g': { downloadThroughput: 400 * 1024, uploadThroughput: 400 * 1024, latency: 187 },
    '4g': { downloadThroughput: 10 * 1024 * 1024, uploadThroughput: 10 * 1024 * 1024, latency: 50 },
    '5g': { downloadThroughput: 100 * 1024 * 1024, uploadThroughput: 100 * 1024 * 1024, latency: 10 }
};

interface NetworkSimulationOptions {
    initialCondition?: NetworkCondition;
    onMetricsUpdate?: (metrics: NetworkMetrics) => void;
}

export function useNetworkSimulation({ 
    initialCondition = '3g',
    onMetricsUpdate 
}: NetworkSimulationOptions = {}) {
    const [condition, setCondition] = useState<NetworkCondition>(initialCondition);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        const metrics = NETWORK_CONDITIONS[condition];
        onMetricsUpdate?.(metrics);
    }, [condition, onMetricsUpdate]);

    const applyNetworkThrottling = useCallback(async (condition: NetworkCondition) => {
        try {
            // Query for the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.id) return;

            const config = THROTTLING_CONFIG[condition];
            
            // Apply network throttling using Chrome debugger API
            await chrome.debugger.attach({ tabId: tab.id }, '1.2');
            await chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.enable');
            await chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.emulateNetworkConditions', {
                offline: false,
                downloadThroughput: config.downloadThroughput,
                uploadThroughput: config.uploadThroughput,
                latency: config.latency
            });
            
            console.log(`Applied ${condition} throttling:`, config);
        } catch (error) {
            console.warn('Failed to apply network throttling:', error);
        }
    }, []);

    const removeNetworkThrottling = useCallback(async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.id) return;

            await chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.emulateNetworkConditions', {
                offline: false,
                downloadThroughput: -1,
                uploadThroughput: -1,
                latency: 0
            });
            await chrome.debugger.detach({ tabId: tab.id });
            
            console.log('Removed network throttling');
        } catch (error) {
            console.warn('Failed to remove network throttling:', error);
        }
    }, []);

    const startSimulation = useCallback(() => {
        setIsSimulating(true);
        applyNetworkThrottling(condition);
    }, [condition, applyNetworkThrottling]);

    const stopSimulation = useCallback(() => {
        setIsSimulating(false);
        removeNetworkThrottling();
    }, [removeNetworkThrottling]);

    const changeCondition = (newCondition: NetworkCondition) => {
        setCondition(newCondition);
    };

    return {
        condition,
        isSimulating,
        metrics: NETWORK_CONDITIONS[condition],
        startSimulation,
        stopSimulation,
        changeCondition
    };
} 