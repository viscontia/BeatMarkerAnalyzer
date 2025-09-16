# Setup Alias Globale - start-beatmarker

## 🚀 Configurazione Completata

L'alias globale `start-beatmarker` è stato configurato per funzionare da qualsiasi directory del sistema.

### ✅ Configurazioni Applicate

#### 1. **Link Simbolico**
```bash
~/.local/bin/start-beatmarker -> /path/to/BeatMarkerAnalyzer/scripts/start-beatmarker
```

#### 2. **PATH Aggiornato**
Aggiunto `~/.local/bin` al PATH in:
- `~/.bash_profile`
- `~/.bashrc`
- `~/.zshrc`

### 🎯 Come Usare

#### Da Qualsiasi Directory
```bash
# Avvia BeatMarkerAnalyzer
start-beatmarker

# Output atteso:
🎵 BeatMarkerAnalyzer - Script di avvio
=================================================
✅ Directory progetto valida
✅ Processi porta 5173 terminati
🚀 Server avviato su http://localhost:5173
```

### 🔧 Risoluzione Problemi

#### Se ricevi "command not found"

1. **Ricarica Profilo Shell**:
   ```bash
   # Per bash
   source ~/.bash_profile

   # Per zsh
   source ~/.zshrc
   ```

2. **Controlla PATH**:
   ```bash
   echo $PATH | grep -o ~/.local/bin
   # Dovrebbe mostrare: /Users/[username]/.local/bin
   ```

3. **Verifica Link Simbolico**:
   ```bash
   ls -la ~/.local/bin/start-beatmarker
   # Dovrebbe mostrare il link al script originale
   ```

4. **Aggiorna PATH Manualmente**:
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   ```

### 🔄 Reinstallazione

Se necessario, ricrea l'alias:

```bash
# 1. Crea directory
mkdir -p ~/.local/bin

# 2. Crea link simbolico
ln -sf "/Users/adrianovisconti/Documents/Sviluppo Software/GitHub/BeatMarkerAnalyzer/scripts/start-beatmarker" ~/.local/bin/start-beatmarker

# 3. Aggiungi al PATH (se non presente)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bash_profile
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# 4. Ricarica profilo
source ~/.bash_profile
```

### ✨ Vantaggi

- 🌍 **Globale**: Funziona da qualsiasi directory
- 🔄 **Automatico**: Kill processi + avvio server
- 🎨 **Colorato**: Output con colori e emoji
- 🛡️ **Sicuro**: Controlli di validità progetto
- ⚡ **Veloce**: Un solo comando per tutto

### 📝 Note

- Il comando `start-beatmarker` punterà sempre alla versione più recente dello script
- Le modifiche al script originale saranno immediatamente disponibili
- Per fermare il server: `Ctrl+C`
- Lo script gestisce automaticamente la pulizia dei processi

---

**Alias configurato e funzionante!** 🎉