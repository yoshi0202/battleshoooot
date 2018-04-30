enchant();
$(function(){
    let imgpath = 'javascripts/enchant.js-builds/images/'
    let width = "1800";
    let height = "750";
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
        let beamflg = false;
        let beamway;

        var label = new Label();
        label.x = 280;
        label.y = 5;
        label.color = 'red';
        label.font = '14px "Arial"';
        core.rootScene.addChild(label);


        //スタート画面
        var createStartScene = function(){
            var scene = new Scene();
            let title = new Label('ゲームスタート');
            title.textAlign = 'center';
            title.color = 'red';
            title.font = '10px "Arial"';
            title.x = width/2;
            title.y = height/2;
            scene.addChild(title);
            title.on('touchstart', function(e) {
                core.replaceScene(createGameScene());
            });
            return scene;
        };
        //ゲーム画面
        var createGameScene = function(){
            //HPバー定義
            var enemyHP = Class.create(Sprite, {
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
            //beam定義
            var Beam = Class.create(Sprite, {
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
                            console.log('hit');
                            if(EnemyHP.scaleX > 0){
                                EnemyHP.scaleX = EnemyHP.scaleX - 50;
                                EnemyHP.x = EnemyHP.x + 25;
                            }
                            if(EnemyHP.scaleX<=0){
                                core.replaceScene(createRetryScene());
                            }
                        }
                    });
                }
            });

            //enemy定義
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
                        if(this.intersect(beam)){
                        }
                    });
                }
            });

            //bearclass定義
            var Bear = Class.create(Sprite, {
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
                        }else{
                            gravity = 0;
                            jumpCount = 0;
                            this.y = baseline;
                            maxjump1flg = false;
                            maxjump2flg = false;
                        }
                        if (core.input.b && this.x > 30) { //左移動
                            if(this.scaleX > 0) this.scaleX *= -1;
                            this.x -= 10;
                            if(this.anmcnt == 3){
                                this.frame = this.age % 3 + init_frame;
                                this.anmcnt = 0;
                            }else{
                                this.anmcnt++;
                            }
                        }
                        if (core.input.d && this.x < width-80){ //右移動
                            if(this.scaleX < 0) this.scaleX *= -1;
                            this.x += 10;
                            if(this.anmcnt == 3){
                                this.frame = this.age % 3 + init_frame;
                                this.anmcnt = 0;
                            }else{
                                this.anmcnt++;
                            }
                        }
                        if(!core.input.a && !core.input.b && !core.input.c && !core.input.d){
                            this.frame = init_frame;
                        }
                        if(core.input.e && jumpkey == false) {
                            jumpkey = true;
                            if(jumpCount < jumplimit){
                                if(jumpCount == 0) jumpCount = jumpCount+1;
                                else if(jumpCount == 1) jumpCount = jumpCount+1;
                            }
                        }
                        if(jumpkey == true){
                            if(jumpCount == 1 && !maxjump1flg) this.y -= 20;
                            else if(jumpCount == 2 && !maxjump2flg) this.y -= 35;
                        }
                        if(this.y <= maxjump1) maxjump1flg = true;
                        if(this.y <= maxjump2) maxjump2flg = true;

                        if(!core.input.e) jumpkey = false;

                        if(beamflg){
                            let beamspeed = 40;
                            if(beamway > 0){
                                beam.x = beam.x + beamspeed;
                            }else if(beamway < 0){
                                beam.x = beam.x - beamspeed;
                            }
                            if(beam.x > 1800 || beam.x < -100){
                                beamflg = false;
                            }
                        }
                    });
                }
            });
            var scene = new Scene();
            var beam = new Beam(-100,-100);
            var enemy = new Enemy(1700,baseline);
            var bear = new Bear(100, baseline);
            var EnemyHP = new enemyHP(1525, 50);
            scene.addChild(beam);
            scene.addChild(enemy);
            scene.addChild(bear);
            scene.addChild(EnemyHP);
            scene.on('touchstart', function(e) {
                if(beamflg == false){
                    beamflg = true;
                    beam.x = bear.x;
                    beam.y = bear.y;
                    beamway = bear.scaleX;
                }
                console.log(e.y);
                console.log(e.x);
            });
            return scene;
        }
        //終了画面
        var createRetryScene = function(){
            var scene = new Scene();
            let title = new Label('リトライ？');
            title.textAlign = 'center';
            title.color = 'red';
            title.font = '10px "Arial"';
            title.x = width/2;
            title.y = height/2;
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