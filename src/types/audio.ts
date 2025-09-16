/**
 * BeatMarkerAnalyzer - Type Definitions
 *
 * Definizioni TypeScript per audio processing e FCPXML export
 */

// File audio supportati
export type SupportedAudioFormat = 'mp3' | 'wav';

export interface AudioFileInfo {
  name: string;
  size: number; // Bytes
  format: SupportedAudioFormat;
  duration: number; // Secondi
  sampleRate: number;
  numberOfChannels: number;
  bitRate?: number; // kbps
  bitDepth?: number; // bit
  meter?: string; // es. "4/4"
}

// Beat detection
export interface BeatData {
  time: number; // Secondi
  strength: number; // 0-1
  isDownbeat: boolean;
  measurePosition: number; // Posizione nella misura (1-4 per 4/4)
}

export interface BeatAnalysisResult {
  beats: BeatData[];
  bpm: number;
  meter: string; // es. "4/4", "3/4"
  confidence: number; // 0-1
  totalBeats: number;
  downbeats: number;
  averageInterval: number; // ms
}

// Waveform visualization
export interface WaveformData {
  peaks: Float32Array;
  length: number;
  sampleRate: number;
  duration: number;
}

export interface WaveformViewport {
  start: number; // Secondi
  end: number; // Secondi
  zoomLevel: number; // 1-100
  pixelRatio: number;
}

// Audio player
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number; // Secondi
  duration: number; // Secondi
  volume: number; // 0-1
  playbackRate: number; // 0.25-4.0
}

// Export FCPXML
export interface FCPXMLMarker {
  start: string; // Format: "123.456s" o "1234/25s"
  duration: string; // Format: "0.001s"
  value: string; // Testo marker con prefissi colorazione
}

export interface MarkerData {
  start: number;            // Tempo in secondi
  value: string;           // Valore marker per FCPXML
  isDownbeat: boolean;     // Flag down-beat
  beatIndex: number;       // Indice beat globale
}

export interface FCPXMLExportOptions {
  audioFileName: string;
  audioDuration: number;
  projectName?: string;
  eventName?: string;
  includeDownbeatsOnly?: boolean;
  colorizeMarkers?: boolean;
  precision?: 'ms' | 'frame'; // Precisione timing
}

// UI States
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
  backgroundGradient: boolean;
}

export interface UIState {
  theme: ThemeConfig;
  isLoading: boolean;
  loadingMessage?: string;
  error?: string;
  showBeatMarkers: boolean;
  showWaveform: boolean;
  zoomLevel: number;
  selectedMarkers: number[]; // Indici marker selezionati
}

// Progress tracking
export interface ProcessingProgress {
  stage: 'upload' | 'decode' | 'waveform' | 'beats' | 'export';
  progress: number; // 0-100
  message: string;
  timeRemaining?: number; // Secondi
}

// Error handling
export interface AudioProcessingError {
  code: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE' | 'DECODE_ERROR' | 'BEAT_DETECTION_FAILED' | 'EXPORT_ERROR';
  message: string;
  fileName?: string;
  details?: unknown;
}

// Validation
export interface ValidationResult {
  isValid: boolean;
  error?: AudioProcessingError;
}

export interface FileValidationConstraints {
  maxSize: number; // Bytes (50MB = 52428800)
  supportedFormats: SupportedAudioFormat[];
  minDuration: number; // Secondi
  maxDuration: number; // Secondi
}

// Default constraints
export const DEFAULT_CONSTRAINTS: FileValidationConstraints = {
  maxSize: 52428800, // 50MB
  supportedFormats: ['mp3', 'wav'],
  minDuration: 5, // 5 secondi minimo
  maxDuration: 1800 // 30 minuti massimo
};

// FCPXML Constants
export const FCPXML_CONSTANTS = {
  VERSION: '1.10',
  MIN_MARKER_DURATION: '0.001s', // 1ms
  DEFAULT_AUDIO_RATE: '48000',
  FORMAT_ID: 'BMXRefTimelineFormat',
  FORMAT_NAME: 'FFVideoFormat1080p25',
  FRAME_DURATION: '1000/25000s',
  ASSET_ID_PREFIX: 'ASSET_BMXRefBeatmarkedClip'
} as const;

// Marker coloring rules per Apple FCPXML
export const MARKER_COLORS = {
  RED: '!',     // Down-beat, accenti forti
  GREEN: '?',   // Off-beat, tempi deboli
  BLUE: '/',    // Marcatori speciali
  DEFAULT: ''   // Colore di default
} as const;