/**
 * App principale BeatMarkerAnalyzer
 * Layout responsive con gestione stato globale
 */

import React, { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Activity } from 'lucide-react';

import AudioUploader from '@/components/AudioUploader';
import AudioInfo from '@/components/AudioInfo';
import BeatAnalyzer from '@/components/BeatAnalyzer';
import ExportManager from '@/components/ExportManager';
import ThemeToggle from '@/components/ThemeToggle';

import { AudioFileInfo } from '@/types/audio';
import { BeatDetectionResult, MarkerData } from '@/services/beatDetectionService';

// Fasi dell'applicazione
type AppPhase = 'upload' | 'info' | 'analysis' | 'export';

interface AppState {
  phase: AppPhase;
  selectedFile: File | null;
  audioInfo: AudioFileInfo | null;
  beatResult: BeatDetectionResult | null;
  markers: MarkerData[] | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook per gestione stato app
 */
const useAppState = () => {
  const [state, setState] = useState<AppState>({
    phase: 'upload',
    selectedFile: null,
    audioInfo: null,
    beatResult: null,
    markers: null,
    error: null,
    isLoading: false
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return { state, updateState };
};

/**
 * Header dell'applicazione
 */
const AppHeader: React.FC = () => (
  <header className="sticky top-0 z-40 bg-app/80 backdrop-blur-sm border-b border-custom">
    <div className="max-w-6xl mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo e titolo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-primary">
              BeatMarkerAnalyzer
            </h1>
            <p className="text-sm text-secondary dark:text-secondary">
              Analisi beat per Final Cut Pro
            </p>
          </div>
        </motion.div>

        {/* Controlli header */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <ThemeToggle variant="dropdown" />
        </motion.div>
      </div>
    </div>
  </header>
);

/**
 * Breadcrumb per navigazione
 */
const AppBreadcrumb: React.FC<{ currentPhase: AppPhase }> = ({ currentPhase }) => {
  const fasi = [
    { key: 'upload' as AppPhase, label: 'Caricamento', icon: Music },
    { key: 'info' as AppPhase, label: 'Informazioni', icon: Music },
    { key: 'analysis' as AppPhase, label: 'Analisi Beat', icon: Activity },
    { key: 'export' as AppPhase, label: 'Esportazione', icon: Music }
  ];

  return (
    <nav className="max-w-6xl mx-auto px-4 py-4">
      <ol className="flex items-center space-x-2 text-sm">
        {fasi.map((fase, index) => {
          const isActive = fase.key === currentPhase;
          const isCompleted = fasi.findIndex(f => f.key === currentPhase) > index;
          const IconComponent = fase.icon;

          return (
            <React.Fragment key={fase.key}>
              <li className={`flex items-center space-x-2 ${
                isActive ? 'text-primary-600 dark:text-primary-400' :
                isCompleted ? 'text-green-600 dark:text-green-400' :
                'text-gray-400 dark:text-gray-500'
              }`}>
                <div className={`p-1 rounded ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900/30' :
                  isCompleted ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className={isActive ? 'font-medium' : ''}>{fase.label}</span>
              </li>
              {index < fasi.length - 1 && (
                <li className="text-gray-300 dark:text-gray-600">/</li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Contenuto principale basato sulla fase corrente
 */
const AppContent: React.FC<{
  state: AppState;
  onFileSelected: (file: File, info: AudioFileInfo) => void;
  onAnalysisComplete: (result: BeatDetectionResult, markers: MarkerData[]) => void;
  onBackToAnalysis: () => void;
  onStartNew: () => void;
  onContinueToAnalysis: () => void;
  onError: (error: string) => void;
}> = ({
  state,
  onFileSelected,
  onAnalysisComplete,
  onBackToAnalysis,
  onStartNew,
  onContinueToAnalysis,
  onError
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {/* Fase Upload */}
        {state.phase === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary dark:text-primary mb-2">
                Carica il tuo file audio
              </h2>
              <p className="text-secondary dark:text-secondary">
                Seleziona un file MP3 o WAV per iniziare l'analisi dei beat
              </p>
            </div>

            <AudioUploader
              onFileSelected={onFileSelected}
              onError={onError}
              isLoading={state.isLoading}
            />

            {/* Info formati supportati */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Specifiche tecniche supportate:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Formati: MP3, WAV</li>
                <li>• Dimensione massima: 50MB</li>
                <li>• Target: Solo desktop PC</li>
                <li>• Output: FCPXML v1.10+ per Final Cut Pro</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Fase Info */}
        {state.phase === 'info' && state.audioInfo && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AudioInfo fileInfo={state.audioInfo} />

            {/* Pulsante continua */}
            <div className="mt-8 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinueToAnalysis}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
                         font-medium transition-colors focus-ring"
              >
                Inizia Analisi Beat
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Fase Analysis */}
        {state.phase === 'analysis' && state.selectedFile && state.audioInfo && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BeatAnalyzer
              audioFile={state.selectedFile}
              audioInfo={state.audioInfo}
              onAnalysisComplete={onAnalysisComplete}
              onError={onError}
            />
          </motion.div>
        )}

        {/* Fase Export */}
        {state.phase === 'export' && state.selectedFile && state.audioInfo && state.beatResult && state.markers && (
          <motion.div
            key="export"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ExportManager
              audioFile={state.selectedFile}
              audioInfo={state.audioInfo}
              beatResult={state.beatResult}
              markers={state.markers}
              onBackToAnalysis={onBackToAnalysis}
              onStartNew={onStartNew}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Footer dell'applicazione
 */
const AppFooter: React.FC = () => (
  <footer className="border-t border-custom bg-gray-50 dark:bg-gray-900/50">
    <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-secondary dark:text-secondary">
      <p>
        BeatMarkerAnalyzer • Analisi beat professionale per Final Cut Pro
      </p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Powered by Adriano Visconti (c) 2025 V.1.0
      </p>
    </div>
  </footer>
);

/**
 * Componente App principale
 */
const App: React.FC = () => {
  const { state, updateState } = useAppState();

  /**
   * Gestisce la selezione del file audio
   */
  const handleFileSelected = (file: File, audioInfo: AudioFileInfo) => {
    console.log('📁 File selezionato:', file.name, audioInfo);

    updateState({
      selectedFile: file,
      audioInfo,
      phase: 'info',
      error: null
    });
  };

  /**
   * Gestisce il passaggio alla fase di analisi
   */
  const handleContinueToAnalysis = () => {
    updateState({
      phase: 'analysis',
      error: null
    });
  };

  /**
   * Gestisce il completamento dell'analisi beat
   */
  const handleAnalysisComplete = (result: BeatDetectionResult, markers: MarkerData[]) => {
    console.log('✅ Analisi completata:', { beats: result.beats.length, bpm: result.bpm });

    updateState({
      beatResult: result,
      markers,
      phase: 'export',
      error: null
    });
  };

  /**
   * Gestisce il ritorno alla fase di analisi
   */
  const handleBackToAnalysis = () => {
    updateState({
      phase: 'analysis',
      error: null
    });
  };

  /**
   * Gestisce l'avvio di una nuova sessione
   */
  const handleStartNew = () => {
    updateState({
      phase: 'upload',
      selectedFile: null,
      audioInfo: null,
      beatResult: null,
      markers: null,
      error: null,
      isLoading: false
    });
  };

  /**
   * Gestisce gli errori
   */
  const handleError = (error: string) => {
    console.error('❌ Errore app:', error);

    updateState({
      error,
      isLoading: false
    });
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <div className="min-h-screen bg-app flex flex-col">
        <AppHeader />

        {/* Breadcrumb */}
        <AppBreadcrumb currentPhase={state.phase} />

        {/* Messaggio errore globale */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto px-4"
            >
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                            rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-400 font-medium">
                  Errore: {state.error}
                </p>
                <button
                  onClick={() => updateState({ error: null })}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenuto principale */}
        <main className="flex-1">
          <AppContent
            state={state}
            onFileSelected={handleFileSelected}
            onAnalysisComplete={handleAnalysisComplete}
            onBackToAnalysis={handleBackToAnalysis}
            onStartNew={handleStartNew}
            onContinueToAnalysis={handleContinueToAnalysis}
            onError={handleError}
          />
        </main>

        <AppFooter />
      </div>
    </ThemeProvider>
  );
};

export default App;