// AudioEngine with ALL effects including High-Pass, De-Esser, Multi-band Compressor
import { NoiseSuppressorWorklet_Name } from '@timephy/rnnoise-wasm';
import NoiseSuppressorWorkletUrl from '@timephy/rnnoise-wasm/NoiseSuppressorWorklet?worker&url';

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.analyserNode = null;
        this.gainNode = null;
        this.outputGainNode = null;
        this.monitorGainNode = null;

        // Filters
        this.highpassFilter = null;
        this.lowFilter = null;
        this.midFilter = null;
        this.highFilter = null;
        this.deesserFilter = null;

        // Dynamics
        this.compressorNode = null;
        this.limiterNode = null;
        this.gateProcessor = null;

        // Multi-band Compressor
        this.mbLowSplit = null;
        this.mbHighSplit = null;
        this.mbLowComp = null;
        this.mbMidComp = null;
        this.mbHighComp = null;
        this.mbMerge = null;

        // Effects
        this.rnnoiseNode = null;
        this.reverbNode = null;
        this.reverbGainNode = null;
        this.dryGainNode = null;

        this.stream = null;
        this.dataArray = null;
        this.onDeviceChange = null;
        this.currentInputId = null;
        this.currentOutputId = null;
        this.currentSettings = null;
        this.isRunning = false;
        this.isMonitoring = false;
        this.rnnoiseLoaded = false;
        this.reverbBuffer = null;
        this.gateThreshold = 0.003; // Default gate threshold (linear)

        this.setupDeviceChangeListener();
    }

    setupDeviceChangeListener() {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', async () => {
                console.log('Audio devices changed');
                const devices = await this.getDevices();
                if (this.onDeviceChange) {
                    this.onDeviceChange(devices);
                }
            });
        }
    }

    setDeviceChangeCallback(callback) {
        this.onDeviceChange = callback;
    }

    async getDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            const outputs = devices.filter(d => d.kind === 'audiooutput');
            return { inputs, outputs };
        } catch (error) {
            console.error('Error getting devices:', error);
            return { inputs: [], outputs: [] };
        }
    }

    async loadRNNoise() {
        if (this.rnnoiseLoaded || !this.audioContext) return true;
        try {
            await this.audioContext.audioWorklet.addModule(NoiseSuppressorWorkletUrl);
            this.rnnoiseLoaded = true;
            console.log('RNNoise AudioWorklet loaded');
            return true;
        } catch (error) {
            console.error('Failed to load RNNoise:', error);
            return false;
        }
    }

    createReverbImpulse(duration = 2, decay = 2) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    }

    async start(inputDeviceId, outputDeviceId, settings) {
        try {
            this.stop();

            this.currentInputId = inputDeviceId;
            this.currentOutputId = outputDeviceId;
            this.currentSettings = { ...settings };

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: inputDeviceId ? { exact: inputDeviceId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // === CREATE ALL NODES ===
            this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

            // Analyser
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

            // Input Gain
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.dbToLinear(settings.gain);

            // High-Pass Filter
            this.highpassFilter = this.audioContext.createBiquadFilter();
            this.highpassFilter.type = 'highpass';
            this.highpassFilter.frequency.value = settings.highpass?.frequency || 80;
            this.highpassFilter.Q.value = 0.7;

            // EQ Filters
            this.lowFilter = this.audioContext.createBiquadFilter();
            this.lowFilter.type = 'lowshelf';
            this.lowFilter.frequency.value = 320;
            this.lowFilter.gain.value = settings.eq.low;

            this.midFilter = this.audioContext.createBiquadFilter();
            this.midFilter.type = 'peaking';
            this.midFilter.frequency.value = 1000;
            this.midFilter.Q.value = 1;
            this.midFilter.gain.value = settings.eq.mid;

            this.highFilter = this.audioContext.createBiquadFilter();
            this.highFilter.type = 'highshelf';
            this.highFilter.frequency.value = 3200;
            this.highFilter.gain.value = settings.eq.high;

            // De-Esser (notch/peaking filter to reduce sibilance)
            this.deesserFilter = this.audioContext.createBiquadFilter();
            this.deesserFilter.type = 'peaking';
            this.deesserFilter.frequency.value = settings.deesser?.frequency || 6000;
            this.deesserFilter.Q.value = 2;
            this.deesserFilter.gain.value = -(settings.deesser?.reduction || 6);

            // Standard Compressor
            this.compressorNode = this.audioContext.createDynamicsCompressor();
            this.compressorNode.threshold.value = settings.compressor.threshold;
            this.compressorNode.ratio.value = settings.compressor.ratio;
            this.compressorNode.attack.value = settings.compressor.attack;
            this.compressorNode.release.value = settings.compressor.release;
            this.compressorNode.knee.value = 10;

            // Multi-band Compressor
            // Low band split (lowpass)
            this.mbLowSplit = this.audioContext.createBiquadFilter();
            this.mbLowSplit.type = 'lowpass';
            this.mbLowSplit.frequency.value = 300;

            // High band split (highpass)
            this.mbHighSplit = this.audioContext.createBiquadFilter();
            this.mbHighSplit.type = 'highpass';
            this.mbHighSplit.frequency.value = 3000;

            // Mid band (bandpass)
            const mbMidLow = this.audioContext.createBiquadFilter();
            mbMidLow.type = 'highpass';
            mbMidLow.frequency.value = 300;
            const mbMidHigh = this.audioContext.createBiquadFilter();
            mbMidHigh.type = 'lowpass';
            mbMidHigh.frequency.value = 3000;

            // Compressors for each band
            this.mbLowComp = this.audioContext.createDynamicsCompressor();
            this.mbLowComp.threshold.value = settings.multibandCompressor?.low?.threshold || -24;
            this.mbLowComp.ratio.value = settings.multibandCompressor?.low?.ratio || 3;
            this.mbLowComp.attack.value = 0.01;
            this.mbLowComp.release.value = 0.1;

            this.mbMidComp = this.audioContext.createDynamicsCompressor();
            this.mbMidComp.threshold.value = settings.multibandCompressor?.mid?.threshold || -24;
            this.mbMidComp.ratio.value = settings.multibandCompressor?.mid?.ratio || 3;
            this.mbMidComp.attack.value = 0.005;
            this.mbMidComp.release.value = 0.1;

            this.mbHighComp = this.audioContext.createDynamicsCompressor();
            this.mbHighComp.threshold.value = settings.multibandCompressor?.high?.threshold || -24;
            this.mbHighComp.ratio.value = settings.multibandCompressor?.high?.ratio || 3;
            this.mbHighComp.attack.value = 0.002;
            this.mbHighComp.release.value = 0.05;

            // Merge node for multi-band
            this.mbMerge = this.audioContext.createGain();

            // Store mid filters
            this.mbMidLow = mbMidLow;
            this.mbMidHigh = mbMidHigh;

            // Limiter
            this.limiterNode = this.audioContext.createDynamicsCompressor();
            this.limiterNode.threshold.value = settings.limiter.threshold;
            this.limiterNode.ratio.value = 20;
            this.limiterNode.attack.value = 0.001;
            this.limiterNode.release.value = 0.1;
            this.limiterNode.knee.value = 0;

            // Reverb
            this.reverbNode = this.audioContext.createConvolver();
            this.reverbBuffer = this.createReverbImpulse(2, 2);
            this.reverbNode.buffer = this.reverbBuffer;
            this.reverbGainNode = this.audioContext.createGain();
            this.reverbGainNode.gain.value = settings.reverb.wet;
            this.dryGainNode = this.audioContext.createGain();
            this.dryGainNode.gain.value = 1 - settings.reverb.wet;

            // Noise Gate
            this.gateThreshold = this.dbToLinear(settings.gate.threshold);
            this.gateProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
            const self = this;
            this.gateProcessor.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                const output = e.outputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < input.length; i++) {
                    sum += input[i] * input[i];
                }
                const rms = Math.sqrt(sum / input.length);
                const gateGain = rms > self.gateThreshold ? 1 : 0.01;
                for (let i = 0; i < input.length; i++) {
                    output[i] = input[i] * gateGain;
                }
            };

            // Output gains
            this.outputGainNode = this.audioContext.createGain();
            this.outputGainNode.gain.value = settings.muted ? 0 : settings.outputVolume / 100;
            this.monitorGainNode = this.audioContext.createGain();
            this.monitorGainNode.gain.value = 0;

            // Load RNNoise if enabled
            if (settings.rnnoise?.enabled) {
                await this.loadRNNoise();
                if (this.rnnoiseLoaded) {
                    this.rnnoiseNode = new AudioWorkletNode(this.audioContext, NoiseSuppressorWorklet_Name);
                }
            }

            // Connect the chain
            this.connectAudioChain(settings);

            this.isRunning = true;
            console.log('Audio engine started with all effects');
            return true;
        } catch (error) {
            console.error('Error starting audio engine:', error);
            this.isRunning = false;
            return false;
        }
    }

    connectAudioChain(settings) {
        // Disconnect all
        const nodesToDisconnect = [
            this.sourceNode, this.gainNode, this.highpassFilter,
            this.lowFilter, this.midFilter, this.highFilter,
            this.deesserFilter, this.rnnoiseNode, this.compressorNode,
            this.mbLowSplit, this.mbHighSplit, this.mbMidLow, this.mbMidHigh,
            this.mbLowComp, this.mbMidComp, this.mbHighComp, this.mbMerge,
            this.limiterNode, this.gateProcessor, this.reverbNode,
            this.reverbGainNode, this.dryGainNode, this.analyserNode,
            this.outputGainNode, this.monitorGainNode
        ];
        nodesToDisconnect.forEach(node => {
            try { node?.disconnect(); } catch (e) { }
        });

        /*
         * Signal Chain:
         * source -> gain -> (highpass?) -> (rnnoise?) -> (gate?) -> EQ -> (deesser?) ->
         * (compressor? OR multibandComp?) -> (reverb?) -> (limiter?) -> analyser -> output
         */

        this.sourceNode.connect(this.gainNode);
        let lastNode = this.gainNode;

        // High-Pass Filter
        if (settings.highpass?.enabled) {
            lastNode.connect(this.highpassFilter);
            lastNode = this.highpassFilter;
        }

        // RNNoise
        if (settings.rnnoise?.enabled && this.rnnoiseNode) {
            lastNode.connect(this.rnnoiseNode);
            lastNode = this.rnnoiseNode;
        }

        // Noise Gate
        if (settings.gate?.enabled && this.gateProcessor) {
            lastNode.connect(this.gateProcessor);
            lastNode = this.gateProcessor;
        }

        // EQ
        lastNode.connect(this.lowFilter);
        this.lowFilter.connect(this.midFilter);
        this.midFilter.connect(this.highFilter);
        lastNode = this.highFilter;

        // De-Esser
        if (settings.deesser?.enabled) {
            lastNode.connect(this.deesserFilter);
            lastNode = this.deesserFilter;
        }

        // Compression: Standard OR Multi-band
        if (settings.multibandCompressor?.enabled) {
            // Multi-band compression
            lastNode.connect(this.mbLowSplit);
            lastNode.connect(this.mbMidLow);
            lastNode.connect(this.mbHighSplit);

            this.mbLowSplit.connect(this.mbLowComp);
            this.mbMidLow.connect(this.mbMidHigh);
            this.mbMidHigh.connect(this.mbMidComp);
            this.mbHighSplit.connect(this.mbHighComp);

            this.mbLowComp.connect(this.mbMerge);
            this.mbMidComp.connect(this.mbMerge);
            this.mbHighComp.connect(this.mbMerge);

            lastNode = this.mbMerge;
        } else if (settings.compressor?.enabled) {
            lastNode.connect(this.compressorNode);
            lastNode = this.compressorNode;
        }

        // Reverb (parallel dry/wet)
        if (settings.reverb?.enabled) {
            const reverbMixNode = this.audioContext.createGain();
            lastNode.connect(this.dryGainNode);
            lastNode.connect(this.reverbNode);
            this.reverbNode.connect(this.reverbGainNode);
            this.dryGainNode.connect(reverbMixNode);
            this.reverbGainNode.connect(reverbMixNode);
            lastNode = reverbMixNode;
        }

        // Limiter
        if (settings.limiter?.enabled) {
            lastNode.connect(this.limiterNode);
            lastNode = this.limiterNode;
        }

        // Analyser
        lastNode.connect(this.analyserNode);

        // Output to VB-Cable (silent to speakers)
        this.analyserNode.connect(this.outputGainNode);

        // If VB-Cable is available, route output to it (this goes to VB-Cable, not speakers)
        // For VB-Cable output, we'd need setSinkId which requires different approach
        // For now, outputGainNode is for the "main" output level control

        // Monitor output - this is what goes to speakers
        // Connect analyser to monitor for listening
        this.analyserNode.connect(this.monitorGainNode);
        this.monitorGainNode.connect(this.audioContext.destination);

        // Note: VB-Cable routing requires setSinkId on a MediaStreamDestination
        // which is a more complex setup. For now, all audio goes through monitor
        // when monitor is enabled, otherwise it's silent to speakers.
    }

    setMonitoring(enabled) {
        this.isMonitoring = enabled;
        if (this.monitorGainNode && this.audioContext) {
            this.monitorGainNode.gain.setValueAtTime(enabled ? 0.5 : 0, this.audioContext.currentTime);
        }
    }

    stop() {
        this.isRunning = false;
        this.isMonitoring = false;

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(() => { });
            this.audioContext = null;
        }

        // Reset all nodes
        this.sourceNode = null;
        this.analyserNode = null;
        this.gainNode = null;
        this.outputGainNode = null;
        this.monitorGainNode = null;
        this.highpassFilter = null;
        this.compressorNode = null;
        this.limiterNode = null;
        this.lowFilter = null;
        this.midFilter = null;
        this.highFilter = null;
        this.deesserFilter = null;
        this.rnnoiseNode = null;
        this.reverbNode = null;
        this.reverbGainNode = null;
        this.dryGainNode = null;
        this.gateProcessor = null;
        this.mbLowSplit = null;
        this.mbHighSplit = null;
        this.mbLowComp = null;
        this.mbMidComp = null;
        this.mbHighComp = null;
        this.mbMerge = null;
        this.rnnoiseLoaded = false;

        console.log('Audio engine stopped');
    }

    async updateSettings(settings) {
        if (!this.audioContext || !this.isRunning) return;

        const prevSettings = this.currentSettings;
        this.currentSettings = { ...settings };

        // Update Gain
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(this.dbToLinear(settings.gain), this.audioContext.currentTime);
        }

        // Update High-Pass
        if (this.highpassFilter) {
            this.highpassFilter.frequency.setValueAtTime(settings.highpass?.frequency || 80, this.audioContext.currentTime);
        }

        // Update EQ
        if (this.lowFilter) this.lowFilter.gain.setValueAtTime(settings.eq.low, this.audioContext.currentTime);
        if (this.midFilter) this.midFilter.gain.setValueAtTime(settings.eq.mid, this.audioContext.currentTime);
        if (this.highFilter) this.highFilter.gain.setValueAtTime(settings.eq.high, this.audioContext.currentTime);

        // Update De-Esser
        if (this.deesserFilter) {
            this.deesserFilter.frequency.setValueAtTime(settings.deesser?.frequency || 6000, this.audioContext.currentTime);
            this.deesserFilter.gain.setValueAtTime(-(settings.deesser?.reduction || 6), this.audioContext.currentTime);
        }

        // Update Compressor
        if (this.compressorNode) {
            this.compressorNode.threshold.setValueAtTime(settings.compressor.threshold, this.audioContext.currentTime);
            this.compressorNode.ratio.setValueAtTime(settings.compressor.ratio, this.audioContext.currentTime);
        }

        // Update Multi-band Compressor
        if (this.mbLowComp) {
            this.mbLowComp.threshold.setValueAtTime(settings.multibandCompressor?.low?.threshold || -24, this.audioContext.currentTime);
            this.mbLowComp.ratio.setValueAtTime(settings.multibandCompressor?.low?.ratio || 3, this.audioContext.currentTime);
        }
        if (this.mbMidComp) {
            this.mbMidComp.threshold.setValueAtTime(settings.multibandCompressor?.mid?.threshold || -24, this.audioContext.currentTime);
            this.mbMidComp.ratio.setValueAtTime(settings.multibandCompressor?.mid?.ratio || 3, this.audioContext.currentTime);
        }
        if (this.mbHighComp) {
            this.mbHighComp.threshold.setValueAtTime(settings.multibandCompressor?.high?.threshold || -24, this.audioContext.currentTime);
            this.mbHighComp.ratio.setValueAtTime(settings.multibandCompressor?.high?.ratio || 3, this.audioContext.currentTime);
        }

        // Update Limiter
        if (this.limiterNode) {
            this.limiterNode.threshold.setValueAtTime(settings.limiter.threshold, this.audioContext.currentTime);
        }

        // Update Gate Threshold (dynamic)
        this.gateThreshold = this.dbToLinear(settings.gate.threshold);

        // Update Reverb mix
        if (this.reverbGainNode && this.dryGainNode) {
            this.reverbGainNode.gain.setValueAtTime(settings.reverb.wet, this.audioContext.currentTime);
            this.dryGainNode.gain.setValueAtTime(1 - settings.reverb.wet, this.audioContext.currentTime);
        }

        // Update Output
        if (this.outputGainNode) {
            const volume = settings.muted ? 0 : settings.outputVolume / 100;
            this.outputGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }

        // Check for topology changes
        const topologyChanged = prevSettings && (
            prevSettings.rnnoise?.enabled !== settings.rnnoise?.enabled ||
            prevSettings.highpass?.enabled !== settings.highpass?.enabled ||
            prevSettings.deesser?.enabled !== settings.deesser?.enabled ||
            prevSettings.gate?.enabled !== settings.gate?.enabled ||
            prevSettings.compressor?.enabled !== settings.compressor?.enabled ||
            prevSettings.multibandCompressor?.enabled !== settings.multibandCompressor?.enabled ||
            prevSettings.reverb?.enabled !== settings.reverb?.enabled ||
            prevSettings.limiter?.enabled !== settings.limiter?.enabled
        );

        if (topologyChanged) {
            if (prevSettings.rnnoise?.enabled !== settings.rnnoise?.enabled) {
                const wasMonitoring = this.isMonitoring;
                await this.start(this.currentInputId, this.currentOutputId, settings);
                if (wasMonitoring) this.setMonitoring(true);
            } else {
                this.connectAudioChain(settings);
            }
        }
    }

    dbToLinear(db) {
        return Math.pow(10, db / 20);
    }

    getAnalyserData() {
        if (this.analyserNode && this.dataArray && this.isRunning) {
            this.analyserNode.getByteFrequencyData(this.dataArray);
            return this.dataArray;
        }
        return null;
    }

    getLevel() {
        const data = this.getAnalyserData();
        if (!data) return 0;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum / data.length / 255;
    }
}
