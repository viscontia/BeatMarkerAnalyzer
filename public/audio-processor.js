/**
 * AudioWorkletProcessor per streaming real-time audio
 * Ring buffer + chunking per onset detection
 */

class AudioStreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Ring buffer configuration
    this.bufferSize = 4096;
    this.hopSize = 512;
    this.ringBuffer = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.sampleCount = 0;

    // Onset detection state
    this.frameSizeForOnset = 2048;
    this.onsetHopSize = 512;
    this.lastOnsetFrame = new Float32Array(this.frameSizeForOnset);

    // Sample rate (disponibile nel contesto AudioWorklet)
    this.sampleRate = sampleRate || 44100;

    console.log('🎙️ AudioStreamProcessor initialized');
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];

      // Debug: log audio input
      if (this.sampleCount % 44100 === 0) { // Log ogni secondo
        const rms = Math.sqrt(inputChannel.reduce((sum, sample) => sum + sample * sample, 0) / inputChannel.length);
        console.log(`🎧 AudioWorklet processing: samples=${inputChannel.length}, rms=${rms.toFixed(4)}, totalSamples=${this.sampleCount}`);
      }

      // Copy input to output (passthrough)
      if (output.length > 0) {
        output[0].set(inputChannel);
      }

      // Feed ring buffer
      this.feedRingBuffer(inputChannel);

      // Check if we have enough data for processing
      this.processChunksIfReady();
    } else {
      // Debug: log when no input
      if (this.sampleCount % 44100 === 0) {
        console.log('⚠️ AudioWorklet: No input data received');
      }
    }

    return true; // Keep processor alive
  }

  /**
   * Alimenta il ring buffer con nuovi campioni
   */
  feedRingBuffer(inputSamples) {
    for (let i = 0; i < inputSamples.length; i++) {
      this.ringBuffer[this.writeIndex] = inputSamples[i];
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
      this.sampleCount++;
    }
  }

  /**
   * Processa chunk quando pronti (ogni 512 campioni)
   */
  processChunksIfReady() {
    while (this.sampleCount >= this.onsetHopSize) {
      // Estrai chunk per onset detection
      const chunk = this.extractChunk(this.frameSizeForOnset);

      if (chunk) {
        // Calcola onset probability (spectral flux semplificato)
        const onsetProb = this.calculateOnsetProbability(chunk);

        // Soglia molto bassa per debug - rileva tutto
        if (onsetProb > 0.01) {
          const currentTime = this.sampleCount / this.sampleRate;

          console.log(`🎵 Onset detected: t=${currentTime.toFixed(3)}s, prob=${onsetProb.toFixed(3)}`);

          this.port.postMessage({
            type: 'onset',
            time: currentTime,
            probability: onsetProb,
            chunk: chunk // Per processing avanzato nel worker
          });
        }
      }

      // Avanza read pointer
      this.readIndex = (this.readIndex + this.onsetHopSize) % this.bufferSize;
      this.sampleCount -= this.onsetHopSize;
    }
  }

  /**
   * Estrae chunk dal ring buffer
   */
  extractChunk(chunkSize) {
    if (this.sampleCount < chunkSize) {
      return null;
    }

    const chunk = new Float32Array(chunkSize);

    for (let i = 0; i < chunkSize; i++) {
      const index = (this.readIndex + i) % this.bufferSize;
      chunk[i] = this.ringBuffer[index];
    }

    return chunk;
  }

  /**
   * Enhanced onset detection con multi-band spectral flux
   */
  calculateOnsetProbability(frame) {
    // Multi-band spectral analysis per better onset detection
    const bins = Math.floor(frame.length / 2);

    // Banda di frequenze ottimizzate per brani acustici
    const lowBand = { start: 0, end: Math.floor(bins * 0.1) };      // Bass: 0-10%
    const midBand = { start: lowBand.end, end: Math.floor(bins * 0.4) }; // Mid: 10-40%
    const highBand = { start: midBand.end, end: bins };             // High: 40-100%

    let totalFlux = 0;
    let bandCount = 0;

    // Calcola flux per ogni banda con pesi specifici
    const bands = [
      { ...lowBand, weight: 1.2 },   // Bass più importante per beat
      { ...midBand, weight: 1.5 },   // Mid range più importante
      { ...highBand, weight: 0.8 }   // High meno importante
    ];

    for (const band of bands) {
      let bandFlux = 0;
      let sampleCount = 0;

      for (let bin = band.start; bin < band.end; bin++) {
        const startIdx = Math.floor((bin / bins) * frame.length);
        const endIdx = Math.floor(((bin + 1) / bins) * frame.length);

        let currentMag = 0;
        let prevMag = 0;

        // RMS invece di absolute mean per better dynamics
        for (let i = startIdx; i < endIdx && i < frame.length; i++) {
          currentMag += frame[i] * frame[i];
          prevMag += (this.lastOnsetFrame[i] || 0) * (this.lastOnsetFrame[i] || 0);
        }

        const sampleLength = endIdx - startIdx;
        currentMag = Math.sqrt(currentMag / sampleLength);
        prevMag = Math.sqrt(prevMag / sampleLength);

        // Half-wave rectified spectral difference
        const diff = currentMag - prevMag;
        if (diff > 0) {
          bandFlux += diff * band.weight;
          sampleCount++;
        }
      }

      if (sampleCount > 0) {
        totalFlux += bandFlux / sampleCount;
        bandCount++;
      }
    }

    // Salva frame per prossima iterazione
    this.lastOnsetFrame.set(frame);

    // Enhanced normalization con adaptive scaling
    const normalizedFlux = bandCount > 0 ? totalFlux / bandCount : 0;
    const adaptiveScale = 8.0; // Più sensibile per onset subtili

    // Applica sigmoid per smooth probability curve
    const probability = Math.min(1.0, normalizedFlux / adaptiveScale);
    return Math.max(0.0, probability);
  }
}

// Registra il processor
registerProcessor('audio-stream-processor', AudioStreamProcessor);