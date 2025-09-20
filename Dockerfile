# Dockerfile per BeatMarkerAnalyzer sonic-annotator
FROM ubuntu:22.04

# Evita prompt interattivi durante apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Aggiorna repository e installa dipendenze
RUN apt-get update && apt-get install -y \
    wget \
    build-essential \
    libqt5core5a \
    libqt5network5 \
    libqt5xml5 \
    libvamp-sdk2v5 \
    vamp-plugin-sdk \
    libfftw3-dev \
    libsndfile1-dev \
    libasound2-dev \
    libpulse-dev \
    liblo-dev \
    librubberband-dev \
    libsamplerate0-dev \
    libresample1-dev \
    liblrdf0-dev \
    liboggz2-dev \
    libfishsound1-dev \
    libmad0-dev \
    libid3tag0-dev \
    libflac-dev \
    libvorbis-dev \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# Installa sonic-annotator dai repository
RUN apt-get update && apt-get install -y \
    sonic-annotator \
    vamp-plugin-pack \
    && rm -rf /var/lib/apt/lists/*

# Imposta VAMP_PATH per i plugin
ENV VAMP_PATH=/usr/local/lib/vamp

# Verifica installazione
RUN sonic-annotator --version
RUN sonic-annotator -l | grep -i qm

# Crea directory di lavoro
WORKDIR /data

# Entry point
ENTRYPOINT ["sonic-annotator"]