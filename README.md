# 🎬 StreamProbe - Video Performance Monitor

A professional Chrome extension for real-time video streaming performance analysis with built-in test videos, network simulation, and instant speed indicators.

![StreamProbe](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## ✨ Features

### 🎯 **Core Functionality**
- **Built-in Test Videos** - 3 HD videos (720p, 1080p, 4K) from Google CDN
- **Real-time Speed Indicators** - Instant Fast/Good/Okay/Slow feedback
- **Network Simulation** - 3G/4G/5G throttling with Chrome debugger API
- **Buffer Health Analysis** - Detailed buffering performance metrics
- **Performance Export** - Download detailed JSON metrics

### 🎨 **Modern UI**
- **Professional Dark Theme** - Clean gradient design
- **Responsive Layout** - Optimized 420×700px popup
- **Lucide React Icons** - Beautiful, consistent SVG icons
- **Tailwind CSS** - Modern utility-first styling
- **Accessible Design** - Screen reader and keyboard friendly

### 🛠️ **Technical Excellence**
- **Manifest V3** - Latest Chrome extension standards
- **TypeScript** - Full type safety and IntelliSense
- **React 18** - Modern component architecture
- **Real-time Monitoring** - 500ms update intervals
- **Self-contained** - No external dependencies for core features

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Chrome browser (latest version)
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/streamprobe.git
   cd streamprobe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build:extension
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## 📦 Development

### Available Scripts

```bash
# Development build with watch mode
npm run watch

# Full extension build (includes icons and manifest)
npm run build:extension

# TypeScript type checking
npm run build

# Development server
npm run dev
```

### Project Structure

```
streamprobe/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   └── StreamProbe.tsx # Main component
│   ├── hooks/              # Custom React hooks
│   ├── content/            # Content scripts
│   ├── background.ts       # Service worker
│   ├── popup/              # Extension popup
│   ├── types/              # TypeScript definitions
│   └── globals.css         # Global styles
├── icons/                  # Extension icons
├── scripts/                # Build scripts
├── store-assets/           # Chrome Web Store assets
├── manifest.json           # Extension manifest
└── dist/                   # Build output (gitignored)
```

## 🎯 Usage

### For Users
1. **Click Extension Icon** - Open StreamProbe popup
2. **Select Test Video** - Choose from built-in HD samples
3. **Start Monitoring** - Click "▶ Start Monitoring"
4. **Watch Performance** - See real-time speed indicators
5. **Test Networks** - Switch between 3G/4G/5G simulation
6. **Export Data** - Download performance metrics as JSON

### For Developers
- **Video Performance Testing** - Test streaming under different conditions
- **Network Simulation** - Throttle bandwidth for realistic testing
- **Buffer Analysis** - Understand video buffering behavior
- **Performance Metrics** - Export detailed timing data

## 🎨 UI Components

### Speed Indicators
- **🟢 FAST** - Buffer ahead ≥10s (Excellent performance)
- **🟢 GOOD** - Buffer ahead 5-10s (Good performance)
- **🟡 OKAY** - Buffer ahead 2-5s (Fair performance)
- **🔴 SLOW** - Buffer ahead <2s (Poor performance)

### Network Status
- **🚀 Excellent** - Latency <50ms
- **✅ Good** - Latency 50-100ms
- **⚠️ Fair** - Latency 100-200ms
- **🐌 Poor** - Latency >200ms

## 🛡️ Privacy & Security

- **No Data Collection** - All analysis happens locally
- **No External Tracking** - Zero telemetry or analytics
- **Local Processing** - Video analysis stays in your browser
- **Minimal Permissions** - Only essential Chrome APIs used

### Permissions Used
- `activeTab` - Monitor video performance on current tab
- `scripting` - Inject performance monitoring scripts
- `tabs` - Identify active video content
- `debugger` - Enable network throttling simulation

## 🏪 Chrome Web Store

### Publication Status
- **Version**: 1.0.0
- **Status**: Ready for submission
- **Category**: Developer Tools
- **Pricing**: Free

### Store Assets
- High-quality screenshots showing key features
- Professional description highlighting unique value
- Clear permission justifications
- Privacy policy compliance

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow existing TypeScript and React patterns
- Use Tailwind CSS for styling
- Maintain accessibility standards
- Add JSDoc comments for complex functions
- Test on multiple Chrome versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Storage** - For providing free test video CDN
- **Lucide React** - For beautiful, consistent icons
- **Tailwind CSS** - For modern utility-first styling
- **shadcn/ui** - For accessible component patterns
- **Chrome DevTools** - For inspiring the network simulation features

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/[your-username]/streamprobe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/[your-username]/streamprobe/discussions)
- **Email**: [your-email@domain.com]

---

<div align="center">

**Made with ❤️ for the web development community**

[Report Bug](https://github.com/[your-username]/streamprobe/issues) · [Request Feature](https://github.com/[your-username]/streamprobe/issues) · [View Demo](https://github.com/[your-username]/streamprobe#usage)

</div>
