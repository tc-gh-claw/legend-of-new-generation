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
        this.quizActive = false; // 防止重複啟動QuizScene
        
        // 🔥 連擊系統初始化
        this.comboCount = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 0.1; // 每連擊增加10%傷害
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 播放戰鬥背景音樂
        this.audio.playBattleBgm();
        
        // 創建戰鬥背景
        this.createBattleBackground();
        
        // 創建角色
        this.createCharacters();
        
        // 創建UI
        this.createBattleUI();
        
        // 創建連擊顯示
        this.createComboDisplay();
        
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
        
        // 應用玩家顏色（根據等級）
        const playerColor = this.game.globals.playerColor || 0xffffff;
        this.playerSprite.setTint(playerColor);
        
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
        
        // 攻擊按鈕（數學題目）- 注意：坐標相對於 uiPanel (y=450)
        this.createActionButton(150, 30, '🔢 數學攻擊', 0x3498db, function() {
            this.startQuiz('math');
        });
        
        // 技能按鈕（科學題目）
        this.createActionButton(400, 30, '⚗️ 科學魔法', 0x2ecc71, function() {
            this.startQuiz('science');
        });
        
        // 治療按鈕（英文題目）
        this.createActionButton(650, 30, '📖 英文治療', 0xf39c12, function() {
            this.startQuiz('english');
        });
        
        // 防禦按鈕（常識題目）
        this.createActionButton(275, 100, '🛡️ 常識防禦', 0x9b59b6, function() {
            this.startQuiz('general');
        });
        
        // 逃跑按鈕
        this.createActionButton(525, 100, '🏃 逃跑', 0xe74c3c, function() {
            this.tryEscape();
        });
        
        // 戰鬥訊息區域 (相對於 uiPanel)
        this.battleMessage = this.add.text(400, -30, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.uiPanel.add(this.battleMessage);
        
        // 隱藏按鈕函數
        this.hideActionButtons = () => {
            this.actionButtons.setVisible(false);
        };
        
        this.showActionButtons = () => {
            this.actionButtons.setVisible(true);
        };
    }
    
    // 🔥 創建連擊顯示
    createComboDisplay() {
        // 連擊數顯示容器
        this.comboContainer = this.add.container(400, 100);
        
        // 連擊背景光環
        this.comboBg = this.add.circle(0, 0, 45, 0xff6600, 0.3);
        this.comboContainer.add(this.comboBg);
        
        // 連擊數文字
        this.comboText = this.add.text(0, -5, '0', {
            fontSize: '36px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            stroke: '#ff6600',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboText);
        
        // 連擊標籤
        this.comboLabel = this.add.text(0, 20, 'COMBO', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff6600'
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboLabel);
        
        // 傷害加成顯示
        this.comboBonusText = this.add.text(0, 38, '+0%', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffff00'
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboBonusText);
        
        // 初始隱藏
        this.comboContainer.setVisible(false);
        this.comboContainer.setScale(0);
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
            this.audio.playHover();
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
                this.audio.playClick();
                // 使用 call 確保 callback 中嘅 this 指向正確
                callback.call(this);
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
        // 防止重複啟動
        if (this.quizActive) return;
        this.quizActive = true;
        
        this.hideActionButtons();
        
        const self = this; // 保存 this 引用
        
        // 傳遞到QuizScene
        this.scene.launch('QuizScene', {
            subject: subject,
            onComplete: function(result) {
                self.quizActive = false;
                self.handleQuizResult(result);
            }
        });
    }
    
    // 🔥 更新連擊顯示
    updateComboDisplay() {
        if (this.comboCount <= 0) {
            // 隱藏連擊顯示
            this.tweens.add({
                targets: this.comboContainer,
                scale: 0,
                duration: 300,
                ease: 'Back.in',
                onComplete: () => {
                    this.comboContainer.setVisible(false);
                }
            });
            return;
        }
        
        // 顯示連擊容器
        this.comboContainer.setVisible(true);
        
        // 計算傷害加成
        const bonusPercent = Math.floor(this.comboCount * this.comboMultiplier * 100);
        
        // 更新文字
        this.comboText.setText(this.comboCount.toString());
        this.comboBonusText.setText(`+${bonusPercent}%`);
        
        // 根據連擊數改變顏色
        let color = '#ffffff';
        let strokeColor = '#ff6600';
        if (this.comboCount >= 10) {
            color = '#ff0000';
            strokeColor = '#ffff00';
        } else if (this.comboCount >= 5) {
            color = '#ff6600';
            strokeColor = '#ff0000';
        } else if (this.comboCount >= 3) {
            color = '#ffff00';
            strokeColor = '#ff6600';
        }
        
        this.comboText.setStyle({
            fontSize: '36px',
            fontFamily: 'Microsoft JhengHei',
            fill: color,
            stroke: strokeColor,
            strokeThickness: 4
        });
        
        // 彈出動畫
        this.tweens.add({
            targets: this.comboContainer,
            scale: { from: 0.5, to: 1.2 },
            duration: 200,
            yoyo: true,
            ease: 'Back.out'
        });
        
        // 背景脈動效果
        this.tweens.add({
            targets: this.comboBg,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.3, to: 0.6 },
            duration: 400,
            yoyo: true
        });
    }
    
    // 🔥 增加連擊
    addCombo() {
        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }
        this.updateComboDisplay();
        
        // 連擊音效（高連擊時播放特殊音效）
        if (this.comboCount === 5 || this.comboCount === 10) {
            // 里程碑連擊特效
            this.createComboMilestoneEffect();
        }
    }
    
    // 🔥 重置連擊
    resetCombo() {
        if (this.comboCount > 0) {
            this.comboCount = 0;
            this.updateComboDisplay();
        }
    }
    
    // 🔥 連擊里程碑特效
    createComboMilestoneEffect() {
        const milestoneText = this.add.text(400, 200, `${this.comboCount} COMBO!`, {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffff00',
            stroke: '#ff0000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: milestoneText,
            y: 150,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1500,
            ease: 'Power2',
            onComplete: () => milestoneText.destroy()
        });
        
        // 煙花效果
        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(400, 250, 8, [0xff0000, 0xffff00, 0xff6600][i % 3]);
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            
            this.tweens.add({
                targets: particle,
                x: 400 + Math.cos(angle) * distance,
                y: 250 + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    handleQuizResult(result) {
        // 關閉QuizScene
        this.scene.stop('QuizScene');
        
        if (result.correct) {
            // 🔥 答對了 - 增加連擊
            this.addCombo();
            
            // 播放魔法音效（根據科目）
            this.audio.playMagic(result.subject || 'general');
            
            // 英文治療：增加HP，其他科目：造成傷害
            if (result.subject === 'english') {
                // 治療效果
                const healAmount = result.damage || 20;
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + healAmount);
                
                // 更新玩家血條
                this.updatePlayerHpBar();
                
                // 治療特效
                this.createHealEffect(this.playerSprite.x, this.playerSprite.y);
                
                this.showMessage(`✅ 答對了！回復 ${healAmount} 點HP！連擊x${this.comboCount}`);
                
            } else {
                // 攻擊效果 - 基於等級和攻擊力計算傷害
                const baseDamage = result.damage || 20;
                const playerLevel = this.playerData.level || 1;
                const playerAttack = this.game.globals.playerAttack || (10 + (playerLevel - 1) * 2);
                
                // 傷害公式：基礎傷害 + (攻擊力 * 0.5) + (等級 * 2)
                let damage = Math.floor(baseDamage + (playerAttack * 0.5) + (playerLevel * 2));
                
                // 🔥 連擊傷害加成
                const comboBonus = 1 + (this.comboCount * this.comboMultiplier);
                damage = Math.floor(damage * comboBonus);
                
                // Boss戰額外加成
                if (this.enemyData.isBoss || this.enemyData.type === 'boss') {
                    damage = Math.floor(damage * 1.2); // 對Boss有20%傷害加成
                }
                
                // 暴擊機率 (等級越高暴擊率越高)
                const critChance = Math.min(0.1 + (playerLevel * 0.02), 0.5); // 最高50%暴擊率
                let isCrit = Math.random() < critChance;
                
                if (isCrit) {
                    damage = Math.floor(damage * 2);
                    this.showMessage(`💥 暴擊！造成 ${damage} 點傷害！連擊x${this.comboCount}`);
                } else {
                    this.showMessage(`✅ 答對了！造成 ${damage} 點傷害！連擊x${this.comboCount}`);
                }
                
                // 技能特效
                this.createSkillEffect(result.subject, this.enemySprite.x, this.enemySprite.y);
                
                this.dealDamageToEnemy(damage);
                
                // 暴擊特效
                if (isCrit) {
                    this.createCritEffect(this.enemySprite.x, this.enemySprite.y);
                }
                
                // 攻擊動畫
                this.time.delayedCall(300, () => {
                    this.animateAttack(this.playerSprite, this.enemySprite);
                });
            }
        } else {
            // 🔥 答錯了 - 重置連擊
            this.resetCombo();
            
            // 答錯了
            this.audio.playMiss();
            this.showMessage('❌ 答錯了！這回合沒有效果...');
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
            
            // 播放攻擊和受擊音效
            this.audio.playAttack();
            this.time.delayedCall(200, () => {
                this.audio.playHit();
            });
            
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
                
                // 播放攻擊特效
                this.createAttackEffect(target.x, target.y);
            }
        });
    }
    
    createAttackEffect(x, y) {
        // 基礎攻擊特效 - 閃光
        const flash = this.add.circle(x, y, 40, 0xffffff, 0.8);
        
        this.tweens.add({
            targets: flash,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 300,
            onComplete: () => flash.destroy()
        });
        
        // 傷害數字效果
        this.createDamageNumber(x, y, '💥');
    }
    
    createSkillEffect(skillType, targetX, targetY) {
        // 根據技能類型創建不同的特效
        switch(skillType) {
            case 'math':
                this.createMathEffect(targetX, targetY);
                break;
            case 'science':
                this.createScienceEffect(targetX, targetY);
                break;
            case 'english':
                this.createEnglishEffect(targetX, targetY);
                break;
            case 'general':
                this.createGeneralEffect(targetX, targetY);
                break;
            default:
                this.createAttackEffect(targetX, targetY);
        }
    }
    
    createMathEffect(x, y) {
        // 數學技能 - 計算符號和數字
        const symbols = ['+', '-', '×', '÷', '=', '∑', '√'];
        
        for (let i = 0; i < 8; i++) {
            const symbol = this.add.text(x, y, symbols[i % symbols.length], {
                fontSize: '24px',
                fill: '#3498db'
            }).setOrigin(0.5);
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 60;
            
            this.tweens.add({
                targets: symbol,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                duration: 600,
                ease: 'Power2',
                onComplete: () => symbol.destroy()
            });
        }
        
        // 中央閃光
        const flash = this.add.circle(x, y, 50, 0x3498db, 0.6);
        this.tweens.add({
            targets: flash,
            scale: { from: 0, to: 2 },
            alpha: { from: 0.6, to: 0 },
            duration: 500,
            onComplete: () => flash.destroy()
        });
    }
    
    createScienceEffect(x, y) {
        // 科學技能 - 元素和分子效果
        const elements = ['⚗️', '🔬', '🧪', '⚛️', '💨', '🔥', '💧'];
        
        for (let i = 0; i < 6; i++) {
            const element = this.add.text(x, y, elements[i % elements.length], {
                fontSize: '28px'
            }).setOrigin(0.5);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            
            this.tweens.add({
                targets: element,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                rotation: Math.PI * 2,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => element.destroy()
            });
        }
        
        // 能量爆發
        const burst = this.add.circle(x, y, 30, 0x2ecc71, 0.7);
        this.tweens.add({
            targets: burst,
            scale: { from: 1, to: 3 },
            alpha: { from: 0.7, to: 0 },
            duration: 600,
            onComplete: () => burst.destroy()
        });
    }
    
    createEnglishEffect(x, y) {
        // 英文技能 - 字母飛散效果
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < 10; i++) {
            const letter = this.add.text(x, y, letters[Math.floor(Math.random() * letters.length)], {
                fontSize: '20px',
                fill: '#f39c12'
            }).setOrigin(0.5);
            
            const angle = (i / 10) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            
            this.tweens.add({
                targets: letter,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 1.5 },
                duration: 700,
                ease: 'Power2',
                onComplete: () => letter.destroy()
            });
        }
        
        // 書本光環
        const bookGlow = this.add.circle(x, y, 40, 0xf39c12, 0.5);
        this.tweens.add({
            targets: bookGlow,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 0.5, to: 0 },
            duration: 600,
            onComplete: () => bookGlow.destroy()
        });
    }
    
    createGeneralEffect(x, y) {
        // 常識技能 - 盾牌和防護效果
        const shield = this.add.text(x, y, '🛡️', {
            fontSize: '60px'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: shield,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            rotation: Math.PI / 4,
            duration: 800,
            ease: 'Power2',
            onComplete: () => shield.destroy()
        });
        
        // 防護光環
        for (let i = 0; i < 4; i++) {
            const ring = this.add.circle(x, y, 30 + i * 20, 0x9b59b6, 0.3);
            
            this.tweens.add({
                targets: ring,
                scale: { from: 1, to: 1.5 },
                alpha: { from: 0.3, to: 0 },
                duration: 600,
                delay: i * 100,
                onComplete: () => ring.destroy()
            });
        }
    }
    
    createDamageNumber(x, y, text) {
        const damageText = this.add.text(x, y - 50, text, {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }
    
    createHealEffect(x, y) {
        // 治療特效
        const healIcon = this.add.text(x, y, '💚', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: healIcon,
            y: y - 60,
            alpha: 0,
            scale: { from: 1, to: 1.5 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => healIcon.destroy()
        });
        
        // 綠色粒子
        for (let i = 0; i < 6; i++) {
            const particle = this.add.circle(x, y, 5, 0x2ecc71);
            
            const angle = (i / 6) * Math.PI * 2;
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40 - 30,
                alpha: 0,
                duration: 800,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createCritEffect(x, y) {
        // 暴擊特效 - 紅色光芒爆發
        const critText = this.add.text(x, y - 80, '💥 CRIT!', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: critText,
            y: y - 150,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => critText.destroy()
        });
        
        // 紅色爆發光環
        for (let i = 0; i < 3; i++) {
            const ring = this.add.circle(x, y, 30 + i * 20, 0xff0000, 0.5);
            
            this.tweens.add({
                targets: ring,
                scale: { from: 1, to: 2.5 },
                alpha: { from: 0.5, to: 0 },
                duration: 600,
                delay: i * 100,
                onComplete: () => ring.destroy()
            });
        }
        
        // 火焰粒子
        for (let i = 0; i < 8; i++) {
            const flame = this.add.text(x, y, '🔥', {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            
            this.tweens.add({
                targets: flame,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 30,
                alpha: 0,
                rotation: Math.PI * 2,
                duration: 800,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => flame.destroy()
            });
        }
    }
    
    createVictoryEffect() {
        // 勝利特效
        for (let i = 0; i < 20; i++) {
            const confetti = this.add.text(
                Phaser.Math.Between(100, 700),
                600,
                ['🎉', '✨', '⭐', '🎊'][Math.floor(Math.random() * 4)],
                { fontSize: '24px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: confetti,
                y: Phaser.Math.Between(100, 400),
                x: confetti.x + Phaser.Math.Between(-100, 100),
                rotation: Math.PI * 2,
                duration: Phaser.Math.Between(1000, 2000),
                ease: 'Power2',
                onComplete: () => confetti.destroy()
            });
        }
    }
    
    tryEscape() {
        this.hideActionButtons();
        
        // 🔥 逃跑重置連擊
        this.resetCombo();
        
        const escapeChance = 0.6; // 60%逃跑成功率
        
        if (Math.random() < escapeChance) {
            this.audio.playConfirm();
            this.showMessage('🏃 成功逃跑了！');
            this.audio.stopBgm(500);
            this.time.delayedCall(1500, () => {
                this.scene.start(this.returnScene);
            });
        } else {
            this.audio.playMiss();
            this.showMessage('❌ 逃跑失敗！');
            this.time.delayedCall(1500, () => {
                this.enemyTurn();
            });
        }
    }
    
    endBattle(victory) {
        this.battleEnded = true;

        if (victory) {
            // 基礎經驗值
            let expGain = 20;
            let goldGain = 10;

            // 🔥 連擊獎勵經驗值
            const comboExpBonus = Math.floor(this.maxCombo * 2);
            expGain += comboExpBonus;

            // Boss戰獎勵加成
            const isBoss = this.enemyData.isBoss || this.enemyData.type === 'boss' || this.enemyData.bossId;
            if (isBoss) {
                expGain = this.enemyData.exp || 100;  // Boss給大量經驗
                goldGain = this.enemyData.gold || 200; // Boss給大量金幣
                this.showMessage(`👑 擊敗Boss！獲得 ${expGain} 經驗值！最高連擊x${this.maxCombo}`);
            } else {
                if (this.maxCombo > 0) {
                    this.showMessage(`🎉 戰鬥勝利！獲得 ${expGain} 經驗值！(連擊獎勵+${comboExpBonus})`);
                } else {
                    this.showMessage(`🎉 戰鬥勝利！獲得 ${expGain} 經驗值！`);
                }
            }

            // 播放勝利音效
            this.audio.playVictory();

            // 勝利動畫
            this.tweens.add({
                targets: this.enemySprite,
                alpha: 0,
                scale: 0,
                duration: 500
            });

            // 檢查升級 - 使用新的100經驗值系統
            const levelUpResult = LevelUpScene.checkLevelUp(this.playerData, expGain);

            if (levelUpResult.leveledUp) {
                this.playerData.level = levelUpResult.newLevel;

                this.time.delayedCall(1500, () => {
                    this.audio.playLevelUp();
                    this.showMessage(`⭐ 升級了！達到等級 ${this.playerData.level}！最高連擊x${this.maxCombo}`);

                    // 延遲後進入升級場景
                    this.time.delayedCall(2000, () => {
                        this.scene.launch('LevelUpScene', {
                            player: this.playerData,
                            newLevel: this.playerData.level,
                            onComplete: (result) => {
                                this.scene.stop('LevelUpScene');
                                this.returnToWorld();
                            }
                        });
                    });
                });
            } else {
                // 沒升級，直接返回
                this.time.delayedCall(3000, () => {
                    this.returnToWorld();
                });
            }
        } else {
            // 失敗
            this.audio.playDefeat();
            this.showMessage('💀 戰鬥失敗...');
            this.playerData.hp = Math.floor(this.playerData.maxHp * 0.3); // 保留30% HP

            this.time.delayedCall(3000, () => {
                this.returnToWorld();
            });
        }

        // 保存數據
        this.game.globals.playerHP = this.playerData.hp;
        this.game.globals.playerExp = this.playerData.exp;
        this.game.globals.playerLevel = this.playerData.level;
    }

    returnToWorld() {
        // 返回世界地圖
        this.scene.start(this.returnScene);
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
