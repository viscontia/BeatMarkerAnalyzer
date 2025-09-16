/**
 * BeatMarkerAnalyzer - Servizio Beat Detection con Essentia.js
 *
 * Implementazione professionale per rilevamento beat e down-beat
 * utilizzando algoritmi stato dell'arte di Essentia.
 */

import { Essentia, EssentiaWASM } from 'essentia.js';

export interface BeatDetectionResult {
  beats: number[];           // Posizioni beat in secondi
  downbeats: number[];       // Posizioni down-beat (primi tempi) in secondi
  bpm: number;              // BPM medio globale
  meter: string;            // Metrica musicale (es. "4/4", "3/4")
  confidence: number;       // Confidenza classificazione metro (0-1)
  beatIntervals: number[];  // Intervalli tra beat consecutivi
}

export interface MarkerData {
  start: number;            // Tempo in secondi
  value: string;           // Valore marker per FCPXML
  isDownbeat: boolean;     // Flag down-beat
  beatIndex: number;       // Indice beat globale
}

class BeatDetectionService {
  private essentia: Essentia | null = null;
  private isInitialized = false;

  /**
   * Inizializza Essentia.js WebAssembly
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Inizializza Essentia.js con WebAssembly
      this.essentia = new Essentia(EssentiaWASM);
      this.isInitialized = true;
      console.log('✅ Essentia.js inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione Essentia.js:', error);
      throw new Error('Impossibile inizializzare il motore di beat detection. Verificare la connessione internet.');
    }
  }

  /**
   * Estrae beat e down-beat da AudioBuffer
   */
  async extractBeats(audioBuffer: AudioBuffer): Promise<BeatDetectionResult> {
    if (!this.essentia) {
      throw new Error('Servizio non inizializzato. Chiamare initialize() prima.');
    }

    try {
      // Converte AudioBuffer in formato Essentia (mono, 44.1kHz)
      const audioData = this.prepareAudioData(audioBuffer);
      const vectorSignal = this.essentia.arrayToVector(audioData);

      console.log('🎵 Analisi audio in corso...', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      // Beat tracking con RhythmExtractor2013
      const rhythm = this.essentia.RhythmExtractor2013(vectorSignal);
      const { beats, bpm } = rhythm;

      console.log(`🥁 Trovati ${beats.length} beat - BPM: ${Math.round(bpm)}`);

      // Classificazione metrica con BeatTrackerDegara
      const meterResult = this.essentia.MeterClassifier(vectorSignal);
      const { meter, confidence } = meterResult;

      // Calcola down-beat basandosi sulla metrica
      const beatsPerMeasure = this.parseBeatsPerMeasure(meter);
      const downbeats = beats.filter((_beat, index) => index % beatsPerMeasure === 0);

      // Calcola intervalli tra beat
      const beatIntervals = beats.slice(1).map((beat, i) => beat - beats[i]);

      console.log(`📊 Metrica: ${meter} (confidenza: ${(confidence * 100).toFixed(1)}%)`);
      console.log(`🎯 Down-beat: ${downbeats.length} su ${beats.length} beat`);

      return {
        beats: Array.from(beats),
        downbeats: Array.from(downbeats),
        bpm: Math.round(bpm * 10) / 10, // Arrotonda a 1 decimale
        meter,
        confidence,
        beatIntervals: Array.from(beatIntervals)
      };

    } catch (error) {
      console.error('❌ Errore durante beat detection:', error);
      throw new Error('Errore durante l\'analisi del beat. Verificare il file audio.');
    }
  }

  /**
   * Converte risultato beat detection in marker FCPXML
   */
  generateMarkers(result: BeatDetectionResult): MarkerData[] {
    const markers: MarkerData[] = [];
    const { beats, downbeats, bpm, meter } = result;

    beats.forEach((beatTime, index) => {
      const isDownbeat = downbeats.includes(beatTime);

      // Logica colorazione marker secondo Apple FCPXML
      const markerValue = this.formatMarkerValue(index + 1, isDownbeat, bpm, meter);

      markers.push({
        start: beatTime,
        value: markerValue,
        isDownbeat,
        beatIndex: index
      });
    });

    return markers;
  }


  /**
   * Prepara dati audio per Essentia (mono, resample se necessario)
   */
  private prepareAudioData(audioBuffer: AudioBuffer): Float32Array {
    // Converte in mono se stereo
    let audioData: Float32Array;

    if (audioBuffer.numberOfChannels === 1) {
      audioData = audioBuffer.getChannelData(0);
    } else {
      // Mix down a mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      audioData = new Float32Array(left.length);

      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2;
      }
    }

    // Nota: Essentia.js gestisce automaticamente il resampling a 44.1kHz se necessario
    return audioData;
  }

  /**
   * Parsifica metrica musicale per calcolare beat per misura
   */
  private parseBeatsPerMeasure(meter: string): number {
    const match = meter.match(/^(\d+)\/\d+$/);
    return match ? parseInt(match[1]) : 4; // Default 4/4
  }

  /**
   * Formatta valore marker per FCPXML con colorazione
   */
  private formatMarkerValue(beatNumber: number, isDownbeat: boolean, bpm: number, meter: string): string {
    let prefix = '';

    // Colorazione secondo specifiche Apple FCPXML:
    // "!" = Rosso (down-beat e accenti forti)
    // "?" = Verde (off-beat, tempi deboli)
    // Nessun prefisso = Colore default

    if (isDownbeat) {
      prefix = '!'; // Rosso per down-beat
    } else if (beatNumber % 2 === 0) {
      prefix = '?'; // Verde per off-beat
    }

    const measureInfo = isDownbeat ? ' [Down-beat]' : '';
    return `${prefix}Beat ${beatNumber} - ${Math.round(bpm)} BPM ${meter}${measureInfo}`;
  }

  /**
   * Genera XML FCPXML completo con marker
   */
  generateFCPXML(
    markers: MarkerData[],
    audioFileName: string,
    duration: number
  ): string {
    const durationSeconds = Math.round(duration * 1000) / 1000; // Arrotonda a 3 decimali

    const markersXML = markers.map(marker => {
      const startTime = Math.round(marker.start * 1000) / 1000; // Precisione 1ms
      return `      <marker start="${startTime}s" duration="0.001s" value="${marker.value}"/>`;
    }).join('\\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="BMXRefTimelineFormat" name="FFVideoFormat1080p25" frameDuration="1000/25000s"/>
    <asset id="ASSET_BMXRefBeatmarkedClip" name="${audioFileName}" start="0s"
           duration="${durationSeconds}s" hasAudio="1" audioSources="1" audioRate="48000">
      <media-rep kind="original-media" src="${audioFileName}"/>
    </asset>
  </resources>
  <library>
    <event name="BeatMarker Event">
      <project name="BeatMarker Project">
        <sequence format="BMXRefTimelineFormat">
          <spine>
            <asset-clip ref="ASSET_BMXRefBeatmarkedClip" name="${audioFileName.replace(/\\.[^/.]+$/, '')}"
                       duration="${durationSeconds}s" audioRole="music" format="BMXRefTimelineFormat">
${markersXML}
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
  }


  /**
   * Cleanup risorse
   */
  dispose(): void {
    if (this.essentia) {
      // Essentia.js gestisce automaticamente il cleanup WebAssembly
      this.essentia = null;
      this.isInitialized = false;
      console.log('🧹 Risorse Essentia.js rilasciate');
    }
  }
}

// Singleton instance
export const beatDetectionService = new BeatDetectionService();

// Export per uso standalone
export { BeatDetectionService };
export default beatDetectionService;