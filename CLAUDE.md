# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BeatMarkerAnalyzer è un'applicazione web per l'analisi audio che permette:
- Caricamento file audio (MP3, WAV) fino a 50MB
- Rilevamento automatico dei beat con algoritmi professionali
- Visualizzazione interattiva della forma d'onda
- Esportazione marker in formato .fcpxml v1.10 per Final Cut Pro
- Interfaccia completamente in italiano con tema chiaro/scuro

## Architettura

### Frontend-Only Application
- **Target**: Solo desktop PC, nessun supporto mobile
- **Processing**: Completamente client-side (Web Audio API + aubio.js)
- **Deploy**: Statico su Vercel/Netlify, zero backend
- **Versioning**: Git tags + GitHub Actions per CI/CD

### Stack Tecnologico
- **Framework**: React/Next.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Audio**: Web Audio API + Essentia.js per beat detection professionale
- **Build**: Vite per performance ottimali

## Directory Structure

- `src/` - Source code
  - `components/` - Componenti React modulari
  - `services/` - Audio processing, beat detection, XML export
  - `hooks/` - Custom hooks per stato audio/UI
  - `utils/` - Utility per conversioni e validazioni
- `tests/` - Test files
- `docs/` - Documentazione tecnica e funzionale
- `assets/` - Asset statici

## Development Commands

```bash
# Installazione dipendenze
npm install

# Sviluppo locale
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview

# Test
npm test

# Lint
npm run lint

# Type check (se TypeScript)
npm run type-check
```

## Vincoli Specifici

### File Audio
- **Formati**: Solo MP3 e WAV
- **Dimensione**: Massimo 50MB per file
- **Validazione**: Controllo rigoroso lato client

### Export Final Cut Pro
- **Formato**: .fcpxml v1.10+ (supporto v1.13 FCP 11)
- **Riferimento**: [Apple FCPXML Documentation](https://developer.apple.com/documentation/professional-video-applications/fcpxml-reference)
- **Timing**: Numeri razionali in secondi (es. "43703/29s" o "5s")
- **Precisione**: 1ms minimo (1/1000s)
- **Colorazione marker**: "!" rosso (down-beat), "?" verde (off-beat)
- **VINCOLO CRITICO**: File FCPXML e audio devono essere nella stessa directory
- **Percorsi**: Solo nome file (es. "audio.wav"), no path assoluti
- **Download**: Nella stessa cartella del file audio originale

### UI/UX Requirements
- **Lingua**: Completamente in italiano
- **Temi**: Toggle chiaro/scuro con palette pastello compatibile
- **Palette Colori**:
  - Chiaro: Blue/Emerald/Purple su Gray-50/White
  - Scuro: Blue-400/Emerald-400/Purple-400 su Gray-900/800
- **Framework**: Tailwind CSS + next-themes per gestione temi
- **Responsive**: Ottimizzato per desktop (1024px+), no mobile
- **Icone**: Lucide React con colorazione dinamica
- **Font**: Inter per leggibilità cross-tema
- **Accessibilità**: WCAG AA contrast ratios

## Funzionalità Core

1. **Upload & Validation**: Drag & drop con validazione formati
2. **Audio Info**: 6 card con metadati tecnici + icone
3. **Waveform**: Visualizzazione interattiva con zoom/scroll
4. **Beat Detection**: Essentia.js con RhythmExtractor2013 + down-beat detection
5. **Audio Player**: Controlli sincronizzati con waveform
6. **Marker Overlay**: Beat visuali sulla forma d'onda
7. **Export Modal**: Dialog con path detection e download nella directory corretta

## Performance Notes

- **Memory Management**: Attenzione ai leak AudioContext
- **Web Workers**: Processing beat in background se necessario
- **Progressive Loading**: Per file audio di grandi dimensioni
- **Viewport Culling**: Rendering solo sezione visibile waveform