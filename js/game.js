const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const welcomePopUp = document.getElementById("welcomePopUp");
const victoryPopUp = document.getElementById("victoryPopUp"); 
const gameOverPopUp = document.getElementById("gameOverPopUp"); 
const timeOutPopUp = document.getElementById("timeOutPopUp"); 
const fallPopUp = document.getElementById("fallPopUp"); 

const gameOverReasonText = document.getElementById("gameOverReasonText"); 
const fallReasonText = document.getElementById("fallReasonText"); 
const mainGameContent = document.getElementById("mainGameContent");

const startButton = document.getElementById("startButton");
const nextStageButton = document.getElementById("nextStageButton"); 
const restartButton = document.getElementById("restartButton"); 
const restartButtonTimeOut = document.getElementById("restartButtonTimeOut"); 
const restartButtonFall = document.getElementById("restartButtonFall"); 

let gameStarted = false; 
let currentStage = 1; 

// AUDIO
const bgm = new Audio("audio/bgm.mp3"); bgm.loop = true; bgm.volume = 0.4; 
const jumpSound = new Audio("audio/jump.mp3"); jumpSound.volume = 0.7;
const victorySound = new Audio("audio/victory.mp3");
const gameOverSound = new Audio("audio/gameover.mp3");

// Load Gambar 
const playerImg = new Image(); playerImg.src = "assets/gojo_sprite_sheet_fixed.png";
const getoImg = new Image(); getoImg.src = "assets/geto_sprite_sheet.png"; 
const tojiImg = new Image(); tojiImg.src = "assets/toji_fixed.png"; 
const sukunaImg = new Image(); sukunaImg.src = "assets/sukuna_fixed.png"; 

// Variabel Status Game
let x, y, width = 60, height = 80; 
let velocityX = 0, velocityY = 0; 
let acceleration = 0.8, friction = 0.85, jumpPower = 16, gravity = 0.8; 
let isGrounded = false, facingRight = true; 
const spriteCols = 4, spriteRows = 4; let currentFrame = 0, currentRow = 0, gameFrame = 0, staggerFrames = 8; 

let timeLeft = 60; 
let isLevelComplete = false, isGameOver = false;
let countdown;

// Peta Dinamis
let platforms = [];
let groundSegments = [];
let enemies = [];
let geto = { x: 0, y: 0, width: 60, height: 80, spriteCols: 2, spriteRows: 2, isHappy: false };

// --- STAGE MANAGER ---
function loadStage(stageNumber) {
    x = 100; y = 800; velocityX = 0; velocityY = 0;
    facingRight = true; isGrounded = false;
    isGameOver = false; isLevelComplete = false;
    timeLeft = 60; gameFrame = 0; geto.isHappy = false;

    if (stageNumber === 1) {
        groundSegments = [ { x: 0, width: canvas.width } ];
        platforms = [
            { x: 300, y: 800, width: 200, height: 30 },
            { x: 650, y: 650, width: 200, height: 30 },
            { x: 1000, y: 500, width: 200, height: 30 },
            { x: 1350, y: 650, width: 200, height: 30 },
            { x: 1650, y: 800, width: 200, height: 30 },
        ];
        geto.x = platforms[4].x + 60; geto.y = platforms[4].y - 80;
        enemies = [
            { name: "Toji", x: 800, y: 840, width: 70, height: 110, patrolSpeed: 1.5, chaseSpeed: 4, speed: 1.5, detectionRadius: 400, img: tojiImg, spriteCols: 4, spriteRows: 2, currentFrame: 0, currentRow: 0, staggerFrames: 10, color: "darkgreen" },
            { name: "Sukuna", x: 1500, y: 840, width: 70, height: 110, patrolSpeed: 1, chaseSpeed: 3.5, speed: -1, detectionRadius: 450, img: sukunaImg, spriteCols: 4, spriteRows: 2, currentFrame: 0, currentRow: 0, staggerFrames: 12, color: "darkred" }
        ];
    } 
    else if (stageNumber === 2) {
        groundSegments = [
            { x: 0, width: 300 },     
            { x: 1600, width: 320 }   
        ];
        platforms = [
            { x: 375, y: 800, width: 200, height: 30 }, 
            { x: 650, y: 700, width: 650, height: 30 }, // Toji Place
            { x: 800, y: 560, width: 200, height: 30 },  
            { x: 1200, y: 500, width: 500, height: 30 }, // Sukuna Place
            { x: 950, y: 380, width: 200, height: 30 },  
        ];
        geto.x = 1750; geto.y = 950 - 80; 
        enemies = [
            { name: "Toji", x: 650, y: 700 - 110, width: 70, height: 110, patrolSpeed: 2, chaseSpeed: 4, speed: 2, detectionRadius: 300, img: tojiImg, spriteCols: 4, spriteRows: 2, currentFrame: 0, currentRow: 0, staggerFrames: 10, color: "darkgreen", minX: 650, maxX: 1300 },
            { name: "Sukuna", x: 1200, y: 500 - 110, width: 70, height: 110, patrolSpeed: 1.8, chaseSpeed: 4, speed: -1.8, detectionRadius: 400, img: sukunaImg, spriteCols: 4, spriteRows: 2, currentFrame: 0, currentRow: 0, staggerFrames: 12, color: "darkred", minX: 1200, maxX: 1630 }
        ];
    }
}

loadStage(currentStage);

let keys = {};
window.addEventListener("keydown", function(e) { if (gameStarted) keys[e.code] = true; });
window.addEventListener("keyup", function(e) { keys[e.code] = false; });

// --- FITUR BARU: KONEKSI KONTROL LAYAR SENTUH ---
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnJump = document.getElementById("btnJump");

function addTouch(btn, key) {
    if (!btn) return;
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if(gameStarted) keys[key] = true; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener("mousedown", (e) => { if(gameStarted) keys[key] = true; });
    btn.addEventListener("mouseup", (e) => { keys[key] = false; });
    btn.addEventListener("mouseleave", (e) => { keys[key] = false; });
}

addTouch(btnLeft, "ArrowLeft");
addTouch(btnRight, "ArrowRight");
addTouch(btnJump, "Space");
// ------------------------------------------------

function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width && objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height && objA.y + objA.height > objB.y;
}

function instantReset() {
    loadStage(currentStage); 
    gameOverSound.pause(); gameOverSound.currentTime = 0;
    bgm.currentTime = 0; bgm.play().catch(e => console.log("Gagal memutar BGM"));
    clearInterval(countdown);
    startTimer();
}

function resetGameFromEnemy() {
    gameOverPopUp.style.opacity = "0";
    setTimeout(() => { gameOverPopUp.style.display = "none"; document.body.style.overflow = "auto"; }, 300);
    instantReset();
}

function resetGameFromTimeOut() {
    timeOutPopUp.style.opacity = "0";
    setTimeout(() => { timeOutPopUp.style.display = "none"; document.body.style.overflow = "auto"; }, 300);
    instantReset();
}

function resetGameFromFall() {
    fallPopUp.style.opacity = "0";
    setTimeout(() => { fallPopUp.style.display = "none"; document.body.style.overflow = "auto"; }, 300);
    instantReset();
}

function startTimer() {
    countdown = setInterval(function() {
        if (gameStarted && !isGameOver && !isLevelComplete) { 
            timeLeft--;
            if (timeLeft <= 0) { timeLeft = 0; showTimeOutPopUp(); }
        }
    }, 1000);
}

startButton.addEventListener("click", function() {
    welcomePopUp.style.opacity = "0";
    setTimeout(() => {
        welcomePopUp.style.display = "none"; mainGameContent.style.display = "block"; document.body.style.overflow = "auto"; 
    }, 500);
    bgm.play().catch(e => console.log("Gagal memutar BGM"));
    gameStarted = true; startTimer(); 
});

restartButton.addEventListener("click", function() { resetGameFromEnemy(); });
restartButtonTimeOut.addEventListener("click", function() { resetGameFromTimeOut(); });
restartButtonFall.addEventListener("click", function() { resetGameFromFall(); }); 

nextStageButton.addEventListener("click", function() {
    victoryPopUp.style.opacity = "0";
    setTimeout(() => {
        victoryPopUp.style.display = "none";
        document.body.style.overflow = "auto"; 
        canvas.style.display = "block"; 

        if (currentStage === 1) {
            currentStage = 2; 
            instantReset(); 
            gameStarted = true;
        } else {
            alert("CONGRATULATIONS! You have completed all stages and reached your Happy Ending!");
            location.reload(); 
        }
    }, 300);
});

function prepareGameOver() {
    isGameOver = true; bgm.pause(); gameOverSound.currentTime = 0; gameOverSound.play();
    clearInterval(countdown); document.body.style.overflow = "hidden"; 
}

function showGameOverPopUp(reason) {
    prepareGameOver();
    gameOverReasonText.innerText = reason; 
    gameOverPopUp.style.display = "flex";
    setTimeout(() => { gameOverPopUp.style.opacity = "1"; }, 10);
}

function showTimeOutPopUp() {
    prepareGameOver();
    timeOutPopUp.style.display = "flex";
    setTimeout(() => { timeOutPopUp.style.opacity = "1"; }, 10);
}

function showFallPopUp(reason) {
    prepareGameOver();
    fallReasonText.innerText = reason; 
    fallPopUp.style.display = "flex";
    setTimeout(() => { fallPopUp.style.opacity = "1"; }, 10);
}

function showVictoryPopUp() {
    isLevelComplete = true; gameStarted = false; bgm.pause();
    victorySound.currentTime = 0; victorySound.play();
    clearInterval(countdown); geto.isHappy = true; 

    document.body.style.overflow = "hidden"; canvas.style.display = "none"; 
    victoryPopUp.style.display = "flex";
    setTimeout(() => { victoryPopUp.style.opacity = "1"; }, 10);
}

function gameLoop() {
    if (!isGameOver && !isLevelComplete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 

        let groundY = 950;

        ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.arc(1750, 150, 80, 0, Math.PI * 2); ctx.shadowBlur = 50; ctx.shadowColor = "#ff0055"; ctx.fill(); ctx.shadowBlur = 0; 
        
        for (let g of groundSegments) {
            ctx.fillStyle = "#2a2e31"; 
            ctx.fillRect(g.x, groundY, g.width, 130);
            ctx.fillStyle = "#666666"; 
            ctx.fillRect(g.x, groundY, g.width, 2);
        }
        
        for (let i = 0; i < platforms.length; i++) {
            ctx.fillStyle = "#1a1a1a"; ctx.fillRect(platforms[i].x, platforms[i].y, platforms[i].width, platforms[i].height);
            ctx.strokeStyle = "#ff0055"; ctx.lineWidth = 3; ctx.strokeRect(platforms[i].x, platforms[i].y, platforms[i].width, platforms[i].height);
        }

        ctx.fillStyle = "white";
        ctx.font = "bold 40px 'Press Start 2P', cursive"; 
        ctx.textAlign = "center";
        if (timeLeft <= 10) ctx.fillStyle = (gameFrame % 20 < 10) ? "red" : "white"; 
        
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        let formattedTime = minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
        ctx.fillText("TIME: " + formattedTime, canvas.width / 2, 80);

        if (gameStarted) {
            if (keys["ArrowRight"]) { velocityX += acceleration; facingRight = true; }
            if (keys["ArrowLeft"]) { velocityX -= acceleration; facingRight = false; }
            velocityX *= friction;

            if (keys["Space"] && isGrounded) { 
                velocityY = -jumpPower; isGrounded = false; 
                jumpSound.currentTime = 0; jumpSound.play();
            }
            velocityY += gravity; x += velocityX; y += velocityY;

            isGrounded = false; 

            for (let i = 0; i < platforms.length; i++) {
                let p = platforms[i];
                if (velocityY > 0 && x + width > p.x && x < p.x + p.width) {
                    if (y + height >= p.y && y + height - velocityY <= p.y) {
                        y = p.y - height; velocityY = 0; isGrounded = true;
                    }
                }
            }

            if (!isGrounded) {
                for (let g of groundSegments) {
                    if (x + width > g.x && x < g.x + g.width) {
                        if (y + height >= groundY && y + height - velocityY <= groundY) {
                            y = groundY - height; velocityY = 0; isGrounded = true;
                        }
                        break;
                    }
                }
            }

            if (!isGrounded && y + height > groundY + 50) {
                showFallPopUp("You're fall into the endless and uncertain hopes.");
            }

            if (checkCollision({ x, y, width, height }, geto)) {
                showVictoryPopUp();
            }

            gameFrame++;

            for (let i = 0; i < enemies.length; i++) {
                let e = enemies[i];
                let distX = Math.abs((x + width / 2) - (e.x + e.width / 2));
                let distY = Math.abs((y + height / 2) - (e.y + e.height / 2));
                let isFacingGojo = (e.speed < 0 && x < e.x) || (e.speed > 0 && x > e.x);

                if (distX < e.detectionRadius && distY < 50 && isFacingGojo) {
                    e.currentRow = 1; 
                    if (x < e.x) { e.speed = -e.chaseSpeed; } else { e.speed = e.chaseSpeed; }
                } else {
                    e.currentRow = 0; 
                    if (e.speed > 0) e.speed = e.patrolSpeed;
                    if (e.speed < 0) e.speed = -e.patrolSpeed;
                }

                let boundMin = e.minX !== undefined ? e.minX : 0;
                let boundMax = e.maxX !== undefined ? e.maxX : canvas.width;

                if (e.x + e.width > boundMax) { e.speed = -Math.abs(e.speed); }
                if (e.x < boundMin) { e.speed = Math.abs(e.speed); }

                e.x += e.speed;
                
                if (checkCollision({ x, y, width, height }, e)) {
                    showGameOverPopUp("You're splitted in half.");
                }

                if (gameFrame % e.staggerFrames === 0) {
                    e.currentFrame++; if (e.currentFrame >= e.spriteCols) { e.currentFrame = 0; }
                }

                if (e.img.complete && e.img.naturalWidth > 0) {
                    let sW = e.img.width / e.spriteCols; let sH = e.img.height / e.spriteRows;
                    let sX = e.currentFrame * sW; let sY = e.currentRow * sH; 
                    ctx.save();
                    if (e.speed < 0) { ctx.translate(e.x + e.width / 2, e.y + e.height / 2); ctx.scale(-1, 1); ctx.drawImage(e.img, sX, sY, sW, sH, -e.width / 2, -e.height / 2, e.width, e.height);
                    } else { ctx.drawImage(e.img, sX, sY, sW, sH, e.x, e.y, e.width, e.height); }
                    ctx.restore();
                }
            }

            if (!isGrounded) { currentRow = 3; } else if (Math.abs(velocityX) > 0.5) { currentRow = 1; } else { currentRow = 0; }
            if (currentRow !== 0) { if (gameFrame % staggerFrames === 0) { currentFrame++; if (currentFrame >= spriteCols) { currentFrame = 0; } } } else { currentFrame = 0; }
        }

        if (getoImg.complete && getoImg.naturalWidth > 0) {
            let sW = getoImg.width / geto.spriteCols; let sH = getoImg.height / geto.spriteRows;
            let tR = geto.isHappy ? 1 : 0; let gH = geto.height; let gY = geto.y;
            if (!geto.isHappy && gameStarted) { let breath = Math.sin(gameFrame * 0.04) * 1.5; gH += breath; gY -= breath; }
            ctx.drawImage(getoImg, 0, tR * sH, sW, sH, geto.x, gY, geto.width, gH);
        }

        if (playerImg.complete && playerImg.naturalWidth > 0) { 
            let sW = playerImg.width / spriteCols; let sH = playerImg.height / spriteRows;
            let dH = height; let dY = y;
            if (currentRow === 0 && gameStarted) { let breath = Math.sin(gameFrame * 0.05) * 1.5; dH += breath; dY -= breath; }
            ctx.save(); 
            if (!facingRight) { ctx.translate(x + width / 2, dY + dH / 2); ctx.scale(-1, 1); ctx.drawImage(playerImg, currentFrame * sW, currentRow * sH, sW, sH, -width / 2, -dH / 2, width, dH);
            } else { ctx.drawImage(playerImg, currentFrame * sW, currentRow * sH, sW, sH, x, dY, width, dH); }
            ctx.restore(); 
        }
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();