/**
 * Type definitions per Essentia.js
 * Definizioni parziali per beat detection
 */

declare module 'essentia.js' {
  export interface EssentiaWASM {
    // WebAssembly module
  }

  export interface RhythmExtractorResult {
    beats: Float32Array;
    bpm: number;
    estimates: Float32Array;
    rubatoNumber: number;
    rubatoRegions: Float32Array;
  }

  export interface MeterClassifierResult {
    meter: string;
    confidence: number;
  }

  export class Essentia {
    constructor(wasmModule: EssentiaWASM);

    arrayToVector(array: Float32Array): any;

    RhythmExtractor2013(signal: any): RhythmExtractorResult;

    MeterClassifier(signal: any): MeterClassifierResult;
  }

  export const EssentiaWASM: EssentiaWASM;
}