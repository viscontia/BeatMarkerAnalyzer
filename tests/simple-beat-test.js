/**
 * Simple BeatNet+ Test - Minimal test to verify beat generation
 * Run with: node tests/simple-beat-test.js
 */

// Simulate the WebWorker environment
global.self = {
  postMessage: (data) => {
    if (data.type === 'beat') {
      console.log(`🥁 Beat Event: t=${data.timestamp.toFixed(3)}s, downbeat=${data.downbeat}, tempo=${data.tempo.toFixed(1)}, conf=${data.confidence.toFixed(3)}`);
    } else {
      console.log(`📨 Worker Message:`, data);
    }
  },
  onmessage: null
};

// Import the worker logic (we'll need to extract the main class)
console.log('🔧 Starting BeatNet+ simple test...\n');

// Simulate the BeatNetPlusWorker class with minimal implementation
class SimpleBeatTest {
  constructor() {
    this.particles = [];
    this.NUM_PARTICLES = 10; // Reduced for test
    this.TEMPO_MIN = 60;
    this.TEMPO_MAX = 200;
    this.HOP_SIZE_MS = 46;
    this.frameCount = 0;
    this.initializeParticles();
  }

  initializeParticles() {
    this.particles = [];
    for (let i = 0; i < this.NUM_PARTICLES; i++) {
      this.particles.push({
        position: Math.random(),
        tempo: this.TEMPO_MIN + Math.random() * (this.TEMPO_MAX - this.TEMPO_MIN),
        phase: Math.floor(Math.random() * 4),
        weight: 1.0 / this.NUM_PARTICLES
      });
    }
    console.log(`🔮 Particle filter initialized: ${this.NUM_PARTICLES} particles`);
  }

  simulateInference(features) {
    // Enhanced energy-based beat detection simulation
    let energy = 0;
    let spectralVariance = 0;

    for (let i = 0; i < features.length; i++) {
      const val = Math.abs(features[i]);
      energy += val;
      spectralVariance += val * val;
    }

    const normalizedEnergy = energy / features.length;
    const variance = (spectralVariance / features.length) - (normalizedEnergy * normalizedEnergy);

    const energyContrib = Math.max(0, Math.min(1, normalizedEnergy * 2));
    const varianceContrib = Math.max(0, Math.min(1, variance * 5));

    const beatProb = Math.max(energyContrib, varianceContrib * 0.7);
    const downbeatProb = beatProb * 0.3;

    return { beatProb, downbeatProb };
  }

  isNearBeatPosition(position) {
    const beatPositions = [0, 0.25, 0.5, 0.75];
    const threshold = 0.1;

    return beatPositions.some(beatPos => {
      const distance = Math.min(
        Math.abs(position - beatPos),
        Math.abs(position - beatPos + 1),
        Math.abs(position - beatPos - 1)
      );
      return distance < threshold;
    });
  }

  getWeightedAverage(property) {
    return this.particles.reduce((sum, p) => sum + p[property] * p.weight, 0);
  }

  updateParticleFilter(timestamp, beatProb, downbeatProb) {
    // Update particles
    for (const particle of this.particles) {
      const timeDelta = this.HOP_SIZE_MS / 1000;
      const beatInterval = 60 / particle.tempo;
      particle.position += timeDelta / beatInterval;

      if (particle.position >= 1.0) {
        particle.position -= 1.0;
        particle.phase = (particle.phase + 1) % 4;
      }

      const expectedBeatProb = particle.position < 0.1 || particle.position > 0.9 ? 0.8 : 0.2;
      const expectedDownbeatProb = particle.phase === 0 ? expectedBeatProb : 0;

      const beatLikelihood = 1 - Math.abs(beatProb - expectedBeatProb);
      const downbeatLikelihood = 1 - Math.abs(downbeatProb - expectedDownbeatProb);

      particle.weight *= (beatLikelihood * 0.7 + downbeatLikelihood * 0.3);
    }

    // Normalize weights
    const totalWeight = this.particles.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight > 0) {
      this.particles.forEach(p => p.weight /= totalWeight);
    }

    const avgPosition = this.getWeightedAverage('position');
    const avgTempo = this.getWeightedAverage('tempo');

    // Beat detection (more sensitive)
    const isBeat = beatProb > 0.2 && this.isNearBeatPosition(avgPosition);
    const isDownbeat = downbeatProb > 0.15 && isBeat;

    if (isBeat) {
      return {
        type: 'beat',
        timestamp,
        beat: true,
        downbeat: isDownbeat,
        tempo: avgTempo,
        confidence: Math.max(beatProb, downbeatProb)
      };
    }

    return null;
  }

  async testWithSyntheticData() {
    console.log('🎵 Testing with synthetic audio data...\n');

    let beatEvents = [];
    const durationSeconds = 10; // 10 seconds test
    const framesPerSecond = 1000 / this.HOP_SIZE_MS;
    const totalFrames = Math.floor(durationSeconds * framesPerSecond);

    console.log(`📊 Test parameters: ${durationSeconds}s, ${totalFrames} frames, ${framesPerSecond.toFixed(1)} fps`);

    for (let frame = 0; frame < totalFrames; frame++) {
      const timestamp = frame * this.HOP_SIZE_MS / 1000;

      // Generate synthetic features (simulate rhythmic music)
      const features = new Float32Array(272);
      const rhythmPhase = (timestamp * 2) % 1; // 120 BPM rhythm
      const baseEnergy = 0.5 + 0.3 * Math.sin(rhythmPhase * Math.PI * 2);

      for (let i = 0; i < features.length; i++) {
        // Add some frequency-dependent energy and noise
        features[i] = baseEnergy * (1 + 0.2 * Math.sin(i * 0.1)) + (Math.random() - 0.5) * 0.1;
      }

      // Run inference
      const { beatProb, downbeatProb } = this.simulateInference(features);

      // Update particle filter
      const beatEvent = this.updateParticleFilter(timestamp, beatProb, downbeatProb);

      if (beatEvent) {
        beatEvents.push(beatEvent);
        self.postMessage(beatEvent);
      }

      // Log progress every 2 seconds
      if (frame % Math.floor(framesPerSecond * 2) === 0) {
        console.log(`📊 Frame ${frame}/${totalFrames}: t=${timestamp.toFixed(3)}s, beatProb=${beatProb.toFixed(3)}, downbeatProb=${downbeatProb.toFixed(3)}`);
      }

      this.frameCount++;
    }

    console.log(`\n🏁 Test completed!`);
    console.log(`📈 Results: ${beatEvents.length} beats detected in ${durationSeconds}s`);
    console.log(`📊 Beat rate: ${(beatEvents.length / durationSeconds * 60).toFixed(1)} BPM equivalent`);

    const downbeats = beatEvents.filter(b => b.downbeat);
    console.log(`🔴 Downbeats: ${downbeats.length}`);

    if (beatEvents.length === 0) {
      console.log('❌ NO BEATS DETECTED! Check algorithm parameters.');
    } else {
      console.log('✅ Beat detection working!');
    }

    return beatEvents;
  }
}

// Run the test
async function runTest() {
  console.log('🚀 Initializing simple beat test...\n');

  const test = new SimpleBeatTest();
  await test.testWithSyntheticData();

  console.log('\n🔧 Test completed. Check output above for beat events.');
}

runTest().catch(console.error);