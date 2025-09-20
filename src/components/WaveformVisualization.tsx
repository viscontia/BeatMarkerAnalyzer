/**
 * WaveformVisualization - Componente per visualizzazione waveform con marcatori beat
 *
 * Funzionalità:
 * - Rendering waveform con react-audio-visualize
 * - Overlay marcatori beat sincronizzati
 * - Mini-player integrato con seek
 * - Zoom e scroll orizzontale
 * - Cursore di posizione tempo reale
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, ZoomIn, ZoomOut, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import { AudioVisualizer } from 'react-audio-visualize';

import { BeatDetectionResult, MarkerData } from '@/services/csvBeatService';
import { AudioFileInfo } from '@/types/audio';

interface WaveformVisualizationProps {
  audioFile: File;
  audioInfo: AudioFileInfo;
  beatResult: BeatDetectionResult;
  markers: MarkerData[];
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  audioFile,
  beatResult,
  markers
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollUpdateRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);

  // Configurazione visualizzazione
  const waveformHeight = 160;

  /**
   * Osserva le dimensioni del container per sizing responsivo
   */
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Sottrai padding del container (6 * 1.5rem = 144px circa)
        const availableWidth = Math.max(400, width - 48); // Minimo 400px
        setContainerWidth(availableWidth);
      }
    });

    if (waveformContainerRef.current) {
      resizeObserver.observe(waveformContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Inizializza audio element e blob
   */
  useEffect(() => {
    const initializeAudio = async () => {
      setIsLoading(true);

      // Crea blob dal file
      const blob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
      setAudioBlob(blob);

      // Crea audio element
      const audio = new Audio(URL.createObjectURL(blob));
      audio.preload = 'metadata';
      audioRef.current = audio;

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        URL.revokeObjectURL(audio.src);
      };
    };

    initializeAudio();
  }, [audioFile, containerWidth]);

  /**
   * Auto-scroll per seguire il playhead durante la riproduzione in zoom
   */
  useEffect(() => {
    if (!isAutoScrolling || !isPlaying || !duration || isUserScrolling || zoomLevel <= 1) return;

    const container = waveformContainerRef.current;
    if (!container) return;

    const currentTimeRatio = currentTime / duration;
    const playheadX = currentTimeRatio * containerWidth; // Posizione base del playhead
    const playheadXScaled = playheadX * zoomLevel; // Posizione scalata
    const currentScrollLeft = container.scrollLeft;
    const viewportStart = currentScrollLeft;
    const viewportEnd = currentScrollLeft + containerWidth;

    // Evita aggiornamenti troppo frequenti
    const now = Date.now();
    if (now - lastScrollUpdateRef.current < 100) return; // Massimo 10 aggiornamenti al secondo

    let shouldScroll = false;
    let newScrollLeft = currentScrollLeft;

    // Buffer per iniziare lo scroll prima del bordo (20% del viewport)
    const scrollBuffer = containerWidth * 0.2;

    // Se il playhead è fuori dal viewport a destra
    if (playheadXScaled > viewportEnd) {
      newScrollLeft = playheadXScaled - containerWidth * 0.3; // Posiziona il playhead al 30% del viewport
      shouldScroll = true;
    }
    // Se il playhead è fuori dal viewport a sinistra
    else if (playheadXScaled < viewportStart) {
      newScrollLeft = Math.max(0, playheadXScaled - containerWidth * 0.3);
      shouldScroll = true;
    }
    // Se il playhead si avvicina al bordo destro (buffer zone)
    else if (playheadXScaled > viewportEnd - scrollBuffer) {
      newScrollLeft = playheadXScaled - containerWidth * 0.3;
      shouldScroll = true;
    }

    // Aggiorna solo se c'è una differenza significativa
    if (shouldScroll && Math.abs(newScrollLeft - currentScrollLeft) > 1) {
      container.scrollLeft = newScrollLeft;
      // Aggiorna anche scrollPosition per coerenza con lo slider
      const maxScroll = containerWidth * zoomLevel - containerWidth;
      setScrollPosition(maxScroll > 0 ? newScrollLeft / maxScroll : 0);
      lastScrollUpdateRef.current = now;
    }
  }, [currentTime, duration, zoomLevel, isAutoScrolling, isPlaying, isUserScrolling, containerWidth]);

  /**
   * Gestisce shortcut da tastiera
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Evita conflitti con input fields o elementi focusabili
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault(); // Previene scroll della pagina
          togglePlayback();
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            event.preventDefault();
            skipBackward();
          }
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            event.preventDefault();
            skipForward();
          }
          break;
      }
    };

    // Aggiungi listener globale
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]); // Dipende da isPlaying per il toggle

  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const container = waveformContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Con scaleX, dobbiamo considerare lo zoom e lo scroll
    const scrollLeft = container.scrollLeft;
    const actualX = (x + scrollLeft) / zoomLevel; // Dividiamo per il zoom per ottenere la posizione reale
    const clickRatio = actualX / containerWidth;
    const newTime = clickRatio * duration;

    audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));

    // Disabilita temporaneamente auto-scroll dopo seek manuale
    setIsUserScrolling(true);
    setIsAutoScrolling(false);
    setTimeout(() => {
      setIsUserScrolling(false);
      setIsAutoScrolling(true);
    }, 1500); // Ridotto a 1.5s per riprendere più velocemente l'auto-scroll
  };

  /**
   * Controlli playback
   */
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  };

  /**
   * Controlli zoom
   */
  const zoomIn = () => setZoomLevel(prev => Math.min(prev * 2, 8));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev / 2, 1));
  const zoomToFit = () => {
    setZoomLevel(1);
    setScrollPosition(0);
    setIsAutoScrolling(true);
  };

  /**
   * Formatta tempo per display
   */
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-custom p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primary dark:text-primary">
          Visualizzazione Waveform
        </h3>

        {/* Controlli zoom e auto-scroll */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-sm text-gray-500 min-w-[60px] text-center">
            {zoomLevel}x
          </span>

          <button
            onClick={zoomIn}
            disabled={zoomLevel >= 8}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={zoomToFit}
            className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400
                     hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors"
            title="Zoom to Fit - Visualizza tutto il brano"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              isAutoScrolling
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            } hover:opacity-80`}
            title={isAutoScrolling ? 'Auto-scroll attivo' : 'Auto-scroll disattivato'}
          >
            {isAutoScrolling ? '🔄' : '⏸️'}
          </button>
        </div>
      </div>

      {/* Waveform con react-audio-visualize */}
      <div
        ref={waveformContainerRef}
        className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto overflow-y-hidden mb-4 cursor-pointer"
        onClick={handleWaveformClick}
        style={{
          height: `${waveformHeight + 40}px`
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-sm text-gray-500">Caricamento waveform...</p>
            </div>
          </div>
        ) : audioBlob ? (
          <div
            className="relative h-full flex items-center justify-start"
            style={{
              width: `${containerWidth * zoomLevel}px`,
              minWidth: `${containerWidth * zoomLevel}px`,
              transform: `scaleX(${zoomLevel})`,
              transformOrigin: 'left center'
            }}
          >
            <AudioVisualizer
              blob={audioBlob}
              width={containerWidth}
              height={waveformHeight}
              barWidth={2}
              gap={1}
              barColor={'#3B82F6'}
            />

            {/* Overlay markers beat */}
            <div className="absolute inset-0 pointer-events-none">
              {markers.map((marker, index) => {
                const timeRatio = marker.start / duration;
                const x = timeRatio * containerWidth;

                return (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-80"
                    style={{ left: `${x}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-500 bg-white dark:bg-gray-800 px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                );
              })}

              {/* Playhead cursor */}
              {duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                  style={{
                    left: `${(currentTime / duration) * containerWidth}px`
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Impossibile caricare waveform
          </div>
        )}
      </div>

      {/* Scroll Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Navigazione Timeline
          </span>
          <span className="text-xs text-gray-400">
            Viewport: {Math.round(scrollPosition * 100)}% - {Math.round((scrollPosition + 1/zoomLevel) * 100)}%
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max={Math.max(0, 1 - 1/zoomLevel)}
            step="0.001"
            value={scrollPosition}
            onMouseDown={() => setIsUserScrolling(true)}
            onMouseUp={() => {
              setIsUserScrolling(false);
              setIsAutoScrolling(false);
              setTimeout(() => setIsAutoScrolling(true), 2000); // Ridotto a 2s per lo scroll manuale
            }}
            onChange={(e) => {
              const newScrollPosition = parseFloat(e.target.value);
              setScrollPosition(newScrollPosition);
              // Aggiorna anche scrollLeft del container
              const container = waveformContainerRef.current;
              if (container) {
                const maxScroll = containerWidth * zoomLevel - containerWidth;
                container.scrollLeft = newScrollPosition * maxScroll;
              }
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                     slider:bg-blue-500 slider:rounded-lg slider:border-0 slider:appearance-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Timeline markers */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0:00</span>
            <span className="text-blue-500">
              {isAutoScrolling ? '🔄 Auto' : '🖱️ Manuale'}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Playback controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={skipBackward}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayback}
            className="p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={skipForward}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>

        {/* Time display */}
        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Beat info e controlli */}
      <div className="mt-4 space-y-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-blue-900 dark:text-blue-300">
                Beat rilevati: {beatResult.beats.length}
              </span>
              <span className="text-blue-700 dark:text-blue-400 ml-4">
                Battute: {markers.length}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-blue-700 dark:text-blue-400">
              <span>🔴 = Inizio battuta (Downbeat)</span>
              <span>🟡 = Playhead</span>
            </div>
          </div>
        </div>

        {/* Controlli da tastiera */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Space</kbd>
              <span className="text-gray-600 dark:text-gray-400">Play/Pause</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Shift</kbd>
                <span className="text-gray-500">+</span>
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">←</kbd>
                <span className="text-gray-600 dark:text-gray-400">-10s</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Shift</kbd>
                <span className="text-gray-500">+</span>
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">→</kbd>
                <span className="text-gray-600 dark:text-gray-400">+10s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveformVisualization;