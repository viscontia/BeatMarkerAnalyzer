# BeatMarkerAnalyzer

Applicazione web per analisi professionale dei beat audio con esportazione diretta per Final Cut Pro.

## 🎵 Caratteristiche Principali

- **Beat Detection Professionale**: Algoritmi Essentia.js (vincitore MIREX)
- **Esportazione FCPXML**: Compatibile Final Cut Pro 10.6+ e 11
- **Interfaccia Italiana**: Design moderno con tema chiaro/scuro
- **Solo Desktop**: Ottimizzato per PC, no supporto mobile
- **Zero Backend**: Elaborazione completamente client-side

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js 18+
- NPM o Yarn

### Installazione
```bash
# Clona repository
git clone <repository-url>
cd BeatMarkerAnalyzer

# Installa dipendenze
npm install

# Metodo 1: Script automatico (consigliato)
./scripts/start-beatmarker

# Metodo 2: Comandi manuali
npm run dev                    # Server sviluppo
npm run build                  # Build produzione
```

### Script di Avvio Automatico

Lo script `start-beatmarker` automatizza il processo di avvio:

#### Funzionalità:
1. ✅ Controllo directory progetto
2. 🔪 Terminazione processi attivi su porta 5173
3. 📦 Installazione dipendenze (se necessario)
4. 🚀 Avvio server di sviluppo

#### Uso:
```bash
# Da qualsiasi directory
./scripts/start-beatmarker

# Con alias globale (configurato automaticamente)
start-beatmarker
```

### Accesso
- **Sviluppo**: http://localhost:5173 (auto-avvio con script)
- **Produzione**: Deploy statico su Vercel/Netlify

## 📁 Struttura Progetto

```
src/
├── components/          # Componenti React modulari
│   ├── AudioUploader/   # Drag & drop caricamento file
│   ├── AudioInfo/       # Card informazioni tecniche
│   └── ThemeToggle/     # Toggle tema chiaro/scuro
├── services/            # Logica business
│   ├── FileAudioService.ts     # Validazione e metadati
│   ├── beatDetectionService.ts # Essentia.js integration
│   └── FCPXMLExportService.ts  # Generazione XML
├── types/               # Definizioni TypeScript
└── styles/              # CSS globali e temi
```

## 🎯 Come Usare

### 1. Caricamento File
- Trascina file audio (MP3/WAV, max 50MB) nell'area upload
- Validazione automatica formato e dimensioni
- Estrazione metadati audio (durata, canali, bit rate, etc.)

### 2. Informazioni Audio
- Visualizzazione 6 card informative con icone
- Controlli di compatibilità Final Cut Pro
- Pulsante per procedere all'analisi

### 3. Analisi Beat (In Sviluppo)
- Beat detection con Essentia.js
- Down-beat automatico e classificazione metro
- Visualizzazione marker sulla timeline

### 4. Esportazione FCPXML
- Generazione file XML compatibile Final Cut Pro v1.10+
- **IMPORTANTE**: File XML salvato nella stessa directory dell'audio
- Colorazione marker automatica (rossi per down-beat, verdi per off-beat)

## ⚠️ Vincoli Importanti

### File Audio
- **Formati**: Solo MP3 e WAV
- **Dimensione**: Massimo 50MB
- **Target**: Solo desktop PC

### Esportazione FCPXML
- **VINCOLO CRITICO**: File XML e audio devono essere nella stessa cartella
- **Final Cut Pro**: Importare trascinando XML nella timeline
- **Compatibilità**: FCP 10.6+ e Final Cut Pro 11

## 🛠️ Stack Tecnologico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS custom properties
- **Temi**: next-themes per persistenza
- **Animazioni**: Framer Motion
- **Audio**: Web Audio API + Essentia.js
- **Icone**: Lucide React

## 📋 Comandi Disponibili

```bash
# Sviluppo
npm run dev          # Server sviluppo
npm run build        # Build produzione
npm run preview      # Preview build

# Qualità codice
npm run lint         # ESLint controllo
npm run lint:fix     # ESLint fix automatico
npm run type-check   # TypeScript check

# Test
npm test            # Unit test
npm run test:ui     # Test UI
```

## 🎨 Temi e Design

### Palette Colori
- **Tema Chiaro**: Blue-500/Emerald-500/Purple-500 su Gray-50/White
- **Tema Scuro**: Blue-400/Emerald-400/Purple-400 su Gray-900/800

### Accessibilità
- Contrasti WCAG AA compliant
- Font Inter per leggibilità
- Transizioni fluide tra temi
- Scorciatoie tastiera supportate

## 🔧 Configurazione

### Tailwind CSS
- CSS custom properties per temi
- Componenti personalizzati
- Responsive design desktop-first

### TypeScript
- Strict mode attivo
- Tipizzazione completa
- Path mapping per import puliti

## 📚 Documentazione Tecnica

Consulta la cartella `docs/` per:
- Analisi funzionale completa
- Specifiche tecniche dettagliate
- Riferimenti Apple FCPXML
- Integrazione Essentia.js

## 🐛 Debug e Sviluppo

### Logs Console
- `🎵` = File audio processing
- `✅` = Operazioni completate
- `❌` = Errori
- `⚠️` = Avvisi importanti

### File di Esempio
La cartella `Example/` contiene:
- File audio di test (`Escape Velocity Vocal Based.wav`)
- FCPXML funzionante di esempio

## 🚀 Deploy Produzione

### Vercel (Consigliato)
```bash
# Build e deploy automatico
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy manuale su Netlify
# Upload cartella dist/
```

### GitHub Actions
CI/CD automatico configurato per build e deploy su push.

## 📄 Licenze

- **Progetto**: Licenza da definire
- **Essentia.js**: AGPL (gratuito per uso personale)
- **Altre dipendenze**: Vedi package.json

## 🤝 Contributi

1. Fork del repository
2. Branch feature (`git checkout -b feature/nome-feature`)
3. Commit (`git commit -m 'Aggiungi feature'`)
4. Push (`git push origin feature/nome-feature`)
5. Pull Request

## 📞 Supporto

Per problemi tecnici o domande:
- Issues GitHub
- Documentazione tecnica in `/docs`
- Console browser per debug

---

**BeatMarkerAnalyzer** • Analisi beat professionale per Final Cut Pro