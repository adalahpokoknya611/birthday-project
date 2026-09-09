const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const matrixMusic = document.getElementById("matrixMusic");
const matrixClickPrompt = document.getElementById("matrixClickPrompt");

let matrixStarted = false;

function startMatrix() {
    if (matrixStarted) return;

    matrixStarted = true;
    matrixMusic.play().catch(() => {});
    sceneStartTime = Date.now();
}

matrixClickPrompt.addEventListener("click", function() {
    matrixClickPrompt.classList.add("hidden");
    startMatrix();
}, { once: true });


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const characters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ♡";
const fontSize = 16;

let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(0);


// =====================================================
// COUNTDOWN SETTINGS
// =====================================================

const numberPatterns = {
    3: [
        "000000011111100000000",
        "000001111111111110000",
        "000011111100011111100",
        "000111110000001111110",
        "001111100000000111110",
        "000000000000000111110",
        "000000000000001111100",
        "000000000001111110000",
        "000000001111111000000",
        "000000001111111000000",
        "000000000001111110000",
        "000000000000001111100",
        "001111100000000111110",
        "000111110000001111110",
        "000011111100011111100",
        "000001111111111110000",
        "000000011111100000000"
    ],

    2: [
        "000000011111100000000",
        "000001111111111110000",
        "000011111100011111100",
        "000111110000001111110",
        "001111100000000111110",
        "000000000000001111110",
        "000000000000011111100",
        "000000000001111110000",
        "000000000111111000000",
        "000000011111100000000",
        "000001111110000000000",
        "000011111000000000000",
        "000111110000000000000",
        "001111100000000000000",
        "011111111111111111111",
        "111111111111111111111"
    ],

    1: [
        "000000001111000000000",
        "000000111111000000000",
        "000001111111000000000",
        "000011111111000000000",
        "000111111111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000001111000000000",
        "000000011111100000000",
        "000001111111110000000",
        "000111111111111000000"
    ]
};


// =====================================================
// COUNTDOWN DOTS
// =====================================================

const DOT_RADIUS = 8;
const DOT_SPACING = 15;

let countdownDots = [];

let countdownNumber = 3;

let sceneStartTime = Date.now();

const NUMBER_DURATION = 2500;

let countdownStarted = false;


// =====================================================
// WORD PARTICLES
// =====================================================

const WORD_DOT_RADIUS = 4.5;

const WORD_DOT_SPACING = 8;

const WORD_PARTICLE_COUNT = 650;

let wordDots = [];

let transformationStarted = false;

let transformationPhase = "none";

let transformationStartTime = 0;

let transformationWordIndex = 0;


// Replace FINAL_WORD with your final word.
const transformationWords = [
    "HAPPY",
    "BIRTHDAY",
    "SHAKIRA"
];

let currentWordTargets = [];


// =====================================================
// HEART BACKGROUND
// =====================================================

let sceneMode = "matrix";

let heartParticles = [];

let heartTransitionStart = 0;

const HEART_COUNT = 100;


// =====================================================
// MEMORY SCENE
// =====================================================

let memorySceneShown = false;


// =====================================================
// CREATE NUMBER
// =====================================================

function createCountdownNumber(number) {

    countdownDots = [];

    const pattern = numberPatterns[number];

    const width =
        pattern[0].length * DOT_SPACING;

    const height =
        pattern.length * DOT_SPACING;

    const startX =
        canvas.width / 2 - width / 2;

    const startY =
        canvas.height / 2 - height / 2;


    for (let y = 0; y < pattern.length; y++) {

        for (let x = 0; x < pattern[y].length; x++) {

            if (pattern[y][x] === "1") {

                countdownDots.push({
                    x: startX + x * DOT_SPACING,
                    y: startY + y * DOT_SPACING
                });
            }
        }
    }
}


// =====================================================
// GET TEXT DOT POSITIONS
// =====================================================

function getTextPoints(word) {

    const textCanvas =
        document.createElement("canvas");

    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;

    const textCtx =
        textCanvas.getContext("2d");


    const textSize =
        Math.min(
            canvas.width * 0.16,
            170
        );


    textCtx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    textCtx.fillStyle = "#ffffff";

    textCtx.font =
        `900 ${textSize}px Arial Black, Arial, sans-serif`;

    textCtx.textAlign = "center";

    textCtx.textBaseline = "middle";


    textCtx.fillText(
        word,
        canvas.width / 2,
        canvas.height / 2
    );


    const image =
        textCtx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const points = [];


    for (
        let y = 0;
        y < canvas.height;
        y += WORD_DOT_SPACING
    ) {

        for (
            let x = 0;
            x < canvas.width;
            x += WORD_DOT_SPACING
        ) {

            const index =
                (y * canvas.width + x) * 4;


            if (
                image.data[index + 3] > 100
            ) {

                points.push({
                    x: x,
                    y: y
                });
            }
        }
    }


    return points;
}


// =====================================================
// RESAMPLE TARGETS
// =====================================================

function makeExactTargets(points) {

    const targets = [];

    if (points.length === 0) {
        return targets;
    }


    for (
        let i = 0;
        i < WORD_PARTICLE_COUNT;
        i++
    ) {

        const index =
            Math.floor(
                i * points.length /
                WORD_PARTICLE_COUNT
            );


        const point =
            points[
                Math.min(
                    index,
                    points.length - 1
                )
            ];


        targets.push({
            x: point.x,
            y: point.y
        });
    }


    return targets;
}


// =====================================================
// CREATE WORD PARTICLES
// =====================================================

function createWordParticles() {

    wordDots = [];


    for (
        let i = 0;
        i < WORD_PARTICLE_COUNT;
        i++
    ) {

        const source =
            countdownDots[
                i % countdownDots.length
            ];


        wordDots.push({

            x:
                source.x +
                (Math.random() - 0.5) * 12,

            y:
                source.y +
                (Math.random() - 0.5) * 12,

            startX: 0,
            startY: 0,

            targetX: 0,
            targetY: 0
        });
    }
}


// =====================================================
// PREPARE WORD
// =====================================================

function prepareWord(word) {

    const points =
        getTextPoints(word);


    currentWordTargets =
        makeExactTargets(points);


    for (
        let i = 0;
        i < wordDots.length;
        i++
    ) {

        wordDots[i].startX =
            wordDots[i].x;

        wordDots[i].startY =
            wordDots[i].y;


        wordDots[i].targetX =
            currentWordTargets[i].x;

        wordDots[i].targetY =
            currentWordTargets[i].y;
    }
}


// =====================================================
// DRAW COUNTDOWN
// =====================================================

function drawCountdown() {

    for (const dot of countdownDots) {

        ctx.beginPath();

        ctx.arc(
            dot.x,
            dot.y,
            DOT_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#fff7fc";

        ctx.fill();
    }
}


// =====================================================
// DRAW WORD PARTICLES
// =====================================================

function drawWordParticles() {

    for (const dot of wordDots) {

        ctx.beginPath();

        ctx.arc(
            dot.x,
            dot.y,
            WORD_DOT_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#fff7fc";

        ctx.fill();
    }
}


// =====================================================
// SMOOTH MOVEMENT
// =====================================================

function moveWordParticles(progress) {

    const eased =
        progress * progress *
        (3 - 2 * progress);


    for (const dot of wordDots) {

        dot.x =
            dot.startX +
            (
                dot.targetX -
                dot.startX
            ) * eased;


        dot.y =
            dot.startY +
            (
                dot.targetY -
                dot.startY
            ) * eased;
    }
}


// =====================================================
// CREATE HEART PARTICLES
// =====================================================

function createHeartParticles() {

    heartParticles = [];

    for (let i = 0; i < HEART_COUNT; i++) {

        heartParticles.push({

            x:
                Math.random() *
                canvas.width,

            y:
                Math.random() *
                canvas.height,

            size:
                4 +
                Math.random() * 5,

            speed:
                0.05 +
                Math.random() * 0.15,

            drift:
                (Math.random() - 0.5) * 0.12,

            opacity:
                0.12 +
                Math.random() * 0.28,

            phase:
                Math.random() *
                Math.PI *
                2
        });
    }
}


// =====================================================
// DRAW HEART BACKGROUND
// =====================================================

function drawHeartBackground() {

    for (const heart of heartParticles) {

        heart.y -= heart.speed;

        heart.x += heart.drift;

        heart.phase += 0.008;


        if (heart.y < -20) {

            heart.y =
                canvas.height + 20;
        }


        if (heart.x < -20) {

            heart.x =
                canvas.width + 20;
        }


        if (
            heart.x >
            canvas.width + 20
        ) {

            heart.x = -20;
        }


        const pulse =
            Math.sin(heart.phase) * 0.04;


        ctx.globalAlpha =
            Math.max(
                0,
                heart.opacity + pulse
            );


        ctx.font =
            `${heart.size}px Arial`;

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        ctx.fillStyle = "#d85b91";


        ctx.fillText(
            "♡",
            heart.x,
            heart.y
        );
    }


    ctx.globalAlpha = 1;
}


// =====================================================
// START WORD TRANSFORMATION
// =====================================================

function startTransformation() {

    transformationStarted = true;

    transformationPhase =
        "forming";

    transformationStartTime =
        Date.now();

    transformationWordIndex = 0;


    createWordParticles();

    prepareWord(
        transformationWords[0]
    );
}


// =====================================================
// UPDATE TRANSFORMATION
// =====================================================

function updateTransformation() {

    if (!transformationStarted) {
        return;
    }


    const elapsed =
        Date.now() -
        transformationStartTime;


    // ---------------------------------------------
    // FORMING
    // ---------------------------------------------

    if (
        transformationPhase ===
        "forming"
    ) {

        const duration = 1300;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        moveWordParticles(progress);


        if (progress >= 1) {

            transformationPhase =
                "holding";

            transformationStartTime =
                Date.now();
        }

        return;
    }


    // ---------------------------------------------
    // HOLD
    // ---------------------------------------------

    if (
        transformationPhase ===
        "holding"
    ) {

        if (elapsed >= 2000) {

            transformationWordIndex++;


            // -----------------------------------------
            // FINAL WORD
            // -----------------------------------------

            if (
                transformationWordIndex >=
                transformationWords.length
            ) {

                transformationWordIndex =
                    transformationWords.length - 1;


                // Hold final word for 1.5 seconds,
                // then start heart transition.
                if (
                    elapsed >= 3500 &&
                    sceneMode === "matrix"
                ) {

                    sceneMode =
                        "heart_transition";

                    heartTransitionStart =
                        Date.now();

                    createHeartParticles();

                    transformationPhase =
                        "finished";
                }

                return;
            }


            // -----------------------------------------
            // NEXT WORD
            // -----------------------------------------

            prepareWord(
                transformationWords[
                    transformationWordIndex
                ]
            );


            transformationPhase =
                "forming";

            transformationStartTime =
                Date.now();
        }
    }
}


// =====================================================
// UPDATE COUNTDOWN
// =====================================================

function updateCountdown() {

    const elapsed =
        Date.now() -
        sceneStartTime;


    // ---------------------------------------------
    // WAIT BEFORE SHOWING 3
    // ---------------------------------------------

    if (!countdownStarted) {

        if (elapsed >= 3000) {

            countdownStarted = true;

            countdownNumber = 3;

            sceneStartTime =
                Date.now();

            createCountdownNumber(3);
        }

        return;
    }


    const numberElapsed =
        Date.now() -
        sceneStartTime;


    // ---------------------------------------------
    // 3 → 2
    // ---------------------------------------------

    if (
        countdownNumber === 3 &&
        numberElapsed >= NUMBER_DURATION
    ) {

        countdownNumber = 2;

        sceneStartTime =
            Date.now();

        createCountdownNumber(2);

        return;
    }


    // ---------------------------------------------
    // 2 → 1
    // ---------------------------------------------

    if (
        countdownNumber === 2 &&
        numberElapsed >= NUMBER_DURATION
    ) {

        countdownNumber = 1;

        sceneStartTime =
            Date.now();

        createCountdownNumber(1);

        return;
    }


    // ---------------------------------------------
    // 1 → HAPPY
    // ---------------------------------------------

    if (
        countdownNumber === 1 &&
        !transformationStarted &&
        numberElapsed >= NUMBER_DURATION
    ) {

        startTransformation();
    }
}


// =====================================================
// MATRIX RAIN
// YOUR ORIGINAL CODE
// =====================================================

function draw() {

    // Dark background with a little transparency
    ctx.fillStyle =
        "rgba(5, 5, 7, 0.08)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.font =
        `${fontSize}px monospace`;


    for (
        let i = 0;
        i < drops.length;
        i++
    ) {

        const character =
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];


        ctx.fillStyle =
            Math.random() > 0.8
                ? "#ffffff"
                : "#d85b91";


        ctx.fillText(
            character,
            i * fontSize,
            drops[i] * fontSize
        );


        if (
            drops[i] * fontSize >
            canvas.height &&
            Math.random() > 0.975
        ) {

            drops[i] = 0;
        }


        drops[i]++;
    }


    // -----------------------------
    // COUNTDOWN
    // -----------------------------

    updateCountdown();

    updateTransformation();


    // =================================================
    // NORMAL MATRIX / COUNTDOWN / WORDS
    // =================================================

    if (sceneMode === "matrix") {

        if (countdownStarted) {

            if (transformationStarted) {

                drawWordParticles();

            } else {

                drawCountdown();
            }
        }
    }


    // =================================================
    // CLEAN HEART TRANSITION
    // =================================================

    else if (
        sceneMode === "heart_transition"
    ) {

        const fadeElapsed =
            Date.now() -
            heartTransitionStart;


        // ---------------------------------------------
        // 1. Fade the old Matrix away
        // ---------------------------------------------

        const matrixFade =
            Math.min(
                fadeElapsed / 2200,
                1
            );


        ctx.fillStyle =
            "#050507";


        ctx.globalAlpha =
            matrixFade;


        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.globalAlpha = 1;


        // ---------------------------------------------
        // 2. Bring hearts in smoothly
        // ---------------------------------------------

        const heartProgress =
            Math.min(
                fadeElapsed / 2200,
                1
            );


        ctx.globalAlpha =
            heartProgress;


        drawHeartBackground();


        ctx.globalAlpha = 1;


        // ---------------------------------------------
        // 3. MEMORY SCENE FADES IN
        // ---------------------------------------------

        const memoryScene =
            document.getElementById(
                "memoryScene"
            );


        if (!memorySceneShown) {

            memorySceneShown = true;


            // Show it immediately,
            // but make it transparent first.
            memoryScene.style.display =
                "block";

            memoryScene.style.opacity =
                "0";

            memoryScene.style.background =
                "transparent";

            memoryScene.style.transition =
                "opacity 2200ms ease";

            memoryScene.scrollTop = 0;


            // Wait one browser frame so the
            // opacity transition starts cleanly.
            requestAnimationFrame(() => {

                memoryScene.style.opacity =
                    "1";
            });
        }
    }
}


// =====================================================
// EXACT SAME 45ms RAIN TIMER
// =====================================================

setInterval(function() {
    if (matrixStarted) {
        draw();
    }
}, 45);