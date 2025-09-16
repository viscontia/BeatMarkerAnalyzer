/**
 * ExportManager - Componente per esportazione FCPXML
 * Gestisce la generazione e download del file FCPXML con marker beat
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  CheckCircle,
  Info,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Music,
  Target,
  Clock
} from 'lucide-react';

import { AudioFileInfo } from '@/types/audio';
import { BeatDetectionResult, MarkerData } from '@/services/beatDetectionService';
import beatDetectionService from '@/services/beatDetectionService';
import fileAudioService from '@/services/FileAudioService';

interface ExportManagerProps {
  audioFile: File;
  audioInfo: AudioFileInfo;
  beatResult: BeatDetectionResult;
  markers: MarkerData[];
  onBackToAnalysis: () => void;
  onStartNew: () => void;
}

const ExportManager: React.FC<ExportManagerProps> = ({
  audioInfo,
  beatResult,
  markers,
  onBackToAnalysis,
  onStartNew
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [showXMLPreview, setShowXMLPreview] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Genera XML FCPXML
  const fcpxmlContent = useMemo(() => {
    return beatDetectionService.generateFCPXML(
      markers,
      audioInfo.name,
      audioInfo.duration
    );
  }, [markers, audioInfo]);

  // Nome file FCPXML
  const fcpxmlFileName = useMemo(() => {
    return fileAudioService.generaNomeFileFCPXML(audioInfo.name);
  }, [audioInfo.name]);

  // Statistiche risultati
  const stats = useMemo(() => {
    const totalBeats = beatResult.beats.length;
    const totalDownbeats = beatResult.downbeats.length;
    const avgInterval = beatResult.beatIntervals.length > 0
      ? beatResult.beatIntervals.reduce((a, b) => a + b, 0) / beatResult.beatIntervals.length
      : 0;

    return {
      totalBeats,
      totalDownbeats,
      avgInterval: Math.round(avgInterval * 1000) / 1000, // 3 decimali
      bpm: beatResult.bpm,
      meter: beatResult.meter,
      confidence: Math.round(beatResult.confidence * 100)
    };
  }, [beatResult]);

  /**
   * Gestisce l'esportazione del file FCPXML
   */
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simula tempo di generazione per UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Crea Blob con contenuto FCPXML
      const blob = new Blob([fcpxmlContent], {
        type: 'application/xml;charset=utf-8'
      });

      // Crea URL e trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fcpxmlFileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup URL
      URL.revokeObjectURL(url);

      setExportComplete(true);
      console.log('✅ File FCPXML esportato:', fcpxmlFileName);

    } catch (error) {
      console.error('❌ Errore durante esportazione:', error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Copia XML negli appunti
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fcpxmlContent);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('❌ Errore copia clipboard:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header sezione */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary dark:text-primary mb-2">
          Esportazione FCPXML
        </h2>
        <p className="text-secondary dark:text-secondary">
          File pronto per l'importazione in Final Cut Pro
        </p>
      </div>

      {/* Risultati analisi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6 mb-6">
        <h3 className="font-semibold text-primary dark:text-primary mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Risultati Beat Detection
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Beat */}
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Music className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalBeats}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">Beat Totali</p>
          </div>

          {/* Down-beat */}
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.totalDownbeats}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">Down-beat</p>
          </div>

          {/* BPM */}
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.bpm}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">BPM</p>
          </div>

          {/* Metrica */}
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.meter}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300">Metrica</p>
          </div>

          {/* Confidenza */}
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.confidence}%
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">Confidenza</p>
          </div>

          {/* Intervallo medio */}
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Info className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.avgInterval}s
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">Intervallo</p>
          </div>
        </div>
      </div>

      {/* Informazioni file output */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6 mb-6">
        <h3 className="font-semibold text-primary dark:text-primary mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          File di Output
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Info file */}
          <div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome File FCPXML</p>
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                  {fcpxmlFileName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marker Generati</p>
                <p className="font-medium">{markers.length} marker beat</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Versione FCPXML</p>
                <p className="font-medium">v1.10 (Final Cut Pro X 10.4+)</p>
              </div>
            </div>
          </div>

          {/* Preview XML */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Anteprima XML</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowXMLPreview(!showXMLPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  {showXMLPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showXMLPreview ? 'Nascondi' : 'Mostra'}
                </button>
                <button
                  onClick={copyToClipboard}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copiedToClipboard ? 'Copiato!' : 'Copia'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showXMLPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-32 overflow-y-auto font-mono">
                    {fcpxmlContent.substring(0, 500)}...
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Istruzioni installazione */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Istruzioni per Final Cut Pro
        </h4>

        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>1.</strong> Salva il file FCPXML nella stessa directory del file audio originale</p>
          <p><strong>2.</strong> Apri Final Cut Pro e vai su <strong>File → Import → Media...</strong></p>
          <p><strong>3.</strong> Seleziona il file FCPXML scaricato</p>
          <p><strong>4.</strong> I marker beat appariranno automaticamente sulla timeline</p>
          <p><strong>5.</strong> I down-beat saranno evidenziati in rosso, gli off-beat in verde</p>
        </div>

        <div className="mt-4 flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
          <ExternalLink className="w-4 h-4" />
          <span>Compatibile con Final Cut Pro X 10.4 e versioni successive</span>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Pulsante Export */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={isExporting}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-ring shadow-lg hover:shadow-xl ${
            exportComplete
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            {isExporting ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generazione...</span>
              </>
            ) : exportComplete ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>Download Completato</span>
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                <span>Scarica FCPXML</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Pulsanti secondari */}
        <div className="flex space-x-3">
          <button
            onClick={onBackToAnalysis}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                     transition-colors focus-ring"
          >
            Torna ad Analisi
          </button>

          <button
            onClick={onStartNew}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                     transition-colors focus-ring"
          >
            Nuovo File
          </button>
        </div>
      </div>

      {/* Messaggio successo */}
      <AnimatePresence>
        {exportComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center"
          >
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ File FCPXML scaricato con successo!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Puoi ora importarlo in Final Cut Pro per utilizzare i marker beat
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportManager;