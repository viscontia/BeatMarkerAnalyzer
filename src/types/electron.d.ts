/**
 * Type declarations for Electron API in renderer process
 */

interface ElectronAPI {
  // Docker operations
  docker: {
    checkAvailability: () => Promise<boolean>;
    checkImage: () => Promise<boolean>;
    pullImage: () => Promise<boolean>;
    runSonicAnnotator: (audioFilePath: string) => Promise<{ success: boolean; csvPath?: string; error?: string }>;
    onProgress: (callback: (progress: any) => void) => void;
    removeProgressListener: (callback: (progress: any) => void) => void;
  };

  // File operations
  file: {
    saveAudioTemp: (fileName: string, buffer: ArrayBuffer) => Promise<string>;
    readCsv: (csvPath: string) => Promise<string>;
    readAudioFile: (filePath: string) => Promise<ArrayBuffer>;
    saveFcpxml: (filePath: string, content: string) => Promise<void>;
    saveFcpxmlToAudioDir: (audioFilePath: string, fcpxmlContent: string, fcpxmlFileName: string) => Promise<string>;
    getInfo: (filePath: string) => Promise<{ name: string; size: number; dir: string }>;
  };

  // Dialog operations
  dialog: {
    openFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveFile: (defaultPath: string) => Promise<{ canceled: boolean; filePath?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};