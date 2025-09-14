/*:
 * @plugindesc 提供 Supabase 登入功能場景 (需搭配其他選單插件呼叫)
 * @author 炎月+Gemini
 * @技術指導 汐雲
 * @target MZ
 * @version 1.5
 *
 * @param supabaseUrl
 * @text Supabase URL
 * @desc 你的 Supabase 專案 URL。
 * @type string
 *
 * @param supabaseAnonKey
 * @text Supabase Anon Key
 * @desc 你的 Supabase 專案 anon public 金鑰。
 * @type string
 *
 * @param registerUrl
 * @text 註冊網址
 * @desc 玩家點選「註冊」時跳轉的網址。
 * @type string
 *
 * @help
 * 版本 1.5: 新增角色更換功能。
 * * 登入成功後，會讀取 Supabase 中的 actor_id 欄位。
 * * 根據讀取到的 actor_id，自動更換遊戲的初始角色。
 * 版本 1.4: 將 alert() 提示改為遊戲內的 Help Window 顯示。
 * 版本 1.3: 將 HTML 按鈕替換為遊戲內建的指令視窗。
 * 版本 1.2: 新增了返回功能。
 * 版本 1.1: 移除了修改標題畫面的程式碼。
 */

(() => {
    'use strict';

    const pluginName = 'SupabaseLogin';
    const parameters = PluginManager.parameters(pluginName);
    const supabaseUrl = parameters['supabaseUrl'];
    const supabaseAnonKey = parameters['supabaseAnonKey'];
    const registerUrl = parameters['registerUrl'] || "";

    //=============================================================================
    // ** Window_LoginCommand
    //=============================================================================
    function Window_LoginCommand() {
        this.initialize(...arguments);
    }
    Window_LoginCommand.prototype = Object.create(Window_HorzCommand.prototype);
    Window_LoginCommand.prototype.constructor = Window_LoginCommand;
    Window_LoginCommand.prototype.initialize = function(rect) {
        Window_HorzCommand.prototype.initialize.call(this, rect);
    };
    Window_LoginCommand.prototype.makeCommandList = function() {
        this.addCommand("登入", "login", true);
        this.addCommand("註冊", "register", true);
    };
    Window_LoginCommand.prototype.itemAlign = function() {
        return 'center';
    };
    Window_LoginCommand.prototype.maxCols = function() {
        return 2;
    };
    Window_LoginCommand.prototype.itemWidth = function() {
        return this.innerWidth / this.maxCols();
    };

    //=============================================================================
    // ** Scene_Login
    //=============================================================================
    function Scene_Login() {
        this.initialize(...arguments);
    }

    Scene_Login.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Login.prototype.constructor = Scene_Login;

    Scene_Login.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._messageMode = null; 
    };

    Scene_Login.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createInputElement();
        this.createCommandWindow();
    };

    Scene_Login.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (this._messageMode) {
            this.updateMessage();
        }
    };

    Scene_Login.prototype.start = function() {
        Scene_MenuBase.prototype.start.call(this);
        this._helpWindow.setText("請輸入您的4位數登入序號：");
    };
    
    Scene_Login.prototype.terminate = function() {
        Scene_MenuBase.prototype.terminate.call(this);
        if (this._inputElement && document.body.contains(this._inputElement)) {
            document.body.removeChild(this._inputElement);
        }
    };
    
Scene_Login.prototype.createInputElement = function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 4;
        const boxWidth = 150;
        const boxHeight = 30;
        input.style.position = 'absolute';
        input.style.left = (window.innerWidth / 2 - boxWidth / 2) + "px";
        input.style.top = (window.innerHeight / 2 - boxHeight / 2 - 50) + "px";
        input.style.width = boxWidth + "px";
        input.style.height = boxHeight + "px";
        input.style.fontSize = "24px";
        input.style.textAlign = "center";
        input.style.zIndex = '100';
        document.body.appendChild(input);
        this._inputElement = input;
        this._inputElement.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                this._inputElement.value = "";
            }
        });
    };
    Scene_Login.prototype.createCommandWindow = function() {
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_LoginCommand(rect);
        this._commandWindow.setHandler("login", this.onLoginButtonClick.bind(this));
        this._commandWindow.setHandler("register", this.onRegisterButtonClick.bind(this));
        this._commandWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    };

    Scene_Login.prototype.commandWindowRect = function() {
        const ww = 200;
        const wh = this.calcWindowHeight(1, true);
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = Graphics.boxHeight / 2 + 80;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Login.prototype.updateMessage = function() {
        if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
            SoundManager.playOk();
            switch (this._messageMode) {
                case "success":
                    SceneManager.goto(Scene_Map);
                    break;
                case "failure":
                case "error":
                    this._helpWindow.setText("請輸入您的4位數登入序號：");
                    this._inputElement.disabled = false;
                    this._commandWindow.activate();
                    this._messageMode = null;
                    break;
            }
        }
    };
    
    Scene_Login.prototype.onLoginButtonClick = async function() {
        const serial = this._inputElement.value.trim().toUpperCase();

        if (serial.length !== 4) {
            this._helpWindow.setText("序號格式不正確，請輸入4位英數組合。");
            this._messageMode = "failure";
            return;
        }
        
        this._helpWindow.setText("驗證中，請稍候...");
        this._inputElement.disabled = true;
        this._commandWindow.deactivate();

        if (!supabaseUrl || !supabaseAnonKey) {
            this._helpWindow.setText("插件設定錯誤，請聯繫管理員！");
            this._messageMode = "error";
            return;
        }

        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/player_serials?select=*&serial_code=eq.${serial}`, {
                method: 'GET', headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` }
            });
            if (!response.ok) throw new Error(`網路錯誤: ${response.statusText}`);
            const data = await response.json();

            if (data && data.length > 0) {
                // =================================================================
                // ** [核心修改] 開始處理登入成功後的角色設定 **
                // =================================================================

                // 1. 從回傳的資料中，取得 actor_id。如果沒有設定，就預設為 1。
                const actorId = data[0].actor_id || 1;

                // 2. 準備一個全新的遊戲環境，這一步很重要！
                DataManager.createGameObjects();

                // 3. 設定初始隊伍，只加入我們從線上取得的那個角色
                $gameParty.setupStartingMembers(); // 先執行預設的，確保隊伍存在
                $gameParty.allMembers().forEach(actor => $gameParty.removeActor(actor.actorId())); // 清空預設隊員
                $gameParty.addActor(actorId); // 加入我們指定的角色

                // 4. 設定玩家的初始位置 (讀取資料庫中的設定)
                $gamePlayer.reserveTransfer($dataSystem.startMapId, $dataSystem.startX, $dataSystem.startY);
                $gamePlayer.refresh();  // 要求刷新玩家外觀

                // 5. 將序號和角色ID存入遊戲變數，方便日後使用
                $gameVariables.setValue(17, serial); // 假設1號變數存序號
                $gameVariables.setValue(18, actorId); // 假設2號變數存角色ID

                // 6. 準備顯示成功訊息
                this._helpWindow.setText(`登入成功！歡迎 ${serial}！(按確認繼續)`);
                this._messageMode = "success";

            } else {
                this._helpWindow.setText("序號錯誤或不存在，請確認後再試。");
                this._messageMode = "failure";
            }
        } catch (error) {
            console.error('登入時發生錯誤:', error);
            this._helpWindow.setText(`登入失敗，發生錯誤: ${error.message}`);
            this._messageMode = "error";
        }
    };

    Scene_Login.prototype.onRegisterButtonClick = function() {
        if (registerUrl) {
            window.open(registerUrl, "_blank");
        } else {
            this._helpWindow.setText("尚未設定註冊網址。");
        }
        if (this._inputElement) this._inputElement.disabled = false;
        this._commandWindow.activate();
    };

    window.Scene_Login = Scene_Login;

})();