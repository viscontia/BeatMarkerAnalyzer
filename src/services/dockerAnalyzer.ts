/**
 * Docker Analyzer Service - Integrazione Docker sonic-annotator per Electron
 * Gestisce l'analisi beat via Docker mantenendo file nella stessa directory
 */

export interface DockerAnalysisProgress {
  phase: 'starting' | 'analyzing' | 'complete' | 'error';
  percentage: number;
  message: string;
  csvPath?: string;
}

export interface DockerAnalysisResult {
  success: boolean;
  csvPath: string;
  error?: string;
}

class DockerAnalyzerService {

  /**
   * Verifica se Docker è disponibile nel sistema
   */
  async checkDockerAvailability(): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available - running in browser mode');
      return false;
    }

    try {
      return await window.electronAPI.docker.checkAvailability();
    } catch (error) {
      console.error('Error checking Docker availability:', error);
      return false;
    }
  }

  /**
   * Verifica se l'immagine sonic-annotator è disponibile
   */
  async checkImageAvailability(): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }

    try {
      return await window.electronAPI.docker.checkImage();
    } catch (error) {
      console.error('Error checking Docker image:', error);
      return false;
    }
  }

  /**
   * Scarica l'immagine Docker se non presente
   */
  async pullDockerImage(onProgress?: (progress: DockerAnalysisProgress) => void): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }

    try {
      onProgress?.({
        phase: 'starting',
        percentage: 0,
        message: 'Downloading Sonic Annotator Docker image...'
      });

      const success = await window.electronAPI.docker.pullImage();

      if (success) {
        onProgress?.({
          phase: 'starting',
          percentage: 50,
          message: 'Docker image ready'
        });
      }

      return success;
    } catch (error) {
      console.error('Error pulling Docker image:', error);
      return false;
    }
  }

  /**
   * Esegue l'analisi beat via Docker sonic-annotator
   */
  async runSonicAnnotator(
    audioFile: File,
    onProgress?: (progress: DockerAnalysisProgress) => void
  ): Promise<DockerAnalysisResult> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }

    try {

      // Verifica prerequisiti
      const dockerAvailable = await this.checkDockerAvailability();
      if (!dockerAvailable) {
        throw new Error('Docker non disponibile. Installare Docker Desktop per macOS.');
      }

      // Verifica immagine
      const imageAvailable = await this.checkImageAvailability();
      if (!imageAvailable) {
        onProgress?.({
          phase: 'starting',
          percentage: 0,
          message: 'Downloading Sonic Annotator...'
        });

        const pullSuccess = await this.pullDockerImage(onProgress);
        if (!pullSuccess) {
          throw new Error('Impossibile scaricare immagine Sonic Annotator');
        }
      }

      onProgress?.({
        phase: 'starting',
        percentage: 10,
        message: 'Preparing audio file...'
      });

      // Salva file audio temporaneo
      const audioBuffer = await audioFile.arrayBuffer();
      const audioPath = await window.electronAPI.file.saveAudioTemp(audioFile.name, audioBuffer);

      // Registra listener per aggiornamenti di progresso
      const progressListener = (progress: DockerAnalysisProgress) => {
        onProgress?.(progress);
      };

      window.electronAPI.docker.onProgress(progressListener);

      try {
        // Esegui analisi Docker
        const result = await window.electronAPI.docker.runSonicAnnotator(audioPath);

        if (result.success && result.csvPath) {
          onProgress?.({
            phase: 'complete',
            percentage: 100,
            message: 'Beat analysis completed successfully!',
            csvPath: result.csvPath
          });

          return {
            success: true,
            csvPath: result.csvPath
          };
        } else {
          throw new Error(result.error || 'Analysis failed');
        }

      } finally {
        // Rimuovi listener
        window.electronAPI.docker.removeProgressListener(progressListener);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Docker analysis failed';
      console.error('Docker analysis error:', error);

      onProgress?.({
        phase: 'error',
        percentage: 0,
        message: errorMessage
      });

      return {
        success: false,
        csvPath: '',
        error: errorMessage
      };
    }
  }

  /**
   * Legge file CSV da path locale (tramite Electron)
   */
  async readCsvFromPath(csvPath: string): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    try {
      return await window.electronAPI.file.readCsv(csvPath);
    } catch (error) {
      throw new Error(`Failed to read CSV file: ${error}`);
    }
  }

  /**
   * Ottiene informazioni sui plugin Vamp disponibili
   */
  async getAvailablePlugins(): Promise<string[]> {
    if (!window.electronAPI) {
      return [];
    }

    // TODO: Implementare tramite IPC se necessario
    console.log('getAvailablePlugins not yet implemented for Electron');
    return [];
  }

  /**
   * Verifica se stiamo eseguendo in ambiente Electron
   */
  isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  /**
   * Ottiene informazioni su un file audio
   */
  async getFileInfo(filePath: string): Promise<{ name: string; size: number; dir: string }> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    try {
      return await window.electronAPI.file.getInfo(filePath);
    } catch (error) {
      throw new Error(`Failed to get file info: ${error}`);
    }
  }
}

// Singleton export
export const dockerAnalyzer = new DockerAnalyzerService();
export default dockerAnalyzer;