/**
 * Servizio per generazione ed esportazione file FCPXML
 * Basato sull'esempio funzionante e documentazione Apple
 */

import { MarkerData, FCPXMLExportOptions, FCPXML_CONSTANTS } from '@/types/audio';

/**
 * Rappresenta un marker nel formato FCPXML
 */
export interface FCPXMLMarker {
  start: string;    // Es. "10/25s"
  duration: string; // Es. "1/48000s"
  value: string;    // Es. "!Beat 1 (200% - Alta Confidenza)"
}

/**
 * Classe per generazione e gestione export FCPXML
 * Implementa le specifiche Apple v1.10+ con esempio funzionante
 */
export class FCPXMLExportService {
  private readonly VERSIONE_FCPXML = FCPXML_CONSTANTS.VERSION;
  private readonly DURATA_MARKER_DEFAULT = FCPXML_CONSTANTS.MIN_MARKER_DURATION;

  /**
   * Genera file FCPXML completo basandosi sull'esempio funzionante
   */
  public generaFCPXML(
    markers: MarkerData[],
    nomeFileAudio: string,
    durataAudio: number,
    options: Partial<FCPXMLExportOptions> = {}
  ): string {
    const config = this.preparaConfigurazioneExport(nomeFileAudio, durataAudio, options);

    // Converti marker in formato FCPXML
    const markersFCPXML = this.convertiMarkersInFCPXML(markers);

    return this.costruisciDocumentoFCPXML(config, markersFCPXML);
  }

  /**
   * Converte marker da beat detection in formato FCPXML
   */
  public convertiMarkersInFCPXML(markers: MarkerData[]): FCPXMLMarker[] {
    return markers.map(marker => ({
      start: this.convertiTempoInFrazione(marker.start),
      duration: this.DURATA_MARKER_DEFAULT,
      value: marker.value
    }));
  }

  /**
   * Costruisce il documento FCPXML completo
   * Basato sull'esempio funzionante: Escape Velocity Vocal Beats.fcpxml
   */
  private costruisciDocumentoFCPXML(
    config: FCPXMLExportConfig,
    markers: FCPXMLMarker[]
  ): string {
    const markersXML = this.generaMarkersXML(markers);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="${this.VERSIONE_FCPXML}">
  <resources>
    <format id="${FCPXML_CONSTANTS.FORMAT_ID}" name="${FCPXML_CONSTANTS.FORMAT_NAME}" frameDuration="${FCPXML_CONSTANTS.FRAME_DURATION}" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)" />
    <asset id="${FCPXML_CONSTANTS.ASSET_ID_PREFIX}" name="${config.nomeFileAudio}" start="0/1s" duration="${config.durataFrazione}" hasAudio="1" audioSources="1" audioRate="${FCPXML_CONSTANTS.DEFAULT_AUDIO_RATE}">
      <media-rep kind="original-media" src="${config.nomeFileAudio}" />
    </asset>
  </resources>
  <library>
    <event name="${config.nomeEvento}">
      <asset-clip ref="${FCPXML_CONSTANTS.ASSET_ID_PREFIX}" name="${config.nomeFileAudio}" duration="${config.durataFrazione}" audioRole="music" format="${FCPXML_CONSTANTS.FORMAT_ID}">
${markersXML}
      </asset-clip>
    </event>
  </library>
</fcpxml>`;
  }

  /**
   * Genera XML per tutti i marker
   */
  private generaMarkersXML(markers: FCPXMLMarker[]): string {
    return markers
      .map(marker => `        <marker start="${marker.start}" duration="${marker.duration}" value="${marker.value}" />`)
      .join('\\n');
  }

  /**
   * Converte tempo in secondi in frazione FCPXML
   * Es: 2.4 secondi -> "60/25s" (base 25fps come nell'esempio)
   */
  private convertiTempoInFrazione(secondi: number): string {
    const FRAME_RATE = 25; // Come nell'esempio funzionante
    const numeratore = Math.round(secondi * FRAME_RATE);

    return `${numeratore}/${FRAME_RATE}s`;
  }

  /**
   * Prepara configurazione per l'export
   */
  private preparaConfigurazioneExport(
    nomeFileAudio: string,
    durataAudio: number,
    options: Partial<FCPXMLExportOptions>
  ): FCPXMLExportConfig {
    return {
      nomeFileAudio,
      durataFrazione: this.convertiTempoInFrazione(durataAudio),
      nomeProgetto: options.projectName || 'BeatMarker Project',
      nomeEvento: options.eventName || `Beat Analysis - ${nomeFileAudio}`,
      includiSoloDownbeat: options.includeDownbeatsOnly || false,
      colorizzaMarkers: options.colorizeMarkers !== false // Default true
    };
  }

  /**
   * Genera nome file FCPXML basato sull'audio
   */
  public generaNomeFileFCPXML(nomeFileAudio: string): string {
    const nomeBase = nomeFileAudio.replace(/\\.[^/.]+$/, '');
    return `${nomeBase}_beatmarkers.fcpxml`;
  }

  /**
   * Scarica il file FCPXML
   * IMPORTANTE: Informa l'utente di salvare nella stessa directory dell'audio
   */
  public scaricaFCPXML(
    contenutoXML: string,
    nomeFile: string,
    nomeFileAudio: string
  ): void {
    const blob = new Blob([contenutoXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = nomeFile;

    // Messaggio importante per l'utente
    console.warn(`⚠️  IMPORTANTE: Salvare il file ${nomeFile} nella stessa cartella di ${nomeFileAudio}`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  }

  /**
   * Valida la struttura FCPXML generata
   */
  public validaFCPXML(contenutoXML: string): boolean {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(contenutoXML, 'application/xml');

      // Controlla errori di parsing
      const parseErrors = doc.getElementsByTagName('parsererror');
      if (parseErrors.length > 0) {
        console.error('❌ Errori parsing XML:', parseErrors[0].textContent);
        return false;
      }

      // Verifica elementi obbligatori
      const fcpxml = doc.getElementsByTagName('fcpxml')[0];
      if (!fcpxml || fcpxml.getAttribute('version') !== this.VERSIONE_FCPXML) {
        console.error('❌ Versione FCPXML non valida');
        return false;
      }

      console.log('✅ FCPXML validato con successo');
      return true;

    } catch (error) {
      console.error('❌ Errore validazione FCPXML:', error);
      return false;
    }
  }

  /**
   * Genera messaggio istruzioni per l'utente
   */
  public generaIstruzioniUtente(nomeFileFCPXML: string, nomeFileAudio: string): string {
    return `
📁 ISTRUZIONI IMPORTANTI:

1. Il file ${nomeFileFCPXML} deve essere salvato nella stessa cartella di ${nomeFileAudio}

2. In Final Cut Pro:
   - Apri il browser di eventi
   - Trascina ${nomeFileFCPXML} nella timeline
   - I marker dei beat sarananno importati automaticamente

3. Verifica che entrambi i file siano nella stessa directory prima di importare in Final Cut Pro.

❗ Se i file non sono nella stessa cartella, Final Cut Pro non riuscirà a collegare l'audio ai marker.
    `;
  }
}

/**
 * Configurazione interna per export FCPXML
 */
interface FCPXMLExportConfig {
  nomeFileAudio: string;
  durataFrazione: string;
  nomeProgetto: string;
  nomeEvento: string;
  includiSoloDownbeat: boolean;
  colorizzaMarkers: boolean;
}

// Singleton per uso globale
export const fcpxmlExportService = new FCPXMLExportService();
export default fcpxmlExportService;