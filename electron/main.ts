import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mantieni un riferimento globale dell'oggetto window per evitare che venga garbage collected
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  // Crea la finestra del browser
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png'), // Se hai un'icona
    titleBarStyle: 'default',
    show: false
  });

  // Carica l'app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools solo in development per debug
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostra la finestra quando è pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Gestisci la chiusura della finestra
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Gestisci i link esterni
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Questo metodo sarà chiamato quando Electron avrà finito l'inizializzazione
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Su macOS, ricrea la finestra quando l'icona del dock viene cliccata
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Esci quando tutte le finestre sono chiuse, eccetto su macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gestori IPC per Docker integration

/**
 * Verifica se sonic-annotator è disponibile localmente
 */
ipcMain.handle('docker:check-availability', async (): Promise<boolean> => {
  try {
    const sonicAnnotatorPath = isDev
      ? path.join(process.cwd(), 'sonic-annotator')
      : path.join(__dirname, '../sonic-annotator');


    // Verifica che il file esista
    await fs.access(sonicAnnotatorPath);

    // Prova ad eseguire sonic-annotator per verificare che funzioni
    return new Promise((resolve) => {
      const sonicCheck = spawn(sonicAnnotatorPath, ['--version']);

      let stdout = '';
      let stderr = '';

      sonicCheck.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      sonicCheck.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      sonicCheck.on('close', (code) => {
        console.log('sonic-annotator check result:', { code, stdout, stderr });
        resolve(code === 0);
      });

      sonicCheck.on('error', (error) => {
        console.error('sonic-annotator check error:', error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('sonic-annotator not found:', error);
    return false;
  }
});

/**
 * Verifica se i plugin Vamp necessari sono disponibili
 */
ipcMain.handle('docker:check-image', async (): Promise<boolean> => {
  try {
    const sonicAnnotatorPath = isDev
      ? path.join(process.cwd(), 'sonic-annotator')
      : path.join(__dirname, '../sonic-annotator');

    // Verifica che sonic-annotator esista
    await fs.access(sonicAnnotatorPath);

    // Controlla se i plugin QM Vamp sono disponibili
    return new Promise((resolve) => {
      const pluginCheck = spawn(sonicAnnotatorPath, ['-l']);

      let output = '';
      pluginCheck.stdout.on('data', (data) => {
        output += data.toString();
      });

      pluginCheck.on('close', (code) => {
        if (code === 0) {
          // Verifica che il plugin qm-barbeattracker sia presente
          const hasQMPlugin = output.includes('qm-vamp-plugins:qm-barbeattracker');
          console.log('QM Vamp plugin check result:', hasQMPlugin);
          resolve(hasQMPlugin);
        } else {
          resolve(false);
        }
      });

      pluginCheck.on('error', (error) => {
        console.error('Plugin check error:', error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('sonic-annotator not found for plugin check:', error);
    return false;
  }
});

/**
 * Scarica l'immagine Docker
 */
ipcMain.handle('docker:pull-image', async (): Promise<boolean> => {
  const dockerImage = 'jpauwels/sonic-annotator';

  return new Promise((resolve) => {
    const pullProcess = spawn('docker', ['pull', dockerImage]);

    pullProcess.stdout.on('data', (data) => {
      console.log('Docker pull:', data.toString());
      // Potresti inviare aggiornamenti di progresso qui
    });

    pullProcess.stderr.on('data', (data) => {
      console.error('Docker pull error:', data.toString());
    });

    pullProcess.on('close', (code) => {
      resolve(code === 0);
    });

    pullProcess.on('error', () => {
      resolve(false);
    });
  });
});

/**
 * Salva file audio temporaneo per elaborazione Docker
 */
ipcMain.handle('file:save-audio-temp', async (event, fileName: string, buffer: ArrayBuffer): Promise<string> => {
  try {
    // Crea directory temporanea se non esiste
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Salva il file
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, Buffer.from(buffer));

    return filePath;
  } catch (error) {
    throw new Error(`Failed to save audio file: ${error}`);
  }
});

/**
 * Esegue sonic-annotator locale
 */
ipcMain.handle('docker:run-sonic-annotator', async (event, audioFilePath: string): Promise<{ success: boolean; csvPath?: string; error?: string }> => {
  try {
    const vampPlugin = 'vamp:qm-vamp-plugins:qm-barbeattracker:bars';

    // Preparazione percorsi
    const audioDir = path.dirname(audioFilePath);
    const audioFileName = path.basename(audioFilePath);
    const audioBaseName = path.parse(audioFileName).name;
    const csvFileName = `${audioBaseName}_vamp_qm-vamp-plugins_qm-barbeattracker_bars.csv`;
    const csvPath = path.join(audioDir, csvFileName);

    // Path al sonic-annotator locale (nella directory del progetto)
    const sonicAnnotatorPath = isDev
      ? path.join(process.cwd(), 'sonic-annotator')
      : path.join(__dirname, '../sonic-annotator');

    // Verifica che sonic-annotator esista
    try {
      await fs.access(sonicAnnotatorPath);
    } catch {
      throw new Error('sonic-annotator not found. Please ensure it is installed in the project directory.');
    }

    // Comando sonic-annotator locale
    const sonicArgs = [
      '-d', vampPlugin,
      audioFilePath,
      '-w', 'csv',
      '--csv-basedir', audioDir,
      '--csv-force'
    ];

    return new Promise((resolve) => {
      const sonicProcess = spawn(sonicAnnotatorPath, sonicArgs);

      let stderr = '';
      let stdout = '';

      // Invia aggiornamenti di progresso al renderer
      mainWindow?.webContents.send('docker:progress', {
        phase: 'analyzing',
        percentage: 20,
        message: 'Running beat detection analysis...'
      });

      sonicProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('sonic-annotator stdout:', data.toString());

        mainWindow?.webContents.send('docker:progress', {
          phase: 'analyzing',
          percentage: 60,
          message: 'Processing audio with Vamp plugins...'
        });
      });

      sonicProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('sonic-annotator stderr:', data.toString());
      });

      sonicProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            // Attendi che il file CSV sia generato
            await waitForCsvFile(csvPath, 5000);

            mainWindow?.webContents.send('docker:progress', {
              phase: 'complete',
              percentage: 100,
              message: `Beat analysis complete! CSV saved to ${csvFileName}`,
              csvPath
            });

            resolve({
              success: true,
              csvPath
            });
          } catch (error) {
            resolve({
              success: false,
              error: `CSV file not generated: ${error}`
            });
          }
        } else {
          resolve({
            success: false,
            error: `sonic-annotator process failed (code ${code}): ${stderr}`
          });
        }
      });

      sonicProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `sonic-annotator execution error: ${error.message}`
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * Legge file CSV generato da Docker
 */
ipcMain.handle('file:read-csv', async (event, csvPath: string): Promise<string> => {
  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    return csvContent;
  } catch (error) {
    throw new Error(`Failed to read CSV file: ${error}`);
  }
});

/**
 * Apre dialog per selezione file
 */
ipcMain.handle('dialog:open-file', async (): Promise<{ canceled: boolean; filePaths: string[] }> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  return result;
});

/**
 * Apre dialog per salvare file
 */
ipcMain.handle('dialog:save-file', async (event, defaultPath: string): Promise<{ canceled: boolean; filePath?: string }> => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [
      { name: 'Final Cut Pro XML', extensions: ['fcpxml'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  return result;
});

/**
 * Salva file FCPXML
 */
ipcMain.handle('file:save-fcpxml', async (event, filePath: string, content: string): Promise<void> => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save FCPXML file: ${error}`);
  }
});

/**
 * Ottiene informazioni su un file
 */
ipcMain.handle('file:get-info', async (event, filePath: string): Promise<{ name: string; size: number; dir: string }> => {
  try {
    const stats = await fs.stat(filePath);
    const parsed = path.parse(filePath);

    return {
      name: parsed.base,
      size: stats.size,
      dir: parsed.dir
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error}`);
  }
});

/**
 * Legge file audio dal path e ritorna ArrayBuffer
 */
ipcMain.handle('file:read-audio-file', async (event, filePath: string): Promise<ArrayBuffer> => {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  } catch (error) {
    throw new Error(`Failed to read audio file: ${error}`);
  }
});

/**
 * Salva file FCPXML nella stessa directory del file audio originale
 */
ipcMain.handle('file:save-fcpxml-to-audio-dir', async (event, audioFilePath: string, fcpxmlContent: string, fcpxmlFileName: string): Promise<string> => {
  try {
    // Ottieni la directory del file audio
    const audioDir = path.dirname(audioFilePath);
    const fcpxmlPath = path.join(audioDir, fcpxmlFileName);

    // Salva il file FCPXML
    await fs.writeFile(fcpxmlPath, fcpxmlContent, 'utf-8');

    return fcpxmlPath;
  } catch (error) {
    throw new Error(`Failed to save FCPXML file: ${error}`);
  }
});

/**
 * Attende che il file CSV sia generato e sia leggibile
 */
async function waitForCsvFile(csvPath: string, timeoutMs: number = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const stats = await fs.stat(csvPath);
      if (stats.size > 0) {
        // Verifica che il file sia completamente scritto
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
    } catch (error) {
      // File non esiste ancora
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error('Timeout waiting for CSV file generation');
}

// Gestione degli errori non catturati
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});