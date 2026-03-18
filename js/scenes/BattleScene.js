/**
 * BattleScene - 戰鬥場景
 * 回合制戰鬥系統，結合問答機制
 */

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerData = data.player;
        this.enemyData = data.enemy;
        this.returnScene = data.returnScene || 'WorldScene';
        this.turn = 'player'; // 'player' 或 'enemy'
        this.battleEnded = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 創建戰鬥背景
        this.createBattleBackground();
        
        // 創建角色
        this.createCharacters();
        
        // 創建UI
        this.createBattleUI();
        
        // 開始戰鬥
        this.startBattle();
    }
    
    createBattleBackground() {
        // 戰鬥背景
        const graphics = this.add.graphics();
        
        // 漸層背景
        for (let y = 0; y < 600; y += 4) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 44, g: 62, b: 80 },
                { r: 52, g: 73, b: 94 },
                600, y
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, y, 800, 4);
        }
        
        // 戰鬥場地
        graphics.fillStyle(0x2c3e50, 0.5);
        graphics.fillEllipse(200, 350, 200, 80);
        graphics.fillEllipse(600, 350, 200, 80);
    }
    
    createCharacters() {
        const width = this.cameras.main.width;
        
        // 玩家（左側）
        this.playerSprite = this.add.sprite(200, 300, 'player');
        this.playerSprite.setScale(2);
        this.playerSprite.setFlipX(true);
        
        // 玩家血條背景
        this.playerHpBg = this.add.rectangle(200, 240, 120, 16, 0x000000);
        this.playerHpBar = this.add.rectangle(140, 240, 120, 16, 0xe74c3c);
        this.playerHpBar.setOrigin(0, 0.5);
        
        // 玩家名稱
        this.add.text(200, 220, '勇者', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // 敵人（右側）
        const enemyTexture = this.enemyData.type || 'enemy-slime';
        this.enemySprite = this.add.sprite(600, 300, enemyTexture);
        this.enemySprite.setScale(2.5);
        
        // 敵人血條
        this.enemyHpBg = this.add.rectangle(600, 220, 120, 16, 0x000000);
        this.enemyHpBar = this.add.rectangle(540, 220, 120, 16, 0xe74c3c);
        this.enemyHpBar.setOrigin(0, 0.5);
        
        // 敵人名稱
        this.add.text(600, 200, this.enemyData.name, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff6b6b'
        }).setOrigin(0.5);
        
        // 進場動畫
        this.tweens.add({
            targets: this.playerSprite,
            x: { from: -50, to: 200 },
            duration: 500,
            ease: 'Back.out'
        });
        
        this.tweens.add({
            targets: this.enemySprite,
            x: { from: 850, to: 600 },
            duration: 500,
            ease: 'Back.out'
        });
    }
    
    createBattleUI() {
        const width = this.cameras.main.width;
        
        // 底部UI面板
        this.uiPanel = this.add.container(0, 450);
        
        const panelBg = this.add.rectangle(400, 75, 800, 150, 0x000000, 0.8);
        this.uiPanel.add(panelBg);
        
        // 行動按鈕容器
        this.actionButtons = this.add.container(0, 0);
        this.uiPanel.add(this.actionButtons);
        
        // 攻擊按鈕（數學題目）
        this.createActionButton(150, 480, '🔢 數學攻擊', 0x3498db, () => {
            this.startQuiz('math');
        });
        
        // 技能按鈕（科學題目）
        this.createActionButton(400, 480, '⚗️ 科學魔法', 0x2ecc71, () => {
            this.startQuiz('science');
        });
        
        // 治療按鈕（英文題目）
        this.createActionButton(650, 480, '📖 英文治療', 0xf39c12, () => {
            this.startQuiz('english');
        });
        
        // 防禦按鈕（常識題目）
        this.createActionButton(275, 550, '🛡️ 常識防禦', 0x9b59b6, () => {
            this.startQuiz('general');
        });
        
        // 逃跑按鈕
        this.createActionButton(525, 550, '🏃 逃跑', 0xe74c3c, () => {
            this.tryEscape();
        });
        
        // 戰鬥訊息區域
        this.battleMessage = this.add.text(400, 420, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // 隱藏按鈕函數
        this.hideActionButtons = () => {
            this.actionButtons.setVisible(false);
        };
        
        this.showActionButtons = () => {
            this.actionButtons.setVisible(true);
        };
    }
    
    createActionButton(x, y, text, color, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 180, 50, color);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        button.add([bg, label]);
        this.actionButtons.add(button);
        
        // 互動效果
        bg.on('pointerover', () => {
            bg.setScale(1.05);
            bg.setFillStyle(Phaser.Display.Color.GetColor(
                Math.min(255, ((color >> 16) & 0xFF) + 30),
                Math.min(255, ((color >> 8) & 0xFF) + 30),
                Math.min(255, (color & 0xFF) + 30)
            ));
        });
        
        bg.on('pointerout', () => {
            bg.setScale(1);
            bg.setFillStyle(color);
        });
        
        bg.on('pointerdown', () => {
            bg.setScale(0.95);
        });
        
        bg.on('pointerup', () => {
            bg.setScale(1.05);
            if (!this.battleEnded && this.turn === 'player') {
                callback();
            }
        });
    }
    
    startBattle() {
        this.showMessage('⚔️ 戰鬥開始！遭遇了 ' + this.enemyData.name + '！');
        
        this.time.delayedCall(1500, () => {
            this.playerTurn();
        });
    }
    
    playerTurn() {
        if (this.battleEnded) return;
        
        this.turn = 'player';
        this.showMessage('🎯 你的回合！選擇行動...');
        this.showActionButtons();
    }
    
    startQuiz(subject) {
        this.hideActionButtons();
        
        // 傳遞到QuizScene
        this.scene.launch('QuizScene', {
            subject: subject,
            onComplete: (result) => {
                this.handleQuizResult(result);
            }
        });
    }
    
    handleQuizResult(result) {
        // 關閉QuizScene
        this.scene.stop('QuizScene');
        
        if (result.correct) {
            // 答對了！造成傷害
            const damage = result.damage || 20;
            this.dealDamageToEnemy(damage);
            this.showMessage(`✅ 答對了！造成 ${damage} 點傷害！`);
            
            // 攻擊動畫
            this.animateAttack(this.playerSprite, this.enemySprite);
        } else {
            // 答錯了
            this.showMessage('❌ 答錯了！這回合沒有造成傷害...');
        }
        
        // 檢查戰鬥結束
        if (this.enemyData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(true);
            });
        } else {
            this.time.delayedCall(2000, () => {
                this.enemyTurn();
            });
        }
    }
    
    enemyTurn() {
        if (this.battleEnded) return;
        
        this.turn = 'enemy';
        this.hideActionButtons();
        this.showMessage(`👹 ${this.enemyData.name} 的回合！`);
        
        this.time.delayedCall(1000, () => {
            // 敵人攻擊
            const damage = Phaser.Math.Between(8, 15);
            this.playerData.hp = Math.max(0, this.playerData.hp - damage);
            
            // 更新血條
            this.updatePlayerHpBar();
            
            // 攻擊動畫
            this.animateAttack(this.enemySprite, this.playerSprite);
            
            this.showMessage(`💥 受到了 ${damage} 點傷害！`);
            
            // 檢查玩家死亡
            if (this.playerData.hp <= 0) {
                this.time.delayedCall(1500, () => {
                    this.endBattle(false);
                });
            } else {
                this.time.delayedCall(2000, () => {
                    this.playerTurn();
                });
            }
        });
    }
    
    dealDamageToEnemy(damage) {
        this.enemyData.hp = Math.max(0, this.enemyData.hp - damage);
        
        // 更新血條
        const hpPercent = this.enemyData.hp / this.enemyData.maxHp;
        this.enemyHpBar.setScale(hpPercent, 1);
        
        // 受傷閃爍效果
        this.tweens.add({
            targets: this.enemySprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 3
        });
    }
    
    updatePlayerHpBar() {
        const hpPercent = this.playerData.hp / this.playerData.maxHp;
        this.playerHpBar.setScale(hpPercent, 1);
        
        // 改變顏色
        if (hpPercent < 0.3) {
            this.playerHpBar.setFillStyle(0xe74c3c);
        } else if (hpPercent < 0.6) {
            this.playerHpBar.setFillStyle(0xf39c12);
        } else {
            this.playerHpBar.setFillStyle(0x2ecc71);
        }
    }
    
    animateAttack(attacker, target) {
        // 攻擊者前移
        const originalX = attacker.x;
        const direction = attacker.x < target.x ? 1 : -1;
        
        this.tweens.add({
            targets: attacker,
            x: target.x - (50 * direction),
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                // 目標受擊震動
                this.tweens.add({
                    targets: target,
                    x: target.x + 10,
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
            }
        });
    }
    
    tryEscape() {
        this.hideActionButtons();
        
        const escapeChance = 0.6; // 60%逃跑成功率
        
        if (Math.random() < escapeChance) {
            this.showMessage('🏃 成功逃跑了！');
            this.time.delayedCall(1500, () => {
                this.scene.start(this.returnScene);
            });
        } else {
            this.showMessage('❌ 逃跑失敗！');
            this.time.delayedCall(1500, () => {
                this.enemyTurn();
            });
        }
    }
    
    endBattle(victory) {
        this.battleEnded = true;
        
        if (victory) {
            // 勝利
            const expGain = 20;
            this.playerData.exp += expGain;
            
            this.showMessage(`🎉 戰鬥勝利！獲得 ${expGain} 經驗值！`);
            
            // 勝利動畫
            this.tweens.add({
                targets: this.enemySprite,
                alpha: 0,
                scale: 0,
                duration: 500
            });
            
            // 檢查升級
            if (this.playerData.exp >= this.playerData.level * 50) {
                this.playerData.level++;
                this.showMessage(`⭐ 升級了！達到等級 ${this.playerData.level}！`);
            }
        } else {
            // 失敗
            this.showMessage('💀 戰鬥失敗...被傳送回村莊');
            this.playerData.hp = 1; // 保留1點HP
        }
        
        // 保存數據
        this.game.globals.playerHP = this.playerData.hp;
        this.game.globals.playerExp = this.playerData.exp;
        this.game.globals.playerLevel = this.playerData.level;
        
        // 返回世界地圖
        this.time.delayedCall(3000, () => {
            this.scene.start(this.returnScene);
        });
    }
    
    showMessage(text) {
        this.battleMessage.setText(text);
        
        // 文字彈出效果
        this.tweens.add({
            targets: this.battleMessage,
            scale: { from: 0.8, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }
}
