/**
 * Componente per caricamento file audio
 * Drag & Drop con validazione e feedback visivo
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertTriangle, CheckCircle, FileAudio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { fileAudioService } from '@/services/FileAudioService';
import { AudioFileInfo, ValidationResult } from '@/types/audio';

interface AudioUploaderProps {
  onFileSelected: (file: File, fileInfo: AudioFileInfo) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Componente principale per caricamento file audio
 */
export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onFileSelected,
  onError,
  isLoading = false,
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Gestisce la selezione del file (drag & drop o click)
   */
  const handleFileSelection = useCallback(async (file: File) => {
    setIsProcessing(true);
    setValidationResult(null);

    try {
      console.log('🎵 Elaborazione file audio:', file.name);

      // Validazione file
      const validation = fileAudioService.validaFile(file);
      setValidationResult(validation);

      if (!validation.isValid) {
        onError(validation.error?.message || 'File non valido');
        return;
      }

      // Estrazione informazioni audio
      const fileInfo = await fileAudioService.estraiInformazioniAudio(file);

      console.log('✅ File caricato con successo:', fileInfo);
      onFileSelected(file, fileInfo);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il caricamento';
      console.error('❌ Errore caricamento file:', error);
      onError(errorMessage);

      setValidationResult({
        isValid: false,
        error: {
          code: 'DECODE_ERROR',
          message: errorMessage,
          fileName: file.name
        }
      });

    } finally {
      setIsProcessing(false);
    }
  }, [onFileSelected, onError]);

  /**
   * Gestione eventi drag & drop
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Solo se si sta uscendo dal componente principale
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]); // Solo il primo file
    }
  }, [handleFileSelection]);

  /**
   * Gestione click per selezione file
   */
  const handleClick = useCallback(() => {
    if (fileInputRef.current && !isLoading && !isProcessing) {
      fileInputRef.current.click();
    }
  }, [isLoading, isProcessing]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  /**
   * Reset dello stato
   */
  const handleReset = useCallback(() => {
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Determina lo stato visivo del componente
  const getDropzoneState = () => {
    if (isProcessing) return 'processing';
    if (validationResult?.isValid === false) return 'error';
    if (validationResult?.isValid === true) return 'success';
    if (isDragActive) return 'active';
    return 'idle';
  };

  const dropzoneState = getDropzoneState();

  return (
    <div className={`relative ${className}`}>
      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isLoading || isProcessing}
      />

      {/* Area drag & drop */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${dropzoneState === 'idle' ? 'border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400' : ''}
          ${dropzoneState === 'active' ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' : ''}
          ${dropzoneState === 'processing' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}
          ${dropzoneState === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
          ${dropzoneState === 'success' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
          ${isLoading || isProcessing ? 'cursor-not-allowed opacity-75' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={{ scale: isLoading || isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isLoading || isProcessing ? 1 : 0.98 }}
      >
        {/* Icona e testo principale */}
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            animate={{
              scale: dropzoneState === 'active' ? 1.1 : 1,
              rotate: isProcessing ? 360 : 0
            }}
            transition={{
              rotate: { duration: 1, repeat: isProcessing ? Infinity : 0, ease: "linear" }
            }}
          >
            {dropzoneState === 'processing' && <Upload className="w-12 h-12 text-yellow-500" />}
            {dropzoneState === 'error' && <AlertTriangle className="w-12 h-12 text-red-500" />}
            {dropzoneState === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
            {(dropzoneState === 'idle' || dropzoneState === 'active') && (
              <FileAudio className={`w-12 h-12 ${dropzoneState === 'active' ? 'text-primary-500' : 'text-gray-400'}`} />
            )}
          </motion.div>

          <div className="space-y-2">
            {dropzoneState === 'processing' && (
              <p className="text-lg font-medium text-yellow-700 dark:text-yellow-300">
                Elaborazione file audio...
              </p>
            )}

            {dropzoneState === 'error' && validationResult?.error && (
              <div className="space-y-2">
                <p className="text-lg font-medium text-red-700 dark:text-red-300">
                  Errore caricamento file
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationResult.error.message}
                </p>
              </div>
            )}

            {dropzoneState === 'success' && (
              <p className="text-lg font-medium text-green-700 dark:text-green-300">
                File caricato con successo!
              </p>
            )}

            {(dropzoneState === 'idle' || dropzoneState === 'active') && (
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {dropzoneState === 'active'
                    ? 'Rilascia il file qui'
                    : 'Trascina un file audio qui'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  oppure clicca per selezionare
                </p>
              </div>
            )}
          </div>

          {/* Formati supportati */}
          {(dropzoneState === 'idle' || dropzoneState === 'active') && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Formati supportati: MP3, WAV • Dimensione massima: 50MB
            </div>
          )}
        </div>

        {/* Pulsante reset per errori */}
        <AnimatePresence>
          {dropzoneState === 'error' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="absolute top-3 right-3 p-2 rounded-full bg-red-100 dark:bg-red-900/30
                       hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Indicatore di caricamento */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Analisi file audio...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioUploader;