/**
 * DockerAnalyzer - Componente per analisi beat via Docker sonic-annotator
 * Gestisce progress e stato dell'analisi automatica
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Container,
  Play,
  CheckCircle,
  AlertCircle,
  Download,
  Loader
} from 'lucide-react';

import { AudioFileInfo } from '@/types/audio';
import dockerAnalyzer, { DockerAnalysisProgress, DockerAnalysisResult } from '@/services/dockerAnalyzer';

interface DockerAnalyzerProps {
  audioFile: File;
  audioInfo: AudioFileInfo;
  onAnalysisComplete: (csvPath: string) => void;
  onError: (error: string) => void;
}

const DockerAnalyzer: React.FC<DockerAnalyzerProps> = ({
  audioFile,
  audioInfo,
  onAnalysisComplete,
  onError
}) => {
  const [progress, setProgress] = useState<DockerAnalysisProgress>({
    phase: 'starting',
    percentage: 0,
    message: 'Ready to analyze with Docker Sonic Annotator'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dockerAvailable, setDockerAvailable] = useState<boolean | null>(null);

  /**
   * Verifica availability Docker
   */
  React.useEffect(() => {
    const checkDocker = async () => {
      const available = await dockerAnalyzer.checkDockerAvailability();
      setDockerAvailable(available);
    };
    checkDocker();
  }, []);

  /**
   * Avvia analisi Docker
   */
  const startDockerAnalysis = async () => {
    if (isAnalyzing || !dockerAvailable) return;

    setIsAnalyzing(true);
    setProgress({
      phase: 'starting',
      percentage: 0,
      message: 'Initializing Docker Sonic Annotator...'
    });

    try {
      const result: DockerAnalysisResult = await dockerAnalyzer.runSonicAnnotator(
        audioFile,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      if (result.success && result.csvPath) {
        setProgress({
          phase: 'complete',
          percentage: 100,
          message: 'Beat analysis completed successfully!',
          csvPath: result.csvPath
        });

        // Callback con path CSV generato
        onAnalysisComplete(result.csvPath);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Docker analysis failed';
      console.error('Docker analysis error:', error);

      setProgress({
        phase: 'error',
        percentage: 0,
        message: errorMessage
      });

      onError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };


  /**
   * Icona fase corrente
   */
  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'starting':
        return Container;
      case 'analyzing':
        return Loader;
      case 'complete':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      default:
        return Container;
    }
  };

  /**
   * Colore fase corrente
   */
  const getPhaseColor = () => {
    switch (progress.phase) {
      case 'starting':
        return 'text-blue-500';
      case 'analyzing':
        return 'text-yellow-500';
      case 'complete':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const PhaseIcon = getPhaseIcon();

  if (dockerAvailable === false) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="font-semibold text-red-900 dark:text-red-300">
            Sonic Annotator Non Disponibile
          </h3>
        </div>
        <div className="text-sm text-red-800 dark:text-red-200 space-y-2">
          <p>Sonic Annotator non è disponibile. Verifica che sia installato nella directory del progetto.</p>
          <div className="mt-4">
            <a
              href="https://vamp-plugins.org/sonic-annotator/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Scarica Sonic Annotator
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Container className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-primary dark:text-primary">
            Sonic Annotator Beat Analysis
          </h2>
        </div>
        <p className="text-sm text-secondary dark:text-secondary">
          Automatic beat detection using Sonic Annotator with Vamp plugins.
        </p>
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

      {/* Progress Area */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              progress.phase === 'complete' ? 'bg-green-100 dark:bg-green-900/30' :
              progress.phase === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
              isAnalyzing ? 'bg-blue-100 dark:bg-blue-900/30' :
              'bg-gray-100 dark:bg-gray-800'
            }`}>
              <PhaseIcon className={`w-5 h-5 ${getPhaseColor()} ${
                progress.phase === 'analyzing' ? 'animate-spin' : ''
              }`} />
            </div>
            <div>
              <h3 className="font-semibold">Analysis Status</h3>
              <p className="text-sm text-secondary dark:text-secondary">
                {progress.message}
              </p>
            </div>
          </div>

          {progress.phase === 'complete' && (
            <div className="text-right">
              <p className="text-green-600 dark:text-green-400 font-semibold">
                ✅ Completed
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {progress.percentage}%
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        {!isAnalyzing && progress.phase !== 'complete' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startDockerAnalysis}
            disabled={!dockerAvailable}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors focus-ring"
          >
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Start Analysis</span>
            </div>
          </motion.button>
        )}

        {isAnalyzing && (
          <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="font-medium">Running beat detection...</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default DockerAnalyzer;