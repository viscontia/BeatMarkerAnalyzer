# BeatMarkerAnalyzer - Analisi Funzionale e Tecnica

## 1. Overview del Progetto

**BeatMarkerAnalyzer** è un'applicazione web avanzata per l'analisi audio che permette il caricamento, l'elaborazione e l'analisi di file musicali con focus sulla rilevazione automatica dei beat e l'integrazione con Final Cut Pro.

### Obiettivi Principali
- Analisi professionale di file audio (MP3, WAV)
- Rilevamento automatico dei beat con algoritmi di livello professionale
- Visualizzazione interattiva della forma d'onda
- Esportazione compatibile con Final Cut Pro (formato .fcpxml v1.10)
- Interfaccia utente moderna e responsiva in italiano

---

## 2. Funzionalità Core

### 2.1 Gestione File Audio

#### Caricamento File
- **Formati supportati**: MP3, WAV
- **Validazione**: Controllo automatico dei formati accettati
- **Interfaccia**: Area drag & drop moderna e visivamente accattivante
- **Modalità**: Caricamento singolo file

#### Informazioni Tecniche
Visualizzazione in **6 card informative** con icone Lucide React:
- **Durata** (icona orologio)
- **Canali audio** (icona altoparlante)
- **Sample rate** (icona onda sonora)
- **Bit rate** (icona chip)
- **Tempo musicale** (icona metronomo)
- **Sesto parametro tecnico** (icona da definire)

### 2.2 Visualizzazione Audio

#### Forma d'Onda Interattiva
- **Rendering**: Visualizzazione grafica ricca con colori pastello
- **Navigazione**: Scorrimento orizzontale fluido per tracce lunghe
- **Zoom**: Funzionalità avanzata con livelli elevati per analisi dettagliata
- **Sincronizzazione**: Cursore rosso sincronizzato con riproduzione
- **Auto-scroll**: Viewport che segue automaticamente la riproduzione

#### Marcatori Beat
- **Overlay visivi**: Marcatori eleganti sovrapposti alla forma d'onda
- **Sincronizzazione**: Posizioni precise dei beat rilevati
- **Design**: Elementi grafici moderni integrati nella visualizzazione

### 2.3 Rilevamento Beat

#### Engine di Analisi
- **Libreria**: JavaScript open source professionale (aubio.js o equivalente)
- **Elaborazione**: Completamente client-side
- **Accuratezza**: Livello professionale
- **Tempo reale**: Analisi automatica post-caricamento

### 2.4 Controlli Audio

#### Player Integrato
- **Controlli**: Play, Pausa, Stop con icone Lucide React
- **Design**: Stile moderno con colori pastello
- **Sincronizzazione**: Perfetta integrazione con forma d'onda e marcatori
- **Responsività**: Adattivo a tutte le dimensioni schermo

---

## 3. Esportazione Final Cut Pro

### 3.1 Formato .fcpxml v1.10

#### Struttura XML Ufficiale Apple FCPXML v1.10+

**Riferimento**: [Apple Developer FCPXML Reference](https://developer.apple.com/documentation/professional-video-applications/fcpxml-reference)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<fcpxml version="1.10">
  <resources>
    <format id="BMXRefTimelineFormat" name="FFVideoFormat1080p25" frameDuration="1000/25000s"/>
    <asset id="ASSET_BMXRefBetmarkedClip" name="[nome_file]" start="0/1s"
           duration="[durata]s" hasAudio="1" audioSources="1" audioRate="48000">
      <media-rep kind="original-media" src="[nome_file.ext]"/>
    </asset>
  </resources>
  <library>
    <event name="BeatMarker Event">
      <project name="BeatMarker Project">
        <sequence format="BMXRefTimelineFormat">
          <spine>
            <asset-clip ref="ASSET_BMXRefBetmarkedClip" name="[nome_file]"
                       duration="[durata]s" audioRole="music" format="BMXRefTimelineFormat">
              <!-- Markers: timing in numeri razionali (secondi reali) -->
              <marker start="[beat_time_seconds]s" duration="1/1000s" value="[marker_value]"/>
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
```

#### Regole di Colorazione Marcatori
- **Rossi**: Prefisso "!" per beat principali (1° e 4° in 4/4)
- **Verdi**: Prefisso "?"
- **Blu**: Prefisso "/"
- **Default**: Senza prefisso

#### Specifiche Tecniche Apple FCPXML
- **Versioni supportate**: v1.10+ (v1.13 per Final Cut Pro 11)
- **Timing**: Numeri razionali in secondi reali (64-bit numeratore, 32-bit denominatore)
- **Formato tempo**: Frazione + suffisso "s" (es. "43703/29s" o "5s")
- **Percorsi media**: Relativi, spazi normali nei nomi file
- **Precisione marker**: 1ms minimo (1/1000s)
- **Compatibilità**: Frame rate NTSC (1001/30000s) e standard

### 3.2 Download e Istruzioni

#### Processo di Esportazione
- **VINCOLO CRITICO**: File FCPXML e audio DEVONO essere nella stessa directory
- **Strategia download**: Catturare percorso file audio originale
- **Nome file**: [nome_audio]_beatmarkers.fcpxml
- **Download location**: Stessa cartella del file audio caricato
- **Percorso nel XML**: Solo nome file (es. "Escape Velocity Vocal Based.wav")

#### Requisiti Tecnici Final Cut Pro
- **Posizionamento obbligatorio**: File XML e audio nella stessa cartella
- **Riferimento media**: `src="[nome_file.ext]"` (percorso relativo)
- **Compatibilità**: Drag & drop diretto nel browser FCP
- **Messaggi utente**: Avvisi chiari in italiano sui requisiti percorso

---

## 4. Interfaccia Utente

### 4.1 Design System

#### Elementi Visuali
- **Framework**: Tailwind CSS con CSS custom properties per temi
- **Tema**: Toggle chiaro/scuro con transizioni fluide
- **Palette Colori**:
  - **Tema Chiaro**: Pastello con sfondo bianco/grigio chiaro
    - Primario: Blue-500 (#3B82F6) / Blue-100 (#DBEAFE)
    - Secondario: Emerald-500 (#10B981) / Emerald-100 (#D1FAE5)
    - Accento: Purple-500 (#8B5CF6) / Purple-100 (#EDE9FE)
    - Sfondo: Gray-50 (#F9FAFB) / White (#FFFFFF)
    - Testo: Gray-900 (#111827) / Gray-700 (#374151)
  - **Tema Scuro**: Palette complementare con sfondo scuro
    - Primario: Blue-400 (#60A5FA) / Blue-900 (#1E3A8A)
    - Secondario: Emerald-400 (#34D399) / Emerald-900 (#064E3B)
    - Accento: Purple-400 (#A78BFA) / Purple-900 (#4C1D95)
    - Sfondo: Gray-900 (#111827) / Gray-800 (#1F2937)
    - Testo: Gray-100 (#F3F4F6) / Gray-300 (#D1D5DB)
- **Tipografia**: Inter font per leggibilità su entrambi i temi
- **Icone**: Lucide React con colorazione dinamica

#### Layout Responsivo
- **Card design**: Sezioni con ombre dinamiche (light/dark) e bordi arrotondati
- **Transizioni**: Fluide per cambio tema e interazioni
- **Contrast ratios**: WCAG AA compliant per accessibilità
- **Responsive**: Ottimizzato per desktop (1024px+)
- **Lingua**: Completamente in italiano

### 4.2 Modal di Esportazione

#### Caratteristiche
- **Responsività completa**: Adattamento a qualsiasi finestra browser
- **Scroll intelligente**: Prevenzione taglio contenuto
- **Accessibilità**: Tutti gli elementi sempre visibili e interattivi
- **Layout adattivo**: Spaziatura appropriata su ogni schermo

---

## 5. Architettura Tecnica

### 5.1 Frontend (Client-side)

#### Elaborazione Audio
- **Processing**: Completo lato client
- **Generazione waveform**: Dai dati audio caricati
- **Beat detection**: Utilizzo libreria JavaScript professionale
- **Export XML**: Generazione completa lato client

#### Gestione Stato
- **Audio playback**: Sincronizzazione real-time
- **UI state**: Gestione tema, zoom, scroll
- **File management**: Handling completo file caricati

### 5.2 Deploy e Rilasci

#### Gestione Versioni Semplificata
- **Git Tags**: Versioning tramite repository
- **CI/CD**: Deploy automatico su push/tag
- **Hosting statico**: Vercel/Netlify per zero-config
- **Rollback**: Tramite Git revert se necessario

---

## 6. Stack Tecnologico Suggerito

### Frontend
- **Framework**: React/Next.js
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API + aubio.js
- **Icons**: Lucide React
- **Build**: Vite/Webpack

### Deploy
- **Hosting**: Vercel/Netlify (statico)
- **CI/CD**: GitHub Actions
- **Versioning**: Git tags
- **Costo**: Zero infrastruttura

---

## 7. Note di Implementazione

### Performance
- **Audio processing**: Ottimizzazione per file di grandi dimensioni
- **Memory management**: Gestione efficiente memoria browser
- **Lazy loading**: Caricamento progressivo forma d'onda

### Compatibilità
- **Browser**: Chrome, Firefox, Safari, Edge (moderne)
- **Final Cut Pro**: Versioni che supportano .fcpxml v1.10
- **Target**: Solo desktop PC (max 50MB per file), no supporto mobile

### Sicurezza
- **File validation**: Controllo rigoroso formati supportati
- **Client-side only**: Nessun upload server per file audio
- **XSS protection**: Sanitizzazione input utente