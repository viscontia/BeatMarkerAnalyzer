/**
 * BeatAnalyzer - Componente per analisi beat audio
 * Interfaccia utente per il processo di beat detection
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Play, Pause, Volume2, BarChart3, Clock, Target } from 'lucide-react';

import { AudioFileInfo } from '@/types/audio';
import { BeatDetectionResult, MarkerData } from '@/services/beatDetectionService';
import beatDetectionService from '@/services/beatDetectionService';
import fileAudioService from '@/services/FileAudioService';

interface BeatAnalyzerProps {
  audioFile: File;
  audioInfo: AudioFileInfo;
  onAnalysisComplete: (result: BeatDetectionResult, markers: MarkerData[]) => void;
  onError: (error: string) => void;
}

type AnalysisPhase = 'init' | 'loading' | 'analyzing' | 'processing' | 'complete' | 'error';

interface AnalysisProgress {
  phase: AnalysisPhase;
  percentage: number;
  message: string;
}

const BeatAnalyzer: React.FC<BeatAnalyzerProps> = ({
  audioFile,
  audioInfo,
  onAnalysisComplete,
  onError
}) => {
  const [progress, setProgress] = useState<AnalysisProgress>({
    phase: 'init',
    percentage: 0,
    message: 'Pronto per iniziare l\'analisi'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Crea preview audio per test
    const audio = new Audio(URL.createObjectURL(audioFile));
    audio.volume = 0.3;
    setAudioPreview(audio);

    return () => {
      if (audio) {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      }
    };
  }, [audioFile]);

  /**
   * Gestisce play/pause preview audio
   */
  const togglePreview = () => {
    if (!audioPreview) return;

    if (isPlaying) {
      audioPreview.pause();
    } else {
      audioPreview.currentTime = 0;
      audioPreview.play();
    }
    setIsPlaying(!isPlaying);
  };

  /**
   * Avvia l'analisi del beat
   */
  const startAnalysis = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setProgress({
      phase: 'loading',
      percentage: 10,
      message: 'Inizializzazione motore beat detection...'
    });

    try {
      // Inizializza Essentia.js
      await beatDetectionService.initialize();

      setProgress({
        phase: 'analyzing',
        percentage: 30,
        message: 'Conversione file audio in corso...'
      });

      // Converti file in AudioBuffer
      const audioBuffer = await fileAudioService.convertiInAudioBuffer(audioFile);

      setProgress({
        phase: 'analyzing',
        percentage: 50,
        message: 'Analisi beat patterns in corso...'
      });

      // Estrai beat
      const beatResult = await beatDetectionService.extractBeats(audioBuffer);

      setProgress({
        phase: 'processing',
        percentage: 80,
        message: 'Generazione marker FCPXML...'
      });

      // Genera marker per FCPXML
      const markers = beatDetectionService.generateMarkers(beatResult);

      setProgress({
        phase: 'complete',
        percentage: 100,
        message: `Analisi completata! Trovati ${beatResult.beats.length} beat`
      });

      // Callback con risultati
      onAnalysisComplete(beatResult, markers);

    } catch (error) {
      console.error('❌ Errore durante analisi:', error);
      setProgress({
        phase: 'error',
        percentage: 0,
        message: error instanceof Error ? error.message : 'Errore sconosciuto durante l\'analisi'
      });
      onError(error instanceof Error ? error.message : 'Errore durante l\'analisi del beat');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Icona fase corrente
   */
  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'init': return Activity;
      case 'loading': return Clock;
      case 'analyzing': return BarChart3;
      case 'processing': return Target;
      case 'complete': return Target;
      default: return Activity;
    }
  };

  const PhaseIcon = getPhaseIcon();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header sezione */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary dark:text-primary mb-2">
          Analisi Beat Audio
        </h2>
        <p className="text-secondary dark:text-secondary">
          Estrazione automatica dei beat per Final Cut Pro
        </p>
      </div>

      {/* Info file audio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary dark:text-primary">
            File Audio Selezionato
          </h3>

          {/* Preview audio */}
          <button
            onClick={togglePreview}
            disabled={isAnalyzing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isAnalyzing
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isPlaying ? 'Pausa' : 'Anteprima'}
            </span>
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Nome</p>
            <p className="font-medium truncate">{audioInfo.name}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Durata</p>
            <p className="font-medium">{fileAudioService.formattaDurata(audioInfo.duration)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Formato</p>
            <p className="font-medium uppercase">{audioInfo.format}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Dimensione</p>
            <p className="font-medium">{fileAudioService.formattaDimensioneFile(audioInfo.size)}</p>
          </div>
        </div>
      </div>

      {/* Progress analisi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              progress.phase === 'complete' ? 'bg-green-100 dark:bg-green-900/30' :
              progress.phase === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
              isAnalyzing ? 'bg-blue-100 dark:bg-blue-900/30' :
              'bg-gray-100 dark:bg-gray-800'
            }`}>
              <PhaseIcon className={`w-5 h-5 ${
                progress.phase === 'complete' ? 'text-green-600 dark:text-green-400' :
                progress.phase === 'error' ? 'text-red-600 dark:text-red-400' :
                isAnalyzing ? 'text-blue-600 dark:text-blue-400' :
                'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold">Stato Analisi</h3>
              <p className="text-sm text-secondary dark:text-secondary">
                {progress.message}
              </p>
            </div>
          </div>

          {progress.phase === 'complete' && (
            <div className="text-right">
              <p className="text-green-600 dark:text-green-400 font-semibold">
                ✅ Completata
              </p>
            </div>
          )}
        </div>

        {/* Barra di progress */}
        {isAnalyzing && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {progress.percentage}% completato
            </p>
          </div>
        )}
      </div>

      {/* Pulsante avvio analisi */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {progress.phase === 'init' && (
            <motion.button
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400
                       text-white rounded-lg font-semibold text-lg transition-colors
                       focus-ring shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6" />
                <span>Inizia Analisi Beat</span>
              </div>
            </motion.button>
          )}

          {progress.phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center space-x-2 text-green-600 dark:text-green-400 font-semibold">
                <Target className="w-5 h-5" />
                <span>Analisi completata con successo!</span>
              </div>
              <p className="text-sm text-secondary dark:text-secondary mt-2">
                Puoi procedere alla fase di esportazione
              </p>
            </motion.div>
          )}

          {progress.phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <button
                onClick={startAnalysis}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg
                         font-medium transition-colors focus-ring"
              >
                Riprova Analisi
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info tecnica */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          Algoritmi di Beat Detection:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• <strong>RhythmExtractor2013</strong>: Algoritmo Essentia per beat tracking avanzato</li>
          <li>• <strong>MeterClassifier</strong>: Classificazione automatica metrica musicale (4/4, 3/4, etc.)</li>
          <li>• <strong>Down-beat Detection</strong>: Identificazione automatica primi tempi di battuta</li>
          <li>• <strong>FCPXML v1.10+</strong>: Compatibilità completa con Final Cut Pro</li>
        </ul>
      </div>
    </div>
  );
};

export default BeatAnalyzer;