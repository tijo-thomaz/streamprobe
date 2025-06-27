import React from 'react';
import { createRoot } from 'react-dom/client';
import { StreamProbe } from '../components/StreamProbe';
import '../globals.css';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <StreamProbe 
            onClose={() => window.close()}
            initialCondition="3g"
        />
    </React.StrictMode>
); 