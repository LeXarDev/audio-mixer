# 🎙️ Mic Processor Pro

A professional real-time microphone audio processor built with Electron, React, and Web Audio API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

## ✨ Features

### Audio Processing
- **High-Pass Filter** - Remove low-frequency rumble (20-500Hz)
- **3-Band EQ** - Low, Mid, High shelving filters
- **De-Esser** - Reduce harsh sibilance (S sounds)
- **Compressor** - Dynamic range control
- **Multi-band Compressor** - 3-band professional compression
- **Noise Gate** - Cut background noise when not speaking
- **Reverb** - Room ambiance effect
- **Limiter** - Prevent audio clipping

### AI Noise Reduction
- **RNNoise** - Real-time AI-powered background noise removal

### User Experience
- 🎨 Modern dark UI with smooth animations
- 📊 Real-time spectrum analyzer and VU meter
- 💾 5 built-in presets (Radio Voice, Podcast, Gaming, Singing, Clean)
- ⭐ Save/load custom presets
- 🎛️ Signal chain visualization

### System Integration
- 🔌 VB-Cable auto-detection for routing to other apps
- 🎧 Monitor mode to hear processed audio
- 🔄 Hot-swap microphone support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [VB-Cable](https://vb-audio.com/Cable/) (recommended for routing audio)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/mic-processor-pro.git
cd mic-processor-pro

# Install dependencies
npm install

# Start the application
npm start
```

### Development

```bash
# Run Vite dev server only
npm run dev

# Run Electron only
npm run electron

# Build for production
npm run build
```

## 📁 Project Structure

```
mic-processor-pro/
├── src/
│   ├── App.jsx              # Main application
│   ├── main.jsx             # Entry point
│   ├── audio/
│   │   └── AudioEngine.js   # Core audio processing
│   ├── components/
│   │   ├── TitleBar.jsx
│   │   ├── MicrophonePanel.jsx
│   │   ├── EffectsPanel.jsx
│   │   ├── PresetsPanel.jsx
│   │   ├── PluginsPanel.jsx
│   │   └── Visualizer.jsx
│   └── styles/
│       └── main.css
├── main.js                  # Electron main process
├── preload.js               # Electron preload
└── package.json
```

## 🎛️ Signal Chain

```
Mic → Gain → High-Pass → RNNoise → Gate → EQ → De-Esser → 
Compressor/Multi-band → Reverb → Limiter → Output
```

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI framework
- **Vite** - Build tool
- **Web Audio API** - Audio processing
- **RNNoise WASM** - AI noise reduction
- **Lucide React** - Icons

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ using Electron + React
