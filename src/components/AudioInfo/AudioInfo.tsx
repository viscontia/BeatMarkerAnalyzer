/**
 * Componente per visualizzazione informazioni tecniche audio
 * Layout a 6 card con icone Lucide React
 */

import React from 'react';
import { Clock, Volume2, Zap, Cpu, Music, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

import { AudioFileInfo } from '@/types/audio';
import { fileAudioService } from '@/services/FileAudioService';

interface AudioInfoProps {
  fileInfo: AudioFileInfo;
  className?: string;
}

/**
 * Singola card informativa
 */
interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  delay?: number;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  label,
  value,
  description,
  delay = 0
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-surface dark:bg-surface p-4 rounded-lg shadow-custom border border-custom
               hover:shadow-lg dark:hover:shadow-xl transition-all duration-200
               hover:scale-105"
  >
    <div className="flex items-start space-x-3">
      {/* Icona */}
      <div className="flex-shrink-0 p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
        <div className="text-primary-600 dark:text-primary-400">
          {icon}
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary dark:text-secondary">
          {label}
        </p>
        <p className="text-lg font-semibold text-primary dark:text-primary truncate">
          {value}
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

/**
 * Componente principale per informazioni audio
 */
export const AudioInfo: React.FC<AudioInfoProps> = ({
  fileInfo,
  className = ''
}) => {
  /**
   * Prepara i dati per le 6 card informative
   */
  const preparaInformazioniCard = (): InfoCardProps[] => {
    return [
      {
        icon: <Clock className="w-5 h-5" />,
        label: 'Durata',
        value: fileAudioService.formattaDurata(fileInfo.duration),
        description: `${fileInfo.duration.toFixed(1)} secondi totali`,
        delay: 0
      },
      {
        icon: <Volume2 className="w-5 h-5" />,
        label: 'Canali Audio',
        value: fileInfo.numberOfChannels === 1 ? 'Mono' : fileInfo.numberOfChannels === 2 ? 'Stereo' : `${fileInfo.numberOfChannels} canali`,
        description: `${fileInfo.numberOfChannels} ${fileInfo.numberOfChannels === 1 ? 'canale' : 'canali'}`,
        delay: 0.1
      },
      {
        icon: <Zap className="w-5 h-5" />,
        label: 'Sample Rate',
        value: `${(fileInfo.sampleRate / 1000).toFixed(1)} kHz`,
        description: `${fileInfo.sampleRate} Hz`,
        delay: 0.2
      },
      {
        icon: <Cpu className="w-5 h-5" />,
        label: 'Bit Rate',
        value: fileInfo.bitRate ? `${Math.round(fileInfo.bitRate)} kbps` : 'N/A',
        description: fileInfo.bitRate ? 'Qualità audio' : 'Non disponibile',
        delay: 0.3
      },
      {
        icon: <Music className="w-5 h-5" />,
        label: 'Formato Audio',
        value: fileInfo.format.toUpperCase(),
        description: `File ${fileInfo.format}`,
        delay: 0.4
      },
      {
        icon: <HardDrive className="w-5 h-5" />,
        label: 'Dimensioni File',
        value: fileAudioService.formattaDimensioneFile(fileInfo.size),
        description: `${fileInfo.size.toLocaleString()} bytes`,
        delay: 0.5
      }
    ];
  };

  const cardData = preparaInformazioniCard();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Titolo sezione */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h2 className="text-xl font-semibold text-primary dark:text-primary">
          Informazioni Audio
        </h2>
        <div className="flex items-center space-x-2 text-sm text-secondary dark:text-secondary">
          <Music className="w-4 h-4" />
          <span>{fileInfo.name}</span>
        </div>
      </motion.div>

      {/* Grid delle card informative */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardData.map((card, index) => (
          <InfoCard
            key={`${card.label}-${index}`}
            {...card}
          />
        ))}
      </div>

      {/* Informazioni aggiuntive */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-custom"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="font-medium text-secondary dark:text-secondary">Bit Depth</span>
            <p className="text-primary dark:text-primary">
              {fileInfo.bitDepth ? `${fileInfo.bitDepth} bit` : 'Non disponibile'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-medium text-secondary dark:text-secondary">Compatibilità</span>
            <p className="text-primary dark:text-primary">
              Final Cut Pro X/11
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-medium text-secondary dark:text-secondary">Stato</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-green-600 dark:text-green-400">Pronto per analisi</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AudioInfo;