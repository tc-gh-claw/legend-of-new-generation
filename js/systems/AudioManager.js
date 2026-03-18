/**
 * AudioManager.js - 音效管理系統
 * 負責管理所有遊戲音效和背景音樂
 * 支持8-bit/16-bit風格音效
 */

class AudioManager {
    constructor(scene) {
        this.scene = scene;
        
        // 音量設置 (0-1)
        this.masterVolume = 1.0;
        this.bgmVolume = 0.7;
        this.sfxVolume = 0.8;
        
        // 靜音狀態
        this.isMuted = false;
        
        // 當前播放的背景音樂
        this.currentBgm = null;
        this.currentBgmKey = null;
        
        // 音效池（用於頻繁播放的音效）
        this.sfxPool = {};
        
        // 載入保存的設置
        this.loadSettings();
    }
    
    /**
     * 初始化音效系統
     * 在 BootScene 的 create() 中調用
     */
    static init(scene) {
        if (!scene.game.audioManager) {
            scene.game.audioManager = new AudioManager(scene);
        }
        return scene.game.audioManager;
    }
    
    /**
     * 獲取 AudioManager 實例
     */
    static getInstance(scene) {
        if (!scene.game.audioManager) {
            return AudioManager.init(scene);
        }
        return scene.game.audioManager;
    }
    
    // ==================== 音效載入 ====================
    
    /**
     * 在 BootScene 的 preload 中調用，載入所有音效
     * 注意：音效文件不存在時會跳過，避免載入失敗
     */
    static preload(scene) {
        // 音效文件暫時不存在，跳過載入
        // 等音效文件準備好後取消註釋以下代碼
        
        // ===== UI 音效 =====
        // scene.load.audio('sfx-ui-click', 'assets/audio/sfx/ui/click.wav');
        // scene.load.audio('sfx-ui-hover', 'assets/audio/sfx/ui/hover.wav');
        // ... 更多音效
        
        console.log('AudioManager: 音效載入已跳過（文件尚未準備）');
    }
    
    // ==================== 背景音樂控制 ====================
    
    /**
     * 播放背景音樂
     * @param {string} key - 音樂鍵值
     * @param {boolean} loop - 是否循環
     * @param {number} fadeIn - 淡入時間(ms)
     */
    playBgm(key, loop = true, fadeIn = 1000) {
        // 檢查音樂是否存在
        if (!this.scene.cache.audio.exists(key)) {
            console.log(`背景音樂 ${key} 不存在，跳過播放`);
            return;
        }
        
        // 如果正在播放同一首，不重複播放
        if (this.currentBgmKey === key && this.currentBgm && this.currentBgm.isPlaying) {
            return;
        }
        
        // 停止當前音樂
        this.stopBgm(fadeIn);
        
        // 播放新音樂
        const music = this.scene.sound.add(key, {
            loop: loop,
            volume: this.isMuted ? 0 : this.bgmVolume * this.masterVolume
        });
        
        if (fadeIn > 0) {
            music.setVolume(0);
            music.play();
            this.scene.tweens.add({
                targets: music,
                volume: this.bgmVolume * this.masterVolume,
                duration: fadeIn
            });
        } else {
            music.play();
        }
        
        this.currentBgm = music;
        this.currentBgmKey = key;
        
        return music;
    }
    
    /**
     * 停止背景音樂
     * @param {number} fadeOut - 淡出時間(ms)
     */
    stopBgm(fadeOut = 1000) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            if (fadeOut > 0) {
                this.scene.tweens.add({
                    targets: this.currentBgm,
                    volume: 0,
                    duration: fadeOut,
                    onComplete: () => {
                        this.currentBgm.stop();
                        this.currentBgm.destroy();
                    }
                });
            } else {
                this.currentBgm.stop();
                this.currentBgm.destroy();
            }
        }
        
        this.currentBgm = null;
        this.currentBgmKey = null;
    }
    
    /**
     * 暫停背景音樂
     */
    pauseBgm() {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            this.currentBgm.pause();
        }
    }
    
    /**
     * 恢復背景音樂
     */
    resumeBgm() {
        if (this.currentBgm && this.currentBgm.isPaused) {
            this.currentBgm.resume();
        }
    }
    
    // ==================== 音效播放 ====================
    
    /**
     * 播放音效
     * @param {string} key - 音效鍵值
     * @param {object} config - 播放配置
     */
    playSfx(key, config = {}) {
        if (this.isMuted) return;
        
        // 檢查音效是否存在
        if (!this.scene.cache.audio.exists(key)) {
            console.log(`音效 ${key} 不存在，跳過播放`);
            return;
        }
        
        const volume = (config.volume || 1) * this.sfxVolume * this.masterVolume;
        const detune = config.detune || 0; // 音高變化（用於隨機變化）
        const rate = config.rate || 1; // 播放速度
        
        // 檢查音效池
        if (!this.sfxPool[key]) {
            this.sfxPool[key] = [];
        }
        
        // 查找可用的音效實例
        let sound = this.sfxPool[key].find(s => !s.isPlaying);
        
        if (!sound) {
            sound = this.scene.sound.add(key, {
                volume: volume,
                detune: detune,
                rate: rate
            });
            this.sfxPool[key].push(sound);
        } else {
            sound.setVolume(volume);
            sound.setDetune(detune);
            sound.setRate(rate);
        }
        
        sound.play();
        return sound;
    }
    
    /**
     * 帶隨機音高變化的音效播放（增加變化性）
     */
    playSfxRandom(key, detuneRange = 200, config = {}) {
        const detune = Phaser.Math.Between(-detuneRange, detuneRange);
        return this.playSfx(key, { ...config, detune });
    }
    
    // ==================== 快捷播放方法 ====================
    
    // --- UI 音效 ---
    playClick() { return this.playSfx('sfx-ui-click'); }
    playHover() { return this.playSfx('sfx-ui-hover', { volume: 0.5 }); }
    playOpen() { return this.playSfx('sfx-ui-open'); }
    playClose() { return this.playSfx('sfx-ui-close'); }
    playCancel() { return this.playSfx('sfx-ui-cancel'); }
    playConfirm() { return this.playSfx('sfx-ui-confirm'); }
    
    // --- 戰鬥音效 ---
    playAttack() { return this.playSfxRandom('sfx-combat-attack', 100); }
    playHit() { return this.playSfx('sfx-combat-hit'); }
    playMiss() { return this.playSfx('sfx-combat-miss'); }
    playVictory() { 
        this.stopBgm(500);
        return this.playSfx('sfx-combat-victory'); 
    }
    playDefeat() { 
        this.stopBgm(500);
        return this.playSfx('sfx-combat-defeat'); 
    }
    playLevelUp() { return this.playSfx('sfx-combat-levelup'); }
    
    // --- 魔法音效 ---
    playMagic(subject) {
        const keyMap = {
            'math': 'sfx-magic-math',
            'science': 'sfx-magic-science',
            'english': 'sfx-magic-english',
            'general': 'sfx-magic-general'
        };
        return this.playSfx(keyMap[subject] || 'sfx-magic-general');
    }
    playHeal() { return this.playSfx('sfx-magic-heal'); }
    playShield() { return this.playSfx('sfx-magic-shield'); }
    
    // --- 環境音效 ---
    playFootstep() { return this.playSfxRandom('sfx-env-footstep', 50, { volume: 0.3 }); }
    playEncounter() { return this.playSfx('sfx-env-encounter'); }
    playSave() { return this.playSfx('sfx-env-save'); }
    playItem() { return this.playSfx('sfx-env-item'); }
    
    // --- 場景音樂 ---
    playMenuBgm() { return this.playBgm('bgm-menu'); }
    playWorldBgm() { return this.playBgm('bgm-world'); }
    playTownBgm() { return this.playBgm('bgm-town'); }
    playBattleBgm() { return this.playBgm('bgm-battle-normal'); }
    playBossBgm() { return this.playBgm('bgm-battle-boss'); }
    playFinalBossBgm() { return this.playBgm('bgm-battle-final'); }
    
    // ==================== 音量控制 ====================
    
    /**
     * 設置主音量
     */
    setMasterVolume(volume) {
        this.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.updateAllVolumes();
        this.saveSettings();
    }
    
    /**
     * 設置背景音樂音量
     */
    setBgmVolume(volume) {
        this.bgmVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.currentBgm) {
            this.currentBgm.setVolume(this.isMuted ? 0 : this.bgmVolume * this.masterVolume);
        }
        this.saveSettings();
    }
    
    /**
     * 設置音效音量
     */
    setSfxVolume(volume) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.saveSettings();
    }
    
    /**
     * 更新所有播放中的音量
     */
    updateAllVolumes() {
        if (this.currentBgm) {
            this.currentBgm.setVolume(this.isMuted ? 0 : this.bgmVolume * this.masterVolume);
        }
    }
    
    // ==================== 靜音控制 ====================
    
    /**
     * 切換靜音狀態
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateAllVolumes();
        this.saveSettings();
        return this.isMuted;
    }
    
    /**
     * 設置靜音狀態
     */
    setMute(muted) {
        this.isMuted = muted;
        this.updateAllVolumes();
        this.saveSettings();
    }
    
    // ==================== 設置保存/載入 ====================
    
    saveSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        };
        localStorage.setItem('lng-audio-settings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('lng-audio-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume ?? 1.0;
                this.bgmVolume = settings.bgmVolume ?? 0.7;
                this.sfxVolume = settings.sfxVolume ?? 0.8;
                this.isMuted = settings.isMuted ?? false;
            } catch (e) {
                console.warn('Failed to load audio settings:', e);
            }
        }
    }
    
    // ==================== 獲取設置 ====================
    
    getSettings() {
        return {
            masterVolume: this.masterVolume,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        };
    }
}

// 導出模組（如果在模組環境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
