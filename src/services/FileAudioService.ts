/**
 * Servizio per gestione file audio
 * Validazione, analisi metadati e preparazione per processing
 */

import { AudioFileInfo, SupportedAudioFormat, ValidationResult, DEFAULT_CONSTRAINTS } from '@/types/audio';

/**
 * Classe per gestione e validazione file audio
 */
export class FileAudioService {
  private readonly SUPPORTED_FORMATS: SupportedAudioFormat[] = ['mp3', 'wav'];
  private readonly MAX_FILE_SIZE = DEFAULT_CONSTRAINTS.maxSize; // 100MB

  /**
   * Valida un file audio secondo le specifiche del progetto
   */
  public validaFile(file: File): ValidationResult {
    // Controllo formato
    const formato = this.estraiFormatoFile(file.name);
    if (!formato) {
      return {
        isValid: false,
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: `Formato non supportato. Utilizzare solo: ${this.SUPPORTED_FORMATS.join(', ')}`,
          fileName: file.name
        }
      };
    }

    // Controllo dimensione
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      const maxMB = Math.round(this.MAX_FILE_SIZE / (1024 * 1024));

      return {
        isValid: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File troppo grande (${sizeMB}MB). Dimensione massima: ${maxMB}MB`,
          fileName: file.name
        }
      };
    }

    // Controllo nome file
    if (!this.validaNomeFile(file.name)) {
      return {
        isValid: false,
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: 'Nome file contiene caratteri non supportati',
          fileName: file.name
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Converte un File in AudioBuffer per il processing
   */
  public async convertiInAudioBuffer(file: File): Promise<AudioBuffer> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Cleanup AudioContext per evitare memory leak
      await audioContext.close();

      console.log('✅ Audio decodificato:', {
        durata: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        canali: audioBuffer.numberOfChannels
      });

      return audioBuffer;

    } catch (error) {
      console.error('❌ Errore decodifica audio:', error);
      throw new Error('Impossibile decodificare il file audio. Verificare che sia un file audio valido.');
    }
  }

  /**
   * Estrae informazioni tecniche dal file audio
   */
  public async estraiInformazioniAudio(file: File): Promise<AudioFileInfo> {
    const audioBuffer = await this.convertiInAudioBuffer(file);
    const formato = this.estraiFormatoFile(file.name)!;

    // Calcola bitrate approssimativo
    const bitRate = this.calcolaBitRate(file.size, audioBuffer.duration);

    return {
      name: file.name,
      size: file.size,
      format: formato,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      bitRate,
      bitDepth: this.stimaBitDepth(audioBuffer.sampleRate, bitRate)
    };
  }

  /**
   * Ottiene il percorso della directory del file caricato
   * IMPORTANTE: Per FCPXML, il file XML deve essere nella stessa directory dell'audio
   */
  public ottieniPercorsoDirectory(_file: File): string {
    // In ambiente browser, non possiamo accedere al path completo per sicurezza
    // Dobbiamo basarci sulla funzionalità di download del browser
    // che salverà nella directory predefinita

    // Nota: Dobbiamo istruire l'utente a salvare manualmente nella stessa directory
    return ''; // Path non disponibile in browser per sicurezza
  }

  /**
   * Genera nome file FCPXML basato sul nome audio
   */
  public generaNomeFileFCPXML(nomeAudio: string): string {
    const nomeBase = nomeAudio.replace(/\.[^/.]+$/, ''); // Rimuove estensione
    return `${nomeBase}_beatmarkers.fcpxml`;
  }

  /**
   * Estrae il formato del file dall'estensione
   */
  private estraiFormatoFile(nomeFile: string): SupportedAudioFormat | null {
    const estensione = nomeFile.toLowerCase().split('.').pop();

    if (estensione === 'mp3' || estensione === 'wav') {
      return estensione;
    }

    return null;
  }

  /**
   * Valida il nome del file per compatibilità FCPXML
   */
  private validaNomeFile(nomeFile: string): boolean {
    // Caratteri pericolosi per XML e filesystem
    const caratteriProibiti = /[<>:"\\|?*]/;

    return !caratteriProibiti.test(nomeFile) && nomeFile.trim().length > 0;
  }

  /**
   * Calcola bitrate approssimativo
   */
  private calcolaBitRate(sizeBytes: number, durationSeconds: number): number {
    // Bitrate = (file size in bits) / duration in seconds / 1000
    return Math.round((sizeBytes * 8) / durationSeconds / 1000);
  }

  /**
   * Stima bit depth basandosi su sample rate e bitrate
   */
  private stimaBitDepth(sampleRate: number, bitRate: number): number {
    // Stima approssimativa per file stereo
    const bitsPerSample = (bitRate * 1000) / (sampleRate * 2);

    // Arrotonda ai valori standard
    if (bitsPerSample <= 16) return 16;
    if (bitsPerSample <= 24) return 24;
    return 32;
  }

  /**
   * Formatta le dimensioni del file in modo leggibile
   */
  public formattaDimensioneFile(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatta la durata in formato mm:ss
   */
  public formattaDurata(seconds: number): string {
    const minuti = Math.floor(seconds / 60);
    const secondi = Math.floor(seconds % 60);

    return `${minuti}:${secondi.toString().padStart(2, '0')}`;
  }
}

// Singleton per uso globale
export const fileAudioService = new FileAudioService();
export default fileAudioService;