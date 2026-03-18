/**
 * BootScene - 遊戲啟動場景
 * 負責載入所有遊戲素材
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 創建載入畫面
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 載入進度條背景
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
        
        // 載入文字
        const loadingText = this.add.text(width / 2, height / 2 - 50, '載入中...', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const percentText = this.add.text(width / 2, height / 2 - 5, '0%', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        
        // 載入進度事件
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xe94560, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });
        
        this.load.on('fileprogress', (file) => {
            assetText.setText('載入: ' + file.key);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });
        
        // ===== 載入素材 =====
        
        // 臨時用圖形（稍後替換為真實素材）
        // 玩家角色
        this.load.setBaseURL('data:image/svg+xml;base64,');
        
        // 載入JSON題目數據
        this.load.json('questions-math', 'assets/data/questions-math.json');
        this.load.json('questions-science', 'assets/data/questions-science.json');
        this.load.json('questions-english', 'assets/data/questions-english.json');
        this.load.json('questions-general', 'assets/data/questions-general.json');
        
        // 載入音效資源
        AudioManager.preload(this);
        
        // 使用程式生成臨時素材
        this.generatePlaceholderAssets();
    }

    create() {
        // 創建臨時動畫
        this.createAnimations();
        
        // 初始化音效管理器
        AudioManager.init(this);
        
        // 進入主選單
        this.scene.start('MenuScene');
    }
    
    generatePlaceholderAssets() {
        // 創建臨時圖形作為素材占位
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // 玩家精靈 (32x32)
        graphics.fillStyle(0x3498db);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player', 32, 32);
        graphics.clear();
        
        // 敵人精靈 - 史萊姆
        graphics.fillStyle(0x2ecc71);
        graphics.fillCircle(16, 20, 12);
        graphics.generateTexture('enemy-slime', 32, 32);
        graphics.clear();
        
        // 敵人精靈 - 哥布林
        graphics.fillStyle(0xe74c3c);
        graphics.fillRect(4, 8, 24, 24);
        graphics.generateTexture('enemy-goblin', 32, 32);
        graphics.clear();
        
        // 敵人精靈 - 黑暗法師
        graphics.fillStyle(0x8e44ad);
        graphics.fillTriangle(16, 4, 4, 28, 28, 28);
        graphics.generateTexture('enemy-mage', 32, 32);
        graphics.clear();
        
        // 地圖圖塊
        graphics.fillStyle(0x27ae60);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('tile-grass', 32, 32);
        graphics.clear();
        
        graphics.fillStyle(0x95a5a6);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('tile-stone', 32, 32);
        graphics.clear();
        
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('tile-wood', 32, 32);
        graphics.clear();
        
        // UI元素
        graphics.fillStyle(0x2c3e50, 0.9);
        graphics.fillRoundedRect(0, 0, 200, 60, 10);
        graphics.generateTexture('ui-button', 200, 60);
        graphics.clear();
        
        graphics.fillStyle(0xe94560, 0.9);
        graphics.fillRoundedRect(0, 0, 200, 60, 10);
        graphics.generateTexture('ui-button-hover', 200, 60);
        graphics.clear();
        
        // 對話框
        graphics.fillStyle(0x000000, 0.8);
        graphics.fillRoundedRect(0, 0, 600, 120, 10);
        graphics.lineStyle(2, 0xffffff);
        graphics.strokeRoundedRect(0, 0, 600, 120, 10);
        graphics.generateTexture('ui-dialog', 600, 120);
        graphics.clear();
        
        // 技能圖標
        // 數學 - 計算符號
        graphics.fillStyle(0x3498db);
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(8, 15, 16, 2);
        graphics.fillRect(15, 8, 2, 16);
        graphics.generateTexture('icon-math', 32, 32);
        graphics.clear();
        
        // 科學 - 燒瓶
        graphics.fillStyle(0x2ecc71);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('icon-science', 32, 32);
        graphics.clear();
        
        // 英文 - 書本
        graphics.fillStyle(0xf39c12);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('icon-english', 32, 32);
        graphics.clear();
        
        // 常識 - 盾牌
        graphics.fillStyle(0x9b59b6);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('icon-general', 32, 32);
        graphics.clear();
    }
    
    createAnimations() {
        // 玩家行走動畫
        this.anims.create({
            key: 'player-walk-down',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 8,
            repeat: -1
        });
        
        // 敵人待機動畫
        this.anims.create({
            key: 'enemy-idle',
            frames: [
                { key: 'enemy-slime' },
            ],
            frameRate: 2,
            repeat: -1
        });
    }
}
