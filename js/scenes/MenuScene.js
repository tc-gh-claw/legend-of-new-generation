/**
 * MenuScene - 主選單場景
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 播放主選單背景音樂
        this.audio.playMenuBgm();
        
        // 背景
        this.createBackground();
        
        // 遊戲標題
        const titleText = this.add.text(width / 2, 120, '⚔️ 新世代傳說 ⚔️', {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e94560',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 副標題
        const subtitleText = this.add.text(width / 2, 180, 'Legend of the New Generation', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#feca57'
        }).setOrigin(0.5);
        
        // 描述文字
        const descText = this.add.text(width / 2, 230, '📚 全科知識RPG冒險遊戲', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        
        // 創建選單按鈕
        this.createMenuButton(width / 2, 320, '🎮 開始冒險', () => {
            this.startGame();
        });
        
        this.createMenuButton(width / 2, 400, '📖 繼續遊戲', () => {
            this.loadGame();
        });
        
        this.createMenuButton(width / 2, 480, '⚙️ 設定', () => {
            this.openSettings();
        });
        
        // 版本號
        this.add.text(width - 10, height - 10, 'v0.1.0', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#666666'
        }).setOrigin(1, 1);
        
        // 動畫效果
        this.tweens.add({
            targets: titleText,
            scale: { from: 0.9, to: 1.1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    createBackground() {
        // 創建星空背景效果
        const graphics = this.add.graphics();
        
        // 漸層背景
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
        
        // 星星
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 400);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
        
        // 添加閃爍動畫
        this.time.addEvent({
            delay: 100,
            callback: () => {
                const starX = Phaser.Math.Between(0, 800);
                const starY = Phaser.Math.Between(0, 400);
                const star = this.add.circle(starX, starY, 2, 0xffffff);
                star.setAlpha(0);
                
                this.tweens.add({
                    targets: star,
                    alpha: { from: 0, to: 1 },
                    duration: 500,
                    yoyo: true,
                    onComplete: () => star.destroy()
                });
            },
            loop: true
        });
    }
    
    createMenuButton(x, y, text, callback) {
        const buttonContainer = this.add.container(x, y);
        
        // 按鈕背景
        const bg = this.add.image(0, 0, 'ui-button');
        bg.setInteractive({ useHandCursor: true });
        
        // 按鈕文字
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        buttonContainer.add([bg, buttonText]);
        
        // 互動效果
        bg.on('pointerover', () => {
            bg.setTexture('ui-button-hover');
            buttonContainer.setScale(1.05);
            this.audio.playHover();
        });
        
        bg.on('pointerout', () => {
            bg.setTexture('ui-button');
            buttonContainer.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            buttonContainer.setScale(0.95);
        });
        
        bg.on('pointerup', () => {
            buttonContainer.setScale(1.05);
            this.audio.playClick();
            callback();
        });
        
        return buttonContainer;
    }
    
    startGame() {
        this.audio.playConfirm();
        
        // 檢查是否有存檔
        const hasSave = localStorage.getItem('lng-save');
        
        if (hasSave) {
            // 顯示確認對話框
            this.showConfirmDialog('已有存檔，開始新遊戲會覆蓋進度，確定嗎？', () => {
                // 清除舊存檔
                localStorage.removeItem('lng-save');
                this.audio.stopBgm();
                this.scene.start('WorldScene');
            });
        } else {
            this.audio.stopBgm();
            this.scene.start('WorldScene');
        }
    }
    
    loadGame() {
        this.audio.playClick();
        const saveData = localStorage.getItem('lng-save');
        
        if (saveData) {
            const data = JSON.parse(saveData);
            this.game.globals = { ...this.game.globals, ...data };
            this.audio.stopBgm();
            this.scene.start('WorldScene');
        } else {
            this.audio.playCancel();
            this.showDialog('沒有找到存檔！');
        }
    }
    
    openSettings() {
        this.audio.playClick();
        this.scene.start('SettingsScene');
    }
    
    showDialog(message) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 對話框背景
        const dialog = this.add.container(width / 2, height / 2);
        
        const bg = this.add.image(0, 0, 'ui-dialog');
        
        const text = this.add.text(0, -10, message, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);
        
        const hint = this.add.text(0, 35, '(點擊任意處關閉)', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        
        dialog.add([bg, text, hint]);
        dialog.setDepth(100);
        
        // 點擊關閉
        this.input.once('pointerdown', () => {
            dialog.destroy();
        });
    }
    
    showConfirmDialog(message, onConfirm) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const dialog = this.add.container(width / 2, height / 2);
        dialog.setDepth(100);
        
        // 背景遮罩
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setPosition(width / 2, height / 2);
        overlay.setDepth(99);
        
        const bg = this.add.image(0, 0, 'ui-dialog');
        
        const text = this.add.text(0, -20, message, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);
        
        dialog.add([bg, text]);
        
        // 確定按鈕
        const confirmBtn = this.createSmallButton(-80, 30, '✓ 確定', () => {
            overlay.destroy();
            dialog.destroy();
            onConfirm();
        });
        dialog.add(confirmBtn);
        
        // 取消按鈕
        const cancelBtn = this.createSmallButton(80, 30, '✗ 取消', () => {
            overlay.destroy();
            dialog.destroy();
        });
        dialog.add(cancelBtn);
    }
    
    createSmallButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 100, 40, 0xe94560);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([bg, label]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0xff6b6b);
            this.audio.playHover();
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xe94560);
        });
        
        bg.on('pointerup', () => {
            this.audio.playClick();
            callback();
        });
        
        return container;
    }
}
