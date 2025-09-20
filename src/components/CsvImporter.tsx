/**
 * CsvImporter - Componente per importazione CSV da Sonic Visualiser
 * Con integrazione Docker per analisi automatica
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Container, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';

import { AudioFileInfo } from '@/types/audio';
import { BeatDetectionResult, MarkerData } from '@/services/csvBeatService';
import csvBeatService from '@/services/csvBeatService';
import dockerAnalyzer from '@/services/dockerAnalyzer';
import DockerAnalyzer from '@/components/DockerAnalyzer';

interface CsvImporterProps {
  audioFile: File;
  audioInfo: AudioFileInfo;
  onImportComplete: (result: BeatDetectionResult, markers: MarkerData[]) => void;
  onError: (error: string) => void;
  onBackToUpload?: () => void;
}

type ImportPhase = 'ready' | 'processing' | 'complete' | 'error';
type AnalysisMode = 'docker' | 'upload';

interface ImportState {
  phase: ImportPhase;
  message: string;
  markersCount: number;
  bpm: number;
}

const CsvImporter: React.FC<CsvImporterProps> = ({
  audioFile,
  audioInfo,
  onImportComplete,
  onError,
  onBackToUpload
}) => {
  const [importState, setImportState] = useState<ImportState>({
    phase: 'ready',
    message: 'Choose analysis method: Docker automated or CSV upload',
    markersCount: 0,
    bpm: 0
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('docker');

  /**
   * Gestisce drop di file CSV
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleCsvFile(file);
      } else {
        setImportState({
          phase: 'error',
          message: 'Formato file non valido. Caricare un file CSV da Sonic Visualiser.',
          markersCount: 0,
          bpm: 0
        });
      }
    }
  }, []);

  /**
   * Gestisce selezione file CSV
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleCsvFile(files[0]);
    }
  };

  /**
   * Gestisce completamento analisi Docker
   */
  const handleDockerAnalysisComplete = async (csvPath: string) => {
    try {
      setImportState({
        phase: 'processing',
        message: 'Loading CSV from Docker analysis...',
        markersCount: 0,
        bpm: 0
      });

      // Leggi il file CSV generato da Docker
      // Nota: In un ambiente browser, dovremmo usare un approccio diverso
      // per accedere ai file locali. Per ora, simulo il caricamento.

      // TODO: Implementare lettura file CSV da path locale
      // Per ora, assumiamo che il CSV sia stato caricato correttamente

      const csvContent = await readCsvFromPath(csvPath);
      await processCsvContent(csvContent);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error loading Docker analysis result';
      setImportState({
        phase: 'error',
        message: errorMessage,
        markersCount: 0,
        bpm: 0
      });
      onError(errorMessage);
    }
  };

  /**
   * Legge CSV da path locale (tramite Electron)
   */
  const readCsvFromPath = async (csvPath: string): Promise<string> => {
    try {
      // Usa il servizio dockerAnalyzer per leggere il CSV
      const csvContent = await dockerAnalyzer.readCsvFromPath(csvPath);
      return csvContent;
    } catch (error) {
      console.error('Error reading CSV from path:', error);
      throw error;
    }
  };

  /**
   * Processa contenuto CSV
   */
  const processCsvContent = async (csvContent: string) => {
    // Parsifica marker beat
    const beatMarkers = await csvBeatService.parseSonicVisualiserCSV(csvContent);

    if (beatMarkers.length === 0) {
      throw new Error('Nessun marker beat trovato nel file CSV');
    }

    // Converte in BeatDetectionResult
    const detectionResult = csvBeatService.convertToDetectionResult(beatMarkers);

    // Genera marker FCPXML
    const markers = csvBeatService.generateMarkers(detectionResult);

    setImportState({
      phase: 'complete',
      message: `${markers.length} marker importati con successo!`,
      markersCount: markers.length,
      bpm: detectionResult.bpm
    });

    // Notifica parent component
    onImportComplete(detectionResult, markers);
  };

  /**
   * Processa file CSV
   */
  const handleCsvFile = async (file: File) => {
    setImportState({
      phase: 'processing',
      message: 'Elaborazione CSV in corso...',
      markersCount: 0,
      bpm: 0
    });

    try {
      // Leggi contenuto CSV
      const csvContent = await file.text();
      await processCsvContent(csvContent);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante importazione CSV';
      setImportState({
        phase: 'error',
        message: errorMessage,
        markersCount: 0,
        bpm: 0
      });
      onError(errorMessage);
    }
  };

  const getPhaseIcon = () => {
    switch (importState.phase) {
      case 'ready': return <Upload className="w-6 h-6 text-blue-500" />;
      case 'processing': return <FileText className="w-6 h-6 text-yellow-500 animate-pulse" />;
      case 'complete': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getPhaseColor = () => {
    switch (importState.phase) {
      case 'ready': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'processing': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'complete': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-primary dark:text-primary">
            Beat Detection & Import
          </h2>
        </div>
        <p className="text-sm text-secondary dark:text-secondary">
          Choose analysis method: automated Docker processing or manual CSV upload.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <button
            onClick={() => setAnalysisMode('docker')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              analysisMode === 'docker'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
            }`}
          >
            <Container className="w-4 h-4" />
            <span className="font-medium">Docker Analysis</span>
          </button>

          <div className="flex items-center">
            {analysisMode === 'docker' ? (
              <ToggleRight className="w-6 h-6 text-blue-500" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <button
            onClick={() => setAnalysisMode('upload')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              analysisMode === 'upload'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Audio Info Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">File Audio</div>
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {audioFile.name}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Durata</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {audioInfo.duration.toFixed(1)}s
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Sample Rate</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {audioInfo.sampleRate} Hz
          </div>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {analysisMode === 'docker' ? (
          <motion.div
            key="docker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DockerAnalyzer
              audioFile={audioFile}
              audioInfo={audioInfo}
              onAnalysisComplete={handleDockerAnalysisComplete}
              onError={onError}
            />
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* CSV Import Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${getPhaseColor()} ${
                isDragOver ? 'border-solid scale-102' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isDragOver ? 1.05 : 1 }}
                className="flex flex-col items-center space-y-4"
              >
                {getPhaseIcon()}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {importState.phase === 'ready' && 'Trascina CSV o clicca per selezionare'}
                    {importState.phase === 'processing' && 'Elaborazione in corso...'}
                    {importState.phase === 'complete' && 'Import completato!'}
                    {importState.phase === 'error' && 'Errore durante import'}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {importState.message}
                  </p>

                  {importState.phase === 'complete' && (
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {importState.markersCount}
                        </div>
                        <div className="text-sm text-gray-500">Marker Beat</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {importState.bpm.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">BPM Medio</div>
                      </div>
                    </div>
                  )}
                </div>

                {importState.phase === 'ready' && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <label className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium cursor-pointer transition-colors">
                      Seleziona File CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Instructions for CSV Upload */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                📋 Come esportare da Sonic Visualiser:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>1. Apri il file audio in Sonic Visualiser</li>
                <li>2. Usa "Transform → Queen Mary Beat Tracker"</li>
                <li>3. Vai su "File → Export Annotation Layer..."</li>
                <li>4. Salva in formato CSV</li>
                <li>5. Carica qui il file CSV esportato</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottone per tornare al caricamento */}
      {onBackToUpload && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToUpload}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400
                       hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700
                       rounded-lg transition-colors focus-ring"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna al caricamento file</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvImporter;