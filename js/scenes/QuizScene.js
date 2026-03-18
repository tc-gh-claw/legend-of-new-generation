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
        
        // 安全地獲取玩家等級
        let level = 1;
        if (data.playerLevel) {
            level = data.playerLevel;
        } else if (this.game && this.game.globals && this.game.globals.playerLevel) {
            level = this.game.globals.playerLevel;
        }
        this.playerLevel = level;
        
        // 安全地獲取題目
        try {
            this.questions = this.getQuestionsBySubject(this.subject, this.playerLevel);
            this.currentQuestion = this.getRandomQuestion();
        } catch (e) {
            console.error('QuizScene: 獲取題目失敗', e);
            this.currentQuestion = this.getDefaultQuestion();
        }
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
        // 確保題目存在
        if (!this.currentQuestion) {
            console.warn('QuizScene: currentQuestion 不存在，使用預設題目');
            this.currentQuestion = this.getDefaultQuestion();
        }
        
        // 確保題目有必要嘅屬性
        if (!this.currentQuestion.question) {
            this.currentQuestion.question = '這是一道測試題目';
        }
        if (!this.currentQuestion.options || !Array.isArray(this.currentQuestion.options)) {
            this.currentQuestion.options = ['選項A', '選項B', '選項C', '選項D'];
        }
        if (typeof this.currentQuestion.correct !== 'number') {
            this.currentQuestion.correct = 0;
        }
        
        // 顯示題目
        this.questionText.setText(this.currentQuestion.question);
        
        // 創建答案按鈕
        this.createAnswerButtons(this.currentQuestion.options);
    }
    
    createAnswerButtons(options) {
        this.answerButtons.removeAll(true);
        
        // 檢查 options 係咪有效
        if (!options || !Array.isArray(options) || options.length === 0) {
            console.error('QuizScene: options 無效', options);
            return;
        }
        
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
            if (typeof this.onComplete === 'function') {
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
            if (typeof this.onComplete === 'function') {
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
    
    getQuestionsBySubject(subject, playerLevel = 1) {
        // 根據玩家等級確定難度
        // 難度1: 等級1-3, 難度2: 等級4-7, 難度3: 等級8+
        let difficulty = 1;
        if (playerLevel >= 8) {
            difficulty = 3;
        } else if (playerLevel >= 4) {
            difficulty = 2;
        }
        
        // 完整題目庫，包含不同難度
        const questionBank = {
            'math': {
                1: [
                    { question: '3 × 7 = ?', options: ['18', '21', '24', '27'], correct: 1 },
                    { question: '100 - 37 = ?', options: ['53', '63', '73', '43'], correct: 1 },
                    { question: '一個三角形有幾個角？', options: ['2個', '3個', '4個', '5個'], correct: 1 },
                    { question: '0.5 等於幾分之幾？', options: ['1/2', '1/3', '1/4', '2/3'], correct: 0 },
                    { question: '12 ÷ 4 = ?', options: ['2', '3', '4', '6'], correct: 1 },
                    { question: '5 + 8 = ?', options: ['12', '13', '14', '15'], correct: 1 }
                ],
                2: [
                    { question: '如果 2x + 4 = 12，那麼 x = ?', options: ['3', '4', '5', '6'], correct: 1 },
                    { question: '36的平方根是多少？', options: ['4', '6', '8', '9'], correct: 1 },
                    { question: '3² + 4² = ?', options: ['16', '25', '36', '49'], correct: 1 },
                    { question: '一個圓周長是12π，它的半徑是？', options: ['3', '4', '6', '12'], correct: 2 },
                    { question: '25% 的 80 是多少？', options: ['15', '20', '25', '30'], correct: 1 }
                ],
                3: [
                    { question: '如果 x² - 5x + 6 = 0，那麼 x = ?', options: ['2或3', '1或6', '-2或-3', '-1或-6'], correct: 0 },
                    { question: 'log₂(8) = ?', options: ['2', '3', '4', '8'], correct: 1 },
                    { question: 'sin(30°) = ?', options: ['0', '1/2', '√2/2', '1'], correct: 1 },
                    { question: '等差數列 2, 5, 8... 的第10項是？', options: ['27', '29', '31', '33'], correct: 1 },
                    { question: '√(16 + 9) = ?', options: ['3', '4', '5', '7'], correct: 2 }
                ]
            },
            'science': {
                1: [
                    { question: '水的化學式是什麼？', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], correct: 1 },
                    { question: '太陽系中最大的行星是？', options: ['地球', '火星', '木星', '土星'], correct: 2 },
                    { question: '植物進行光合作用需要什麼？', options: ['陽光', '水', '二氧化碳', '以上皆是'], correct: 3 },
                    { question: '閃電和雷聲哪個先出現？', options: ['閃電', '雷聲', '同時', '不一定'], correct: 0 },
                    { question: '人體最大的器官是？', options: ['心臟', '肝臟', '皮膚', '大腸'], correct: 2 }
                ],
                2: [
                    { question: '人體有多少塊骨頭？', options: ['106塊', '206塊', '306塊', '406塊'], correct: 1 },
                    { question: 'DNA的雙螺旋結構是由誰發現的？', options: ['愛因斯坦', '華生和克里克', '達爾文', '牛頓'], correct: 1 },
                    { question: '下列哪個不是基本力？', options: ['引力', '電磁力', '摩擦力', '強核力'], correct: 2 },
                    { question: '元素週期表中有多少種元素？', options: ['92', '108', '118', '156'], correct: 2 },
                    { question: '光速大約是多少？', options: ['300,000 km/s', '150,000 km/s', '30,000 km/s', '3,000 km/s'], correct: 0 }
                ],
                3: [
                    { question: '相對論 E=mc² 中的 c 代表什麼？', options: ['電荷', '光速', '比熱', '濃度'], correct: 1 },
                    { question: '量子力學中的測不準原理是誰提出的？', options: ['愛因斯坦', '波爾', '海森堡', '薛丁格'], correct: 2 },
                    { question: '黑洞的事件視界是指？', options: ['黑洞的中心', '光也無法逃脫的邊界', '黑洞的表面', '黑洞的噴流'], correct: 1 },
                    { question: '希格斯玻色子又被稱為什麼？', options: ['上帝粒子', '幽靈粒子', '時空粒子', '質量粒子'], correct: 0 },
                    { question: '下列哪個是費米子？', options: ['光子', '電子', '引力子', '膠子'], correct: 1 }
                ]
            },
            'english': {
                1: [
                    { question: '"Apple" 的中文意思是？', options: ['香蕉', '橙子', '蘋果', '葡萄'], correct: 2 },
                    { question: '"Good morning" 是什麼時候用的？', options: ['早上', '下午', '晚上', '睡覺前'], correct: 0 },
                    { question: '"I am a student." 中的 "student" 意思是？', options: ['老師', '學生', '醫生', '工人'], correct: 1 },
                    { question: '"How are you?" 應該怎樣回答？', options: ['Goodbye!', 'I\'m fine, thank you.', 'See you!', 'Nice to meet you.'], correct: 1 },
                    { question: '"Book" 的複數形式是？', options: ['Bookes', 'Books', 'Booking', 'Book'], correct: 1 }
                ],
                2: [
                    { question: '"Beautiful" 的意思是？', options: ['美麗的', '勇敢的', '聰明的', '快速的'], correct: 0 },
                    { question: '過去式 "go" 的正確形式是？', options: ['goed', 'went', 'gone', 'going'], correct: 1 },
                    { question: '"I have ______ apple." 空格應該填？', options: ['a', 'an', 'the', '不填'], correct: 1 },
                    { question: '"She sings ______ than her sister." 空格應該填？', options: ['good', 'well', 'better', 'best'], correct: 2 },
                    { question: '"If it rains tomorrow, I ______ at home." 空格應該填？', options: ['stay', 'will stay', 'stayed', 'would stay'], correct: 1 }
                ],
                3: [
                    { question: '"Ubiquitous" 的意思是？', options: ['無處不在的', '獨特的', '模糊的', '明顯的'], correct: 0 },
                    { question: '"The book was written by Shakespeare." 這句話的語態是？', options: ['主動語態', '被動語態', '條件語氣', '虛擬語氣'], correct: 1 },
                    { question: '"Notwithstanding" 的同義詞是？', options: ['However', 'Therefore', 'Although', 'Because'], correct: 2 },
                    { question: '"To be or not to be" 出自哪部作品？', options: ['羅密歐與朱麗葉', '馬克白', '哈姆雷特', '李爾王'], correct: 2 },
                    { question: '"Ephemeral" 的反義詞是？', options: ['Brief', 'Eternal', 'Fleeting', 'Momentary'], correct: 1 }
                ]
            },
            'general': {
                1: [
                    { question: '中國的首都是哪裡？', options: ['上海', '北京', '廣州', '深圳'], correct: 1 },
                    { question: '一年有幾個季節？', options: ['2個', '3個', '4個', '5個'], correct: 2 },
                    { question: '香港特別行政區的區花是什麼？', options: ['牡丹花', '紫荊花', '玫瑰花', '蓮花'], correct: 1 },
                    { question: '下列哪個不是交通工具？', options: ['汽車', '飛機', '書包', '輪船'], correct: 2 },
                    { question: '農曆新年通常在哪個月份？', options: ['1月或2月', '3月或4月', '5月或6月', '7月或8月'], correct: 0 }
                ],
                2: [
                    { question: '世界上面積最大的國家是？', options: ['中國', '美國', '俄羅斯', '加拿大'], correct: 2 },
                    { question: '下列哪個不是聯合國安理會常任理事國？', options: ['中國', '日本', '英國', '法國'], correct: 1 },
                    { question: '《蒙娜麗莎》的作者是？', options: ['梵高', '達芬奇', '畢加索', '莫奈'], correct: 1 },
                    { question: '世界上最長的河流是？', options: ['亞馬遜河', '長江', '密西西比河', '尼羅河'], correct: 3 },
                    { question: '奧林匹克運動會起源於哪個國家？', options: ['希臘', '羅馬', '埃及', '中國'], correct: 0 }
                ],
                3: [
                    { question: '維也納是哪個國家的首都？', options: ['瑞士', '奧地利', '匈牙利', '捷克'], correct: 1 },
                    { question: '二戰結束於哪一年？', options: ['1943', '1944', '1945', '1946'], correct: 2 },
                    { question: '下列哪位哲學家提出"我思故我在"？', options: ['蘇格拉底', '柏拉圖', '笛卡兒', '康德'], correct: 2 },
                    { question: '世界上第一個登上月球的人是？', options: ['尤里·加加林', '尼爾·阿姆斯特朗', '巴茲·奧爾德林', '約翰·格倫'], correct: 1 },
                    { question: '諾貝爾獎不包括以下哪個類別？', options: ['物理學', '化學', '數學', '文學'], correct: 2 }
                ]
            }
        };
        
        // 獲取當前難度的題目
        const subjectQuestions = questionBank[subject] || questionBank['math'];
        let availableQuestions = subjectQuestions[difficulty] || subjectQuestions[1];
        
        // 對於高級玩家，混合較低難度的題目
        if (difficulty >= 2 && subjectQuestions[difficulty - 1]) {
            availableQuestions = [...availableQuestions, ...subjectQuestions[difficulty - 1]];
        }
        if (difficulty >= 3 && subjectQuestions[difficulty - 2]) {
            availableQuestions = [...availableQuestions, ...subjectQuestions[difficulty - 2]];
        }
        
        return availableQuestions;
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
