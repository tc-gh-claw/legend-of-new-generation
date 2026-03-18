// main.js - 遊戲主入口

// 遊戲配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    pixelArt: true, // 啟用像素風格渲染
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        MenuScene,
        WorldScene,
        BattleScene,
        QuizScene
    ]
};

// 初始化遊戲
const game = new Phaser.Game(config);

// 遊戲全域數據
game.globals = {
    playerName: '',
    playerClass: '', // math, science, english, general
    playerLevel: 1,
    playerExp: 0,
    playerHP: 100,
    playerMaxHP: 100,
    playerMP: 50,
    playerMaxMP: 50,
    inventory: [],
    currentMap: 'village',
    completedLevels: [],
    unlockedSubjects: ['math'] // 逐步解鎖其他學科
};

// 移除載入提示
document.querySelector('.loading').style.display = 'none';

console.log('🎮 新世代傳說 - 遊戲初始化完成！');
console.log('⚔️ Legend of the New Generation - Game Initialized!');
