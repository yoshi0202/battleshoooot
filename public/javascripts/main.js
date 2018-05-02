enchant();
$(function(){
    let imgpath = 'javascripts/enchant.js-builds/images/'
    let width = "1800";
    let height = "750";
    //ソケット通信開始
    var socket = io();
    var core = new Core(width, height);
    core.fps = 60;
    core.preload(imgpath + 'chara1.png', imgpath + 'bullet.png', imgpath + 'effect0.png', imgpath + 'hp.png');
    core.onload = function() {
        core.keybind(87,"a"); //w
        core.keybind(65,"b"); //a
        core.keybind(83,"c"); //s
        core.keybind(68,"d"); //d
        core.keybind(16,"f"); //space
        core.keybind(32,"e"); //shift
        let baseline = 640;
        let init_frame = 10;
        let jumplimit = 2;
        let jumpCount = 0;
        let gravity = 0;
        let Gspeed = 0.8;
        let maxjump1 = 350;
        let maxjump1flg = false;
        let maxjump2 = 100;
        let maxjump2flg = false;
        let jumpkey = false;
        let playerbeamflg = false;
        let enemybeamflg = false;
        let playerbeamway;
        let enemybeamway;
        let player_num = "";
        let enemy_num = "";

        //スタート画面
        var createStartScene = function(){
            console.log("スタート画面作成");
            var scene = new Scene();
            let title = new Label('ゲームスタート');
            title.textAlign = 'center';
            title.color = 'red';
            title.font = '30px "Arial"';
            title.x = 740;
            title.y = 350;
            scene.addChild(title);
            title.on('touchstart', function(e) {
                //どこかのルームに接続する
                socket.emit('joinroom',null,function onack(response){
                    //レスポンスを受け取った時に1Pか2Pかを確定
                    console.log(response);
                    player_num = response;
                    core.replaceScene(createGameScene());
                });
            });
            return scene;
        };
        //ゲーム画面
        var createGameScene = function(){
            console.log("ゲーム画面作成");
            console.log("作成処理開始");
            if(player_num == "0"){
                console.log("1Pplayer");
                enemy_num = "1";
                //各種class定義
                //LeftPlayer Character
                let init_frame = 10;
                var Player = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 32, 32);
                        this.frame = init_frame;
                        this.scale(4,4);
                        this.image = core.assets[imgpath + 'chara1.png'];
                        this.x = x;
                        this.y = y;
                        this.vy = 0;
                        this.vx = 0;
                        this.anmcnt = 0;
                        this.on('enterframe', function() {
                            if(this.y < baseline){
                                gravity = gravity + Gspeed;
                                this.y += gravity;
                                socket.emit('player1_move', {
                                    x : this.x,
                                    y : this.y
                                });
                            }else{
                                gravity = 0;
                                jumpCount = 0;
                                this.y = baseline;
                                maxjump1flg = false;
                                maxjump2flg = false;
                            }
                            if (core.input.b && this.x > 30) { //左移動
                                if(this.scaleX > 0) { this.scaleX *= -1; }
                                this.x -= 10;
                                socket.emit('player1_move', {
                                    x : this.x,
                                    y : this.y,
                                    way : "left"
                                });
                                if(this.anmcnt == 3){
                                    this.frame = this.age % 3 + init_frame;
                                    this.anmcnt = 0;
                                    }else { this.anmcnt++; }
                            }
                            if (core.input.d && this.x < width-80){ //右移動
                                if(this.scaleX < 0) this.scaleX *= -1;
                                this.x += 10;
                                socket.emit('player1_move', {
                                    x : this.x,
                                    y : this.y,
                                    way : "right"
                                });
                                if(this.anmcnt == 3){
                                    this.frame = this.age % 3 + init_frame;
                                    this.anmcnt = 0;
                                }else { this.anmcnt++; }
                            }
                            if(!core.input.a && !core.input.b && !core.input.c && !core.input.d) { this.frame = init_frame; }
                            if(core.input.e && jumpkey == false) {
                                jumpkey = true;
                                if(jumpCount < jumplimit){
                                    if(jumpCount == 0) { jumpCount = jumpCount+1; }
                                    else if(jumpCount == 1) { jumpCount = jumpCount+1; }
                                }
                            }
                            if(jumpkey == true){
                                if(jumpCount == 1 && !maxjump1flg) { this.y -= 20; }
                                else if(jumpCount == 2 && !maxjump2flg) { this.y -= 35; }
                            }
                            if(this.y <= maxjump1) { maxjump1flg = true; }
                            if(this.y <= maxjump2) { maxjump2flg = true; }
                            if(!core.input.e) { jumpkey = false; }
                            if(playerbeamflg){
                                let beamspeed = 40;
                                if(playerbeamway > 0){ player_beam.x = player_beam.x + beamspeed; }
                                else if(playerbeamway < 0) { player_beam.x = player_beam.x - beamspeed; }
                                if(player_beam.x > 1800 || player_beam.x < -100) { playerbeamflg = false; }
                            }
                        });
                    }
                });
                //LeftPlayer HP Bar
                var Player_HP = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(500,60);
                        this.image = core.assets[imgpath + 'bullet.png'];
                        this.on('enterframe', function() {
                        });
                    }
                });
                //LeftPlayer Beam
                var Player_Beam = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(5,5);
                        this.image = core.assets[imgpath + 'bullet.png'];
                        this.on('enterframe', function() {
                            if(this.within(enemy,40)){
                                this.y = -100;
                                beamflg = false;
                                socket.emit('beam_hit', {
                                    hitplayer : player_num
                                });
                            }
                        });
                    }
                });
                //Enemy Character
                var Enemy = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 32, 32);
                        this.x = x;
                        this.y = y;
                        this.frame = 5;
                        this.scale(4,4);
                        this.scaleX *= -1;
                        this.image = core.assets[imgpath + 'chara1.png'];
                        this.on('enterframe', function() {
                            if(enemybeamflg){
                                let beamspeed = 40;
                                if(enemybeamway > 0){ enemy_beam.x = enemy_beam.x + beamspeed; }
                                else if(enemybeamway < 0) { enemy_beam.x = enemy_beam.x - beamspeed; }
                                if(enemy_beam.x > 1800 || enemy_beam.x < -100) { enemybealflg = false; }
                            }
                        });
                    }
                });
                //Enemy HP Bar
                var Enemy_HP = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(500,60);
                        this.image = core.assets[imgpath + 'hp.png'];
                        this.on('enterframe', function() {
                        });
                    }
                });
                //Enemy Beam
                var Enemy_Beam = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(5,5);
                        this.image = core.assets[imgpath + 'bullet.png'];
                        this.on('enterframe', function() {
                            socket.on('enemy_beam', function(data){
                                enemybeamflg = true;
                                enemy_beam.x = enemy.x;
                                enemy_beam.y = enemy.y;
                                enemybeamway = data.way;
                            });
                            if(this.within(player,40)){
                                this.y = -100;
                                enemybeamflg = false;
                            }
                        });
                    }
                });
            }else if(player_num == "1"){
                console.log("2Pplayer");
                enemy_num = "0";
                //各種class定義
                //RightPlayer Character
                let init_frame = 5;
                var Player = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 32, 32);
                        this.frame = init_frame;
                        this.scale(4,4);
                        this.image = core.assets[imgpath + 'chara1.png'];
                        this.x = x;
                        this.y = y;
                        this.vy = 0;
                        this.vx = 0;
                        this.scaleX *= -1;
                        this.anmcnt = 0;
                        this.on('enterframe', function() {
                            if(this.y < baseline){
                                gravity = gravity + Gspeed;
                                this.y += gravity;
                                socket.emit('player2_move', {
                                    x : this.x,
                                    y : this.y,
                                });
                            }else{
                                gravity = 0;
                                jumpCount = 0;
                                this.y = baseline;
                                maxjump1flg = false;
                                maxjump2flg = false;
                            }
                            if (core.input.b && this.x > 30) { //左移動
                                if(this.scaleX > 0) { this.scaleX *= -1; }
                                this.x -= 10;
                                socket.emit('player2_move', {
                                    x : this.x,
                                    y : this.y,
                                    way : "left"
                                });
                                if(this.anmcnt == 3){
                                    this.frame = this.age % 3 + init_frame;
                                    this.anmcnt = 0;
                                }else { this.anmcnt++; }
                            }
                            if (core.input.d && this.x < width-80){ //右移動
                                if(this.scaleX < 0) this.scaleX *= -1;
                                this.x += 10;
                                socket.emit('player2_move', {
                                    x : this.x,
                                    y : this.y,
                                    way : "right"
                                });
                                if(this.anmcnt == 3){
                                    this.frame = this.age % 3 + init_frame;
                                    this.anmcnt = 0;
                                }else { this.anmcnt++; }
                            }
                            if(!core.input.a && !core.input.b && !core.input.c && !core.input.d) { this.frame = init_frame; }
                            if(core.input.e && jumpkey == false) {
                                jumpkey = true;
                                if(jumpCount < jumplimit){
                                    if(jumpCount == 0) { jumpCount = jumpCount+1; }
                                    else if(jumpCount == 1) { jumpCount = jumpCount+1; }
                                }
                            }
                            if(jumpkey == true){
                                if(jumpCount == 1 && !maxjump1flg) { this.y -= 20; }
                                else if(jumpCount == 2 && !maxjump2flg) { this.y -= 35; }
                            }
                            if(this.y <= maxjump1) { maxjump1flg = true; }
                            if(this.y <= maxjump2) { maxjump2flg = true; }
                            if(!core.input.e) { jumpkey = false; }
                            if(playerbeamflg){
                                let beamspeed = 40;
                                if(playerbeamway > 0){ player_beam.x = player_beam.x + beamspeed; }
                                else if(playerbeamway < 0) { player_beam.x = player_beam.x - beamspeed; }
                                if(player_beam.x > 1800 || player_beam.x < -100) { playerbeamflg = false; }
                            }
                        });
                    }
                });
                //RightPlayer HP Bar
                var Player_HP = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(500,60);
                        this.image = core.assets[imgpath + 'hp.png'];
                        this.on('enterframe', function() {
                        });
                    }
                });
                //RightPlayer Beam
                var Player_Beam = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(5,5);
                        this.image = core.assets[imgpath + 'bullet.png'];
                        this.on('enterframe', function() {
                            if(this.within(enemy,40)){
                                this.y = -100;
                                playerbeamflg = false;
                                socket.emit('beam_hit', {
                                    hitplayer : player_num
                                });
                            }
                        });
                    }
                });
                //Enemy Character
                var Enemy = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 32, 32);
                        this.x = x;
                        this.y = y;
                        this.frame = 10;
                        this.scale(4,4);
                        this.image = core.assets[imgpath + 'chara1.png'];
                        this.on('enterframe', function() {
                            if(enemybeamflg){
                                let beamspeed = 40;
                                if(enemybeamway > 0){ enemy_beam.x = enemy_beam.x + beamspeed; }
                                else if(enemybeamway < 0) { enemy_beam.x = enemy_beam.x - beamspeed; }
                                if(enemy_beam.x > 1800 || enemy_beam.x < -100) { enemybealflg = false; }
                            }
                        });
                    }
                });
                //Enemy HP Bar
                var Enemy_HP = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(500,60);
                        this.image = core.assets[imgpath + 'bullet.png'];
                        this.on('enterframe', function() {
                        });
                    }
                });
                //Enemy Beam
                var Enemy_Beam = Class.create(Sprite, {
                    initialize: function(x, y) {
                        Sprite.call(this, 1, 1);
                        this.x = x;
                        this.y = y;
                        this.scale(5,5);
                        this.image = core.assets[imgpath + 'bullet.png'];
                        this.on('enterframe', function() {
                            socket.on('enemy_beam', function(data){
                                enemybeamflg = true;
                                enemy_beam.x = enemy.x;
                                enemy_beam.y = enemy.y;
                                enemybeamway = data.way;
                            });
                            if(this.within(player,40)){
                                this.y = -100;
                                enemybeamflg = false;
                            }
                        });
                    }
                });
            }
            console.log("2");
            var scene = new Scene();
            if(player_num == "0"){
                //left player
                var player = new Player(100, baseline);
                var player_hp = new Player_HP(280, 50);
                var player_beam = new Player_Beam(-100,-100);
                var enemy = new Enemy(1700,baseline);
                var enemy_hp = new Enemy_HP(1525, 50);
                var enemy_beam = new Enemy_Beam(-100,-100);
                socket.on('player2_place', function(data){
                    enemy.x = data.x;
                    enemy.y = data.y;
                    if(data.way && data.way == "right" && enemy.scaleX < 0) enemy.scaleX *= -1;
                    else if(data.way && data.way == "left" && enemy.scaleX > 0) enemy.scaleX *= -1;
                });
                socket.on("hp_down", function(data){
                    if(data.hitplayer == "0"){
                        //player 1 から player 2に当てたのでplayer2のHPを減らす
                        enemy_hp.scaleX = enemy_hp.scaleX - 50;
                        enemy_hp.x = enemy_hp.x + 25;
                    }else if(data.hitplayer == "1"){
                        //player2からplayer1に当てたのでplayer1のHPを減らす
                        player_hp.scaleX = player_hp.scaleX - 50;
                        player_hp.x = player_hp.x - 25;
                    }
                    if(player_hp.scaleX <=0 || enemy_hp.scaleX <= 0){
                        socket.emit("game_end", null);
                    }
                });
            }else{
                //right player
                var player = new Player(1700, baseline);
                var player_hp = new Player_HP(1525, 50);
                var player_beam = new Player_Beam(-100,-100);
                var enemy = new Enemy(100,baseline);
                var enemy_hp = new Enemy_HP(280, 50);
                var enemy_beam = new Enemy_Beam(-100,-100);
                socket.on('player1_place', function(data){
                    enemy.x = data.x;
                    enemy.y = data.y;
                    if(data.way && data.way == "right" && enemy.scaleX < 0) enemy.scaleX *= -1;
                    else if(data.way && data.way == "left" && enemy.scaleX > 0) enemy.scaleX *= -1;
                });
                socket.on("hp_down", function(data){
                    if(data.hitplayer == "0"){
                        //player 1 から player 2に当てたのでplayer2のHPを減らす
                        player_hp.scaleX = player_hp.scaleX - 50;
                        player_hp.x = player_hp.x + 25;
                    }else if(data.hitplayer == "1"){
                        //player2からplayer1に当てたのでplayer1のHPを減らす
                        enemy_hp.scaleX = enemy_hp.scaleX - 50;
                        enemy_hp.x = enemy_hp.x - 25;
                    }
                });
                if(player_hp.scaleX <=0 || enemy_hp.scaleX <= 0){
                    socket.emit("game_end", null);
                }
            }
            scene.addChild(player);
            scene.addChild(player_hp);
            scene.addChild(player_beam);
            scene.addChild(enemy);
            scene.addChild(enemy_hp);
            scene.addChild(enemy_beam);
            scene.on('touchstart', function(e) {
                if(playerbeamflg == false){
                    playerbeamflg = true;
                    player_beam.x = player.x;
                    player_beam.y = player.y;
                    playerbeamway = player.scaleX;
                }
                socket.emit('player_beam',{
                    way : player.scaleX
                })
                console.log(e.y);
                console.log(e.x);
            });
            socket.on('game_end', function(data){
                core.replaceScene(createRetryScene());
            })
            return scene;
        }
        //終了画面
        var createRetryScene = function(){
            var scene = new Scene();
            let title = new Label('リトライ？');
            title.textAlign = 'center';
            title.color = 'red';
            title.font = '30px "Arial"';
            title.x = 740;
            title.y = 350;
            scene.addChild(title);
            title.on('touchstart', function(e) {
                core.replaceScene(createGameScene());
            });
            return scene;
        };
        core.replaceScene(createStartScene());
    }
    core.start();
});