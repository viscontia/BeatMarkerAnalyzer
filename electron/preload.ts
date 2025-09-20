const { contextBridge, ipcRenderer } = require('electron');

// Definisci le API che saranno esposte al renderer process
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

// Crea l'API sicura da esporre al renderer
const electronAPI: ElectronAPI = {
  docker: {
    checkAvailability: () => ipcRenderer.invoke('docker:check-availability'),
    checkImage: () => ipcRenderer.invoke('docker:check-image'),
    pullImage: () => ipcRenderer.invoke('docker:pull-image'),
    runSonicAnnotator: (audioFilePath: string) => ipcRenderer.invoke('docker:run-sonic-annotator', audioFilePath),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('docker:progress', (_event: any, progress: any) => callback(progress));
    },
    removeProgressListener: (callback) => {
      ipcRenderer.removeListener('docker:progress', callback);
    }
  },

  file: {
    saveAudioTemp: (fileName: string, buffer: ArrayBuffer) => ipcRenderer.invoke('file:save-audio-temp', fileName, buffer),
    readCsv: (csvPath: string) => ipcRenderer.invoke('file:read-csv', csvPath),
    readAudioFile: (filePath: string) => ipcRenderer.invoke('file:read-audio-file', filePath),
    saveFcpxml: (filePath: string, content: string) => ipcRenderer.invoke('file:save-fcpxml', filePath, content),
    saveFcpxmlToAudioDir: (audioFilePath: string, fcpxmlContent: string, fcpxmlFileName: string) => ipcRenderer.invoke('file:save-fcpxml-to-audio-dir', audioFilePath, fcpxmlContent, fcpxmlFileName),
    getInfo: (filePath: string) => ipcRenderer.invoke('file:get-info', filePath)
  },

  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:open-file'),
    saveFile: (defaultPath: string) => ipcRenderer.invoke('dialog:save-file', defaultPath)
  }
};

// Esponi l'API al window object in modo sicuro
contextBridge.exposeInMainWorld('electronAPI', electronAPI);