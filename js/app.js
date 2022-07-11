
function myGame() {

    let invaders, particles, invaderIndex, animate, tCode, isBtnPressed, directionX, soundSwitch, canonShot, invaderShot, score;


    function el(css) {
        return document.querySelector(css);
    }

    function create(html) {
        return document.createElement(html);
    }

    const co = el('#canvas');
    const ctx = co.getContext('2d');
    const KEY_SPACE = ' '; // tastencode für Leertaste
    const KEY_LEFT = 'ArrowLeft'; // tastencode für linke pfeiltaste
    const KEY_RIGHT = 'ArrowRight'; // tastencode für rechte pfeiltaste
    const INVADER_PER_ROW = 10; // Invader pro reihe
    const INVADER_POINTS = 20; // Punkte pro Invader
    const DEATH_POINTS = -100; // Punktabzug beim gegnerischen treffer
    const TEXT_SIZE = 35; // Schriftgroesse


    const allSounds = {
        attack: 'audio/shot.mp3',
        death: 'audio/spawn.mp3',
        over: 'audio/bomb1.mp3',
        win: 'audio/winner.mp3',
    };



    //  ===================================== Objekte =====================================

    const protoInvader = {
        x: 10,
        y: 10,
        w: 40,
        h: 40,
        spY: 0.1, // speed Y-Achse (oben und unten)
        spX: 1, // speed X-Achse (links und rechts)
        dX: 0, // richtung (direction) X
        col: 'lightgrey',
        id: 0,
        alive: true,
        init: function () {
            invaders[invaderIndex] = this;
            this.id = invaderIndex;
            invaderIndex++;
        },
        collision: function () {

        },
        draw: function () {

            const image = new Image();
            image.src = './data/invader.png';
            if(image){
                ctx.drawImage(image,this.x,this.y,this.w,this.h);
            }

            //ctx.fillStyle = this.col;
            //ctx.fillRect(this.x, this.y, this.w, this.h);
        },
        move: function () {

            // Kollision Linke Wand 
            if (this.x < 0) {
                directionX = 0;
            }
            // Kollision Rechte Wand
            if (this.x > co.width - this.w) {
                directionX = 1;
            }

            if (directionX === 0) { this.x += this.spX };
            if (directionX === 1) { this.x -= this.spX };

            this.y += this.spY;

            if (this.alive) {
                this.draw();
            }

            randomInvaderAttack();

        },
        fire: function (rndInvader, dY) {
            return new Shot(rndInvader.x + rndInvader.w / 2, rndInvader.y, 0.2);
        },
        isHitBy: function (shot) {
            return this.alive && kollision(shot.x, this.x, this.x + this.w) && kollision(shot.y, this.y, this.y + this.h);
        }
    };

    const playerCanon = {
        x: co.width / 2,
        y: co.height - 50,
        w: 60,
        h: 40,
        col: 'lime',
        spX: 7,
        alive: true,
        move: function () {

            if (tCode === KEY_LEFT && this.x > 0 && isBtnPressed) {
                this.x -= this.spX;
            }
            if (tCode === KEY_RIGHT && this.x < co.width - this.w && isBtnPressed) {
                this.x += this.spX;
            }
            if (tCode === KEY_SPACE && !canonShot && isBtnPressed) {
                playSound(allSounds.attack);
                canonShot = this.fire(-20);
            }
            this.draw();
        },
        draw: function () {

            const image = new Image();
            image.src = './data/ship.png';
            if(image){
                ctx.drawImage(image,this.x,this.y,this.w,this.h);
            }
            
            //ctx.fillStyle = this.col;
            //ctx.fillRect(this.x, this.y, this.w, this.h);
        },
        fire: function (dY) {
            return new Shot(this.x + this.w / 2, this.y, dY);
        },
        isHitBy: function (shot) {
            return this.alive && kollision(shot.x, this.x, this.x + this.w) && kollision(shot.y, this.y, this.y + this.h);
        }
    };

    // brauchen ein shot object, welches jeweils vom Spieler oder Angreifer erzeugt wird
    function Shot(x, y, dY) {
        this.x = x;
        this.y = y;
        this.dY = dY;
        this.alive = true;

        this.move = function () {
            this.y += dY;
            return this.y > 0 && this.y < co.width + 100;
        };

        this.draw = function () {
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y, 5, 20);
        };
    }

    function Particle(x, y, speedX, speedY, radius, fade, color){
        this.x = x;
        this.y = y;
        this.color = color;
        this.speedY = speedY;
        this.speedX = speedX;
        this.radius = radius;
        this.opacity = 1;
        
        this.move = function (){
            this.draw();
            this.x += speedX;
            this.y += speedY;
            // Der background soll nicht faden, daher wird es je nach Particel verwendung mit dem Flag gesteuert
            if(fade){
                this.opacity -= 0.01;
            }
        }
        this.draw = function (){
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
    }


    //  ===================================== Funktionen ==================================

    function initVars() {
        invaders = []; // jeder invader kommt in das Array, damit ist es einfacher durch alle zu iterieren, filtern etc.
        invaderIndex = 0;
        animate = false; // steuert die animation
        tCode = null; // aktiver tasten code
        isBtnPressed = false; // um raumschiff nur gezielt zu bewegen
        directionX = 0; // directionX wird Global festgelegt, damit es für alle Angreifer gilt und nicht jeder einzeln sein Bröchten backt

        soundSwitch = true; // default, sound an
        canonShot = null;
        invaderShot = null;

        particles = [];
        score = 0;
    }

    function playSound(path) {
        if (soundSwitch) {
            let sound = new Audio();
            sound.src = path;
            sound.volume = 0.1;
            sound.play();
        }
    }

    // Aktive invader werden ermittelt und davon wird dann ein zufälliger Angreifer bestimmt
    function randomInvaderAttack() {

        if (invaderShot && !invaderShot.move()) {
            invaderShot = null;
        }

        if (!invaderShot) {
            let aliveInvaders = invaders.filter(invader => invader.alive);
            let randomInvader = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            invaderShot = randomInvader.fire(randomInvader, 2);
            playSound(allSounds.attack);
        }
    }

    function render() {
        ctx.clearRect(0, 0, co.width, co.height);
        animate = requestAnimationFrame(render); // 60 fps

        drawScore();

        playerCanon.move();

        invaders.forEach(invader => invader.move());
        particles.forEach((particle , index) => {

            if(particle.y >= co.height - particle.radius){
                particle.y = 0 - particle.radius;
                particle.x = Math.random() * co.width;
            }

            if(particle.opacity <= 0){
                setTimeout(() => {
                    particles.splice(index, 1);
                },0)
            } else{
                particle.move()
            }
        });

        // Zeichnen der Kugel, wenn diese aktiv sind
        canonShot && canonShot.draw();
        invaderShot && invaderShot.draw();

        
        if (canonShot) {
            canonShotCheck();
        }

        if (isGameOver()) {
            gameEnds(allSounds.over, "GAME OVER!");
        }

        if (hasWon()) {
            gameEnds(allSounds.win, "DU HAST GEWONNEN!");
        }
    }

    // Prüfen ob Spielerkugel Invader getroffen hat oder noch im Spielfeld ist
    function canonShotCheck(){
        let hit = invaders.find(invader => invader.isHitBy(canonShot));

            // Beim treffen eines invaders
            if (hit) {
                createParticles(hit.x, hit.y, 20, 5, 'lime');
                playSound(allSounds.death);
                hit.alive = false;
                canonShot = null;
                hit = null;
                score += INVADER_POINTS;
            } else {
                // Beim verlassen des Spielfeldes
                if (!canonShot.move()) {
                    canonShot = null;
                }
            }
        }
        
        // sieg oder niederlage... das vorgehen bleibt gleich nur mit anderem sound und text
        function gameEnds(sound, text) {
        
        score += DEATH_POINTS;
        playSound(sound);

        let outputDiv = el('#output');
        outputDiv.innerText = "";

        el('#btn-start').innerText = "RESTART GAME";

        let p = create('p');
        p.innerText = text;
        let pScore = create('p');
        pScore.innerText = `Du hast ${score} Punkte!`;
        outputDiv.append(p);
        outputDiv.append(pScore);

        cancelAnimationFrame(animate);
        startGame();
    }


    function startGame() {
        ctx.clearRect(0, 0, co.width, co.height);
        initVars();
        createBackground();
        invadersKlonFabrik();
        playerCanon.draw();
        invaders.forEach(invader => invader.draw());
    }

    function invadersKlonFabrik() {
        let x = 10, y = 80, gap = 60;
        // loop startet bei 1 damit wir hier mit Modulo rechnen können
        for (let i = 1; i <= 40; i++) {
            let klon = Object.create(protoInvader);
            klon.init();

            // Positionierung
            klon.x = x;
            klon.y = y;

            x += gap;
            // Durch Mudolo bestimmen wir wieviele Invader in einer reihe kommen
            if (i % INVADER_PER_ROW == 0) {
                x = INVADER_PER_ROW;
                y += 50;
            }
        }
    }

    function createBackground(){
        for(let i = 0; i < 100; i++){
            particles.push(new Particle(
                Math.random() * co.width, 
                Math.random() * co.height, 
                0, 
                0.5, 
                Math.random() * 3, 
                false,
                'white'));
        }
    }

    function createParticles(x, y, numOfParticles, scale, color){
        for(let i = 0; i < numOfParticles; i++){
            particles.push(new Particle(
                x, 
                y, 
                (Math.random() - 0.5 ) * 2, 
                (Math.random() - 0.5 ) * 2, 
                Math.random() * scale, 
                true,
                color));
        }
    }

    function isGameOver() {
        return playerCanon.isHitBy(invaderShot) || invaders.find(invader => invader.alive && invader.y > (co.height - 50));
    }

    function hasWon() {
        return !invaders.find(invader => invader.alive && invader.y < (co.height - 50));
    }

    //  ===================================== Kollisionslogik =====================
    function kollision(enemyX, ourStartX, ourEndX) {
        return ourStartX < enemyX && enemyX < ourEndX;
    }

    function checkDown(e) {
        tCode = e.key;
        isBtnPressed = true;
    }

    function checkUp(e) {
        isBtnPressed = false;
    }

    function drawScore(){
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = TEXT_SIZE + "px Comic Sans MS";
        ctx.fillText(`Score ${score}`, co.width - playerCanon.w/2, 50)
    }
    
    //  ===================================== Aufrufe und Zuweisungen =====================
    startGame();
    //  ===================================== Tastatur erkennung =====================


    el('#btn-start').addEventListener('click', function () {
        if (!animate) {
            let outputDiv = el('#output');
            outputDiv.innerText = "";

            this.innerText = "Started";
            render();
        } else {
            cancelAnimationFrame(animate);
            this.innerText = "Paused";
            animate = false;
        }
    });

    el('#btn-audio').addEventListener('click', function () {
        soundSwitch = !soundSwitch;
        if (soundSwitch) {
            this.innerText = 'Sound Off';
        } else {
            this.innerText = 'Sound On';
        }
    });

    document.addEventListener('keydown', checkDown);
    document.addEventListener('keyup', checkUp);

}

// lässt die ganze Party starten
myGame();
