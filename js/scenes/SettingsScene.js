/**
 * SettingsScene - 設定場景
 * 包含音量控制、靜音等音效設置
 */

class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 背景
        this.createBackground();
        
        // 標題
        const titleText = this.add.text(width / 2, 80, '⚙️ 設定', {
            fontSize: '36px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e94560',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 創建滑塊控件
        this.createVolumeSliders();
        
        // 靜音按鈕
        this.createMuteButton();
        
        // 返回按鈕
        this.createBackButton();
    }
    
    createBackground() {
        // 漸層背景
        const graphics = this.add.graphics();
        for (let y = 0; y < 600; y += 4) {
            const alpha = 1 - (y / 600);
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 26, g: 26, b: 46 },
                { r: 22, g: 33, b: 62 },
                600, y
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, y, 800, 4);
        }
    }
    
    createVolumeSliders() {
        const startY = 180;
        const gapY = 80;
        
        // 主音量
        this.createSlider(400, startY, '🔊 主音量', () => this.audio.masterVolume, (v) => {
            this.audio.setMasterVolume(v);
        });
        
        // BGM音量
        this.createSlider(400, startY + gapY, '🎵 音樂音量', () => this.audio.bgmVolume, (v) => {
            this.audio.setBgmVolume(v);
        });
        
        // SFX音量
        this.createSlider(400, startY + gapY * 2, '🔔 音效音量', () => this.audio.sfxVolume, (v) => {
            this.audio.setSfxVolume(v);
        });
    }
    
    createSlider(x, y, label, getValue, setValue) {
        const container = this.add.container(x, y);
        
        // 標籤
        const labelText = this.add.text(-200, 0, label, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        
        // 滑塊背景
        const track = this.add.rectangle(0, 0, 300, 10, 0x444444);
        
        // 當前值顯示
        const valueText = this.add.text(180, 0, Math.round(getValue() * 100) + '%', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#feca57'
        }).setOrigin(0, 0.5);
        
        // 填充條
        const fill = this.add.rectangle(-150, 0, 300 * getValue(), 10, 0xe94560);
        fill.setOrigin(0, 0.5);
        
        // 滑塊手柄
        const handle = this.add.circle(-150 + 300 * getValue(), 0, 12, 0xffffff);
        handle.setInteractive({ useHandCursor: true });
        
        container.add([labelText, track, fill, handle, valueText]);
        
        // 拖動邏輯
        let isDragging = false;
        
        handle.on('pointerdown', () => {
            isDragging = true;
            this.audio.playClick();
        });
        
        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const localX = pointer.x - x;
                let value = (localX + 150) / 300;
                value = Phaser.Math.Clamp(value, 0, 1);
                
                setValue(value);
                
                // 更新顯示
                fill.width = 300 * value;
                handle.x = -150 + 300 * value;
                valueText.setText(Math.round(value * 100) + '%');
            }
        });
        
        this.input.on('pointerup', () => {
            isDragging = false;
        });
        
        // 點擊軌道直接跳轉
        track.setInteractive();
        track.on('pointerdown', (pointer) => {
            const localX = pointer.x - x;
            let value = (localX + 150) / 300;
            value = Phaser.Math.Clamp(value, 0, 1);
            
            setValue(value);
            
            // 更新顯示
            fill.width = 300 * value;
            handle.x = -150 + 300 * value;
            valueText.setText(Math.round(value * 100) + '%');
            
            this.audio.playClick();
        });
    }
    
    createMuteButton() {
        const settings = this.audio.getSettings();
        
        const muteText = this.audio.isMuted ? '🔇 取消靜音' : '🔊 靜音';
        const muteColor = this.audio.isMuted ? 0xe74c3c : 0x2ecc71;
        
        const button = this.add.container(400, 450);
        
        const bg = this.add.rectangle(0, 0, 200, 50, muteColor);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, muteText, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        button.add([bg, label]);
        
        bg.on('pointerover', () => {
            bg.setScale(1.05);
            this.audio.playHover();
        });
        
        bg.on('pointerout', () => {
            bg.setScale(1);
        });
        
        bg.on('pointerup', () => {
            this.audio.playClick();
            const isMuted = this.audio.toggleMute();
            
            // 更新按鈕文字和顏色
            label.setText(isMuted ? '🔇 取消靜音' : '🔊 靜音');
            bg.setFillStyle(isMuted ? 0xe74c3c : 0x2ecc71);
        });
    }
    
    createBackButton() {
        const button = this.add.container(400, 530);
        
        const bg = this.add.rectangle(0, 0, 200, 50, 0x3498db);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, '← 返回', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        button.add([bg, label]);
        
        bg.on('pointerover', () => {
            bg.setScale(1.05);
            this.audio.playHover();
        });
        
        bg.on('pointerout', () => {
            bg.setScale(1);
        });
        
        bg.on('pointerup', () => {
            this.audio.playClick();
            this.scene.start('MenuScene');
        });
    }
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsScene;
}
