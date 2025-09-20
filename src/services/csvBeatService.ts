/**
 * CSV Beat Service - Servizio per importazione marker beat da Sonic Visualiser
 * Sostituisce completamente i vecchi algoritmi di beat detection
 */

export interface BeatMarker {
  timestamp: number;    // Tempo in secondi
  beatNumber: number;   // Numero progressivo beat (1, 2, 3...)
}

export interface MarkerData {
  start: number;            // Tempo in secondi
  value: string;           // Valore marker per FCPXML
  isDownbeat: boolean;     // Flag down-beat (sempre true per i nostri marker)
  beatIndex: number;       // Indice beat globale
}

export interface BeatDetectionResult {
  beats: number[];           // Posizioni beat in secondi
  downbeats: number[];       // Posizioni down-beat (tutti uguali ai beat per noi)
  bpm: number;              // BPM medio calcolato
  meter: string;            // Sempre "4/4"
  confidence: number;       // Sempre 1.0 per Sonic Visualiser
  beatIntervals: number[];  // Intervalli tra beat consecutivi
}

class CsvBeatService {
  /**
   * Parsifica file CSV da Sonic Visualiser
   * Formato atteso: timestamp,beat_number
   */
  async parseSonicVisualiserCSV(csvContent: string): Promise<BeatMarker[]> {
    const lines = csvContent.trim().split('\n');
    const markers: BeatMarker[] = [];

    for (const line of lines) {
      // Salta righe vuote e commenti
      if (!line.trim() || line.startsWith('#')) continue;

      const [timestampStr, beatNumberStr] = line.split(',');
      const timestamp = parseFloat(timestampStr.trim());
      // Rimuovi virgolette se presenti
      const beatNumber = parseInt(beatNumberStr.trim().replace(/"/g, ''));

      if (!isNaN(timestamp) && !isNaN(beatNumber)) {
        markers.push({
          timestamp,
          beatNumber
        });
      }
    }

    // Ordina per timestamp
    markers.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`📊 CSV parsed: ${markers.length} beat markers`);
    console.log(`🎵 First few beats:`, markers.slice(0, 3));
    console.log(`🎵 Last few beats:`, markers.slice(-3));

    return markers;
  }

  /**
   * Converte marker beat in BeatDetectionResult compatibile
   */
  convertToDetectionResult(markers: BeatMarker[]): BeatDetectionResult {
    if (markers.length === 0) {
      throw new Error('Nessun marker beat trovato nel file CSV');
    }

    const beats = markers.map(m => m.timestamp);
    const downbeats = beats; // Tutti i nostri beat sono downbeat (inizio battuta)

    // Calcola BPM medio
    const intervals = beats.slice(1).map((beat, i) => beat - beats[i]);
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = 60 / avgInterval;

    console.log(`🎯 Detection result: ${beats.length} beats, BPM: ${bpm.toFixed(1)}`);

    return {
      beats,
      downbeats,
      bpm: Math.round(bpm * 10) / 10,
      meter: "4/4",
      confidence: 1.0, // Massima confidenza per Sonic Visualiser
      beatIntervals: intervals
    };
  }

  /**
   * Genera marker FCPXML da BeatDetectionResult
   */
  generateMarkers(result: BeatDetectionResult): MarkerData[] {
    const markers: MarkerData[] = [];
    const { downbeats, bpm, meter } = result;

    downbeats.forEach((downbeatTime, index) => {
      const battutaNumber = index + 1;

      // Formato marker per FCPXML (rosso per downbeat)
      const markerValue = `!Battuta ${battutaNumber} - ${Math.round(bpm)} BPM ${meter} [Downbeat]`;

      markers.push({
        start: downbeatTime,
        value: markerValue,
        isDownbeat: true,
        beatIndex: index
      });
    });

    console.log(`📍 Generated ${markers.length} FCPXML markers`);

    return markers;
  }

  /**
   * Genera XML FCPXML completo con marker
   */
  generateFCPXML(
    markers: MarkerData[],
    audioFileName: string,
    duration: number
  ): string {
    // Converti durata in formato frazione FCPXML (25fps)
    const durationFraction = this.secondsToFraction(duration);

    const markersXML = markers.map(marker => {
      const startFraction = this.secondsToFraction(marker.start);
      return `        <marker start="${startFraction}" duration="1/48000s" value="${marker.value}" />`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="BMXRefTimelineFormat" name="FFVideoFormat1080p25" frameDuration="1000/25000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)" />
    <asset id="ASSET_BMXRefBeatmarkedClip" name="${audioFileName}" start="0/1s" duration="${durationFraction}" hasAudio="1" audioSources="1" audioRate="48000">
      <media-rep kind="original-media" src="${audioFileName}" />
    </asset>
  </resources>
  <library>
    <event name="Beat Analysis - ${audioFileName}">
      <asset-clip ref="ASSET_BMXRefBeatmarkedClip" name="${audioFileName}" duration="${durationFraction}" audioRole="music" format="BMXRefTimelineFormat">
${markersXML}
      </asset-clip>
    </event>
  </library>
</fcpxml>`;
  }

  /**
   * Converte secondi in formato frazione FCPXML (25fps)
   */
  private secondsToFraction(seconds: number): string {
    const frames = Math.round(seconds * 25);
    return `${frames}/25s`;
  }
}

// Singleton export
export const csvBeatService = new CsvBeatService();
export default csvBeatService;