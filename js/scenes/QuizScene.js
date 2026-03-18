/**
 * QuizScene - 問答場景
 * 顯示題目並處理玩家回答
 */

class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });
    }

    init(data) {
        this.subject = data.subject || 'math';
        this.onComplete = data.onComplete;
        this.questions = this.getQuestionsBySubject(this.subject);
        this.currentQuestion = this.getRandomQuestion();
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 半透明背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        
        // 題目面板
        this.createQuizPanel();
        
        // 顯示題目
        this.displayQuestion();
    }
    
    createQuizPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 面板背景
        this.panel = this.add.container(width / 2, height / 2);
        
        const bg = this.add.rectangle(0, 0, 700, 400, 0x2c3e50);
        bg.setStrokeStyle(3, this.getSubjectColor());
        this.panel.add(bg);
        
        // 學科標題
        const subjectNames = {
            'math': '🔢 數學',
            'science': '⚗️ 科學',
            'english': '📖 英文',
            'general': '🌍 常識'
        };
        
        const title = this.add.text(0, -170, subjectNames[this.subject] || '題目', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.panel.add(title);
        
        // 計時器背景
        this.timerBg = this.add.rectangle(0, -130, 600, 10, 0x000000);
        this.panel.add(this.timerBg);
        
        // 計時器條
        this.timerBar = this.add.rectangle(-300, -130, 600, 10, this.getSubjectColor());
        this.timerBar.setOrigin(0, 0.5);
        this.panel.add(this.timerBar);
        
        // 題目文字區域
        this.questionText = this.add.text(0, -60, '', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);
        this.panel.add(this.questionText);
        
        // 答案按鈕區域
        this.answerButtons = this.add.container(0, 50);
        this.panel.add(this.answerButtons);
        
        // 開始計時
        this.startTimer();
    }
    
    getSubjectColor() {
        const colors = {
            'math': 0x3498db,
            'science': 0x2ecc71,
            'english': 0xf39c12,
            'general': 0x9b59b6
        };
        return colors[this.subject] || 0xffffff;
    }
    
    displayQuestion() {
        if (!this.currentQuestion) {
            // 沒有題目時使用預設
            this.currentQuestion = this.getDefaultQuestion();
        }
        
        // 顯示題目
        this.questionText.setText(this.currentQuestion.question);
        
        // 創建答案按鈕
        this.createAnswerButtons(this.currentQuestion.options);
    }
    
    createAnswerButtons(options) {
        this.answerButtons.removeAll(true);
        
        const buttonWidth = 280;
        const buttonHeight = 60;
        const spacing = 20;
        
        options.forEach((option, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            
            const x = (col === 0 ? -1 : 1) * (buttonWidth / 2 + spacing / 2);
            const y = row * (buttonHeight + spacing);
            
            const button = this.createAnswerButton(x, y, buttonWidth, buttonHeight, option, index);
            this.answerButtons.add(button);
        });
    }
    
    createAnswerButton(x, y, width, height, text, index) {
        const container = this.add.container(x, y);
        
        // 選項標籤
        const labels = ['A', 'B', 'C', 'D'];
        
        const bg = this.add.rectangle(0, 0, width, height, 0x34495e);
        bg.setStrokeStyle(2, 0x5d6d7e);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(-width / 2 + 20, 0, labels[index] + '.', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: this.getSubjectColor()
        }).setOrigin(0, 0.5);
        
        const optionText = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60 }
        }).setOrigin(0.5);
        
        container.add([bg, label, optionText]);
        
        // 互動效果
        bg.on('pointerover', () => {
            bg.setFillStyle(0x5d6d7e);
            bg.setStrokeStyle(2, this.getSubjectColor());
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x34495e);
            bg.setStrokeStyle(2, 0x5d6d7e);
        });
        
        bg.on('pointerup', () => {
            this.handleAnswer(index);
        });
        
        // 入場動畫
        container.setAlpha(0);
        container.y += 20;
        
        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 300,
            delay: index * 100,
            ease: 'Power2'
        });
        
        return container;
    }
    
    startTimer() {
        const timeLimit = 15000; // 15秒
        let remainingTime = timeLimit;
        
        this.timerEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                remainingTime -= 100;
                
                // 更新計時條
                const percent = remainingTime / timeLimit;
                this.timerBar.setScale(percent, 1);
                
                // 改變顏色
                if (percent < 0.3) {
                    this.timerBar.setFillStyle(0xe74c3c);
                } else if (percent < 0.6) {
                    this.timerBar.setFillStyle(0xf39c12);
                }
                
                // 時間到
                if (remainingTime <= 0) {
                    this.handleTimeUp();
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    handleAnswer(selectedIndex) {
        // 停止計時
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        
        const isCorrect = selectedIndex === this.currentQuestion.correct;
        
        // 顯示結果
        this.showResult(isCorrect);
        
        // 計算傷害
        const damage = isCorrect ? this.calculateDamage() : 0;
        
        // 延遲後返回結果
        this.time.delayedCall(1500, () => {
            if (this.onComplete) {
                this.onComplete({
                    correct: isCorrect,
                    damage: damage,
                    subject: this.subject
                });
            }
        });
    }
    
    handleTimeUp() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        
        this.showResult(false, '⏰ 時間到！');
        
        this.time.delayedCall(1500, () => {
            if (this.onComplete) {
                this.onComplete({
                    correct: false,
                    damage: 0,
                    subject: this.subject
                });
            }
        });
    }
    
    showResult(isCorrect, customMessage) {
        // 清除答案按鈕
        this.answerButtons.removeAll(true);
        
        const message = customMessage || (isCorrect ? '✅ 答對了！' : '❌ 答錯了！');
        const color = isCorrect ? 0x2ecc71 : 0xe74c3c;
        
        // 結果文字
        const resultText = this.add.text(0, 0, message, {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: isCorrect ? '#2ecc71' : '#e74c3c'
        }).setOrigin(0.5);
        
        this.answerButtons.add(resultText);
        
        // 顯示正確答案
        if (!isCorrect) {
            const correctAnswer = this.currentQuestion.options[this.currentQuestion.correct];
            const correctText = this.add.text(0, 60, `正確答案: ${correctAnswer}`, {
                fontSize: '18px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ffffff'
            }).setOrigin(0.5);
            this.answerButtons.add(correctText);
        }
        
        // 結果動畫
        this.tweens.add({
            targets: resultText,
            scale: { from: 0.5, to: 1.2 },
            duration: 300,
            ease: 'Back.out',
            yoyo: true
        });
        
        // 面板顏色變化
        this.panel.list[0].setStrokeStyle(5, color);
    }
    
    calculateDamage() {
        // 基礎傷害 + 隨機波動
        const baseDamage = 15;
        const variance = Phaser.Math.Between(-3, 5);
        return Math.max(5, baseDamage + variance);
    }
    
    getQuestionsBySubject(subject) {
        // 內置題目庫
        const questionBank = {
            'math': [
                {
                    question: '3 × 7 = ?',
                    options: ['18', '21', '24', '27'],
                    correct: 1
                },
                {
                    question: '100 - 37 = ?',
                    options: ['53', '63', '73', '43'],
                    correct: 1
                },
                {
                    question: '如果 2x + 4 = 12，那麼 x = ?',
                    options: ['3', '4', '5', '6'],
                    correct: 1
                },
                {
                    question: '一個三角形有幾個角？',
                    options: ['2個', '3個', '4個', '5個'],
                    correct: 1
                },
                {
                    question: '0.5 等於幾分之幾？',
                    options: ['1/2', '1/3', '1/4', '2/3'],
                    correct: 0
                }
            ],
            'science': [
                {
                    question: '水的化學式是什麼？',
                    options: ['CO₂', 'H₂O', 'O₂', 'NaCl'],
                    correct: 1
                },
                {
                    question: '太陽系中最大的行星是？',
                    options: ['地球', '火星', '木星', '土星'],
                    correct: 2
                },
                {
                    question: '植物進行光合作用需要什麼？',
                    options: ['陽光', '水', '二氧化碳', '以上皆是'],
                    correct: 3
                },
                {
                    question: '人體有多少塊骨頭？',
                    options: ['106塊', '206塊', '306塊', '406塊'],
                    correct: 1
                },
                {
                    question: '閃電和雷聲哪個先出現？',
                    options: ['閃電', '雷聲', '同時', '不一定'],
                    correct: 0
                }
            ],
            'english': [
                {
                    question: '"Apple" 的中文意思是？',
                    options: ['香蕉', '橙子', '蘋果', '葡萄'],
                    correct: 2
                },
                {
                    question: '"Good morning" 是什麼時候用的？',
                    options: ['早上', '下午', '晚上', '睡覺前'],
                    correct: 0
                },
                {
                    question: '"I am a student." 中的 "student" 意思是？',
                    options: ['老師', '學生', '醫生', '工人'],
                    correct: 1
                },
                {
                    question: '"How are you?" 應該怎樣回答？',
                    options: ['Goodbye!', 'I\'m fine, thank you.', 'See you!', 'Nice to meet you.'],
                    correct: 1
                },
                {
                    question: '"Book" 的複數形式是？',
                    options: ['Bookes', 'Books', 'Booking', 'Book'],
                    correct: 1
                }
            ],
            'general': [
                {
                    question: '中國的首都是哪裡？',
                    options: ['上海', '北京', '廣州', '深圳'],
                    correct: 1
                },
                {
                    question: '一年有幾個季節？',
                    options: ['2個', '3個', '4個', '5個'],
                    correct: 2
                },
                {
                    question: '香港特別行政區的區花是什麼？',
                    options: ['牡丹花', '紫荊花', '玫瑰花', '蓮花'],
                    correct: 1
                },
                {
                    question: '下列哪個不是交通工具？',
                    options: ['汽車', '飛機', '書包', '輪船'],
                    correct: 2
                },
                {
                    question: '農曆新年通常在哪個月份？',
                    options: ['1月或2月', '3月或4月', '5月或6月', '7月或8月'],
                    correct: 0
                }
            ]
        };
        
        return questionBank[subject] || questionBank['math'];
    }
    
    getRandomQuestion() {
        if (!this.questions || this.questions.length === 0) {
            return this.getDefaultQuestion();
        }
        return this.questions[Math.floor(Math.random() * this.questions.length)];
    }
    
    getDefaultQuestion() {
        return {
            question: '這是一道測試題目',
            options: ['選項A', '選項B', '選項C', '選項D'],
            correct: 0
        };
    }
}
