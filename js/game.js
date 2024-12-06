/**
 * Game code
 * @author AlexEtienne
 * @since 2024-12-05
 */

//#region Constants

// Get the canvas and its 2d context
const CANVAS = document.querySelector("#game canvas");
const CTX = CANVAS.getContext("2d");

// Set the size of the canvas
CANVAS.width = 1920;
CANVAS.height = 1080;

// Animations
const ANIMATIONS = {
    idle: {
        size: 8,
        stepWait: 8,
        loop: true
    },
    walk: {
        size: 11,
        stepWait: 3,
        loop: true
    },
    jump: {
        size: 5,
        stepWait: 3,
        loop: false
    }
}

// Sprites
const PLAYER_SPRITES = {};
for (let name of Object.keys(ANIMATIONS)) {
    for (let j = 0; j < ANIMATIONS[name].size; j++) {
        for (let dir of ["left", "right"]) {
            const animName = name + j + "-" + dir;
            PLAYER_SPRITES[animName] = new Image();
            PLAYER_SPRITES[animName].src = `./img/player/${animName}.png`;
        }
    }
}
const PLAYER_SPRITE_WIDTH = 127.5;
const PLAYER_SPRITE_HEIGHT = 135;

// Delta-time
const DEFAULT_FPS = 60;

// Game
const PHASES_DURATION = [
    2000,
    20000
];

// First phase
const GIFTS_SPEED = 5;
const GIFTS_NUMBER = 15;
const GIFTS_Y_SPAWN_RANGE = 5000;

// Players
const PLAYER_SPEED = 10;
const PLAYER_JUMP_FORCE = 30;
const DEFAULT_MAX_JUMPS = 2;

// Physics
const GRAVITY_FORCE = 2;

//#endregion

//#region Classes

// Represent a 2d shape
class Transform {
    x;
    y;
    width;
    height;
    targets;
    targetIndex = 0;
    targetsSpeeds;

    /**
     * Constructor.
     * @param x Position of the transform in the X axis.
     * @param y Position of the transform in the Y axis.
     * @param width Width of the transform.
     * @param height Height of the transform.
     * @param targets Destinations (Transform) of the transform.
     * @param targetsSpeed Speeds of all the movements of the transform.
     */
    constructor(x = 0, y = 0, width = 0, height = 0,
                targets = [], targetsSpeed = []) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.targets = targets;
        this.targetsSpeeds = targetsSpeed;
    }
}

// Represent a player
class Player {
    transform;
    direction = false;
    animation = "idle0-left";
    isGrounded = false;
    yVelocity = 0;
    jumpRemaining = DEFAULT_MAX_JUMPS;

    /**
     * Constructor.
     * @param transform Transform of the player.
     */
    constructor(transform = new Transform()) {
        this.transform = transform;
    }
}


//#endregion

//#region Global variables

// Delta-time
let deltaTime = 0;
let lastTick = 0;

// Game
let phase = 0;
let phaseTransforms = [
    [],
    [],
    []
];

// Add the falling gift of the first phase to the list
for (let i = 0; i < GIFTS_NUMBER; i++) {
    phaseTransforms[1].push(
        new Transform(CANVAS.width / 2 - 50 + Math.random() * (CANVAS.width - 100) - (CANVAS.width - 100) / 2,
        -Math.random() * GIFTS_Y_SPAWN_RANGE - 100, 100, 100,
        [
            new Transform(0, CANVAS.height + 100)
        ], [GIFTS_SPEED]));
    phaseTransforms[1][i].targets[0].x = phaseTransforms[1][i].x;
}

let startTime = Date.now();

// Player
let player = new Player(new Transform(CANVAS.width / 2, CANVAS.height / 2, 97.5, 135));

// Inputs
let inputLeft = false;
let inputRight = false;
let inputJump = false;

// Platforms
let platforms = [
    // Side walls
    new Transform(0, 0, 50, CANVAS.height),
    new Transform(CANVAS.width - 50, 0, 50, CANVAS.height),

    // Platforms
    new Transform(300, 800, 300, 100),
    new Transform(CANVAS.width - 600, 800, 300, 100),

    new Transform(CANVAS.width / 2 - 100, 500, 200, 100),

    new Transform(200, 200, 300, 100),
    new Transform(CANVAS.width - 500, 200, 300, 100),
];

// Animation
let animationName = "idle";
let animationStep = 0;
let animationEnded = false;
let animationNextStep = 0;

//#endregion

//region Functions
function setAnimation(name) {
    if (name === animationName || !player.isGrounded && name !== "jump") {
        return;
    }

    animationName = name;
    animationStep = 0;
    animationEnded = false;
}
//endregion

// Main loop
setInterval(() => {
    // Skip if not in game
    if (openedPage !== "game") {
        return;
    }

    // Delta-time
    deltaTime = (performance.now() - lastTick) / (1000 / DEFAULT_FPS);
    lastTick = performance.now();

    //#region Gravity

    // Apply the gravity to the player if he isn"t grounded
    let groundDistance = CANVAS.height - player.transform.y - player.transform.height;
    let ceilDistance = CANVAS.height;
    let leftDistance = null;
    let rightDistance = null;

    for (let platform of platforms) {
        // Check that the platform is under the player and if its the nearest
        let distance = platform.y - player.transform.y - player.transform.height;
        if (platform.y >= player.transform.y + player.transform.height && player.transform.x < platform.x + platform.width &&
        player.transform.x + player.transform.width > platform.x && distance < groundDistance) {
            groundDistance = distance;
        }

        // Check that the platform is over the player and if its the nearest
        distance = player.transform.y - platform.y - platform.height;
        if (platform.y + platform.height <= player.transform.y && player.transform.x < platform.x + platform.width &&
            player.transform.x + player.transform.width > platform.x && distance < ceilDistance) {
            ceilDistance = distance;
        }

        // Left
        distance = player.transform.x - platform.x - platform.width;
        if (platform.x + platform.width <= player.transform.x && player.transform.y <= platform.y + platform.height &&
            player.transform.y + player.transform.height >= platform.y && (distance < leftDistance || leftDistance === null)) {
            leftDistance = distance;
        }

        // Right
        distance = platform.x - player.transform.x - player.transform.width;
        if (platform.x >= player.transform.x + player.transform.width && player.transform.y <= platform.y + platform.height &&
            player.transform.y + player.transform.height >= platform.y && (distance < rightDistance || rightDistance === null)) {
            rightDistance = distance;
        }
    }

    if (groundDistance === 0) {
        player.isGrounded = true;
    } else {
        player.yVelocity += GRAVITY_FORCE * deltaTime;
        player.isGrounded = false;

        if (player.yVelocity > 0 && groundDistance < player.yVelocity * deltaTime) {
            player.transform.y += groundDistance;
            player.yVelocity = 0;
            player.isGrounded = true;
            setAnimation(inputLeft ||inputRight ? "walk" : "idle");
        } else if (player.yVelocity < 0 && ceilDistance < -player.yVelocity * deltaTime) {
            player.transform.y -= ceilDistance;
            player.yVelocity = 0;
        }
    }

    // Reload jumps remaining
    if (player.isGrounded) {
        player.jumpRemaining = DEFAULT_MAX_JUMPS;
    }

    // Jump
    if (inputJump && player.jumpRemaining > 0) {
        inputJump = false;
        player.jumpRemaining--;

        setAnimation("jump");

        player.yVelocity = -PLAYER_JUMP_FORCE;

        if (ceilDistance < -player.yVelocity * deltaTime) {
            player.transform.y -= ceilDistance;
            player.yVelocity = 0;
        }
    }

    player.transform.y += player.yVelocity * deltaTime;

    //#endregion

    //#region Movements

    // Move the player
    if (inputLeft && !inputRight) {
        if (leftDistance !== null && leftDistance < PLAYER_SPEED * deltaTime) {
            player.transform.x -= leftDistance;
            setAnimation("idle");
        } else {
            player.transform.x -= PLAYER_SPEED * deltaTime;
        }

        player.direction = false;
    } else if (inputRight && !inputLeft) {
        if (rightDistance !== null && rightDistance < PLAYER_SPEED * deltaTime) {
            player.transform.x += rightDistance;
            setAnimation("idle");
        } else {
            player.transform.x += PLAYER_SPEED * deltaTime;
        }

        player.direction = true;
    }

    //#endregion

    //#region Phases

    // Control transforms of the actual phase
    for (let transform of phaseTransforms[phase]) {
        if (transform.targets.length > transform.targetIndex) {
            if (transform.x !== transform.targets[transform.targetIndex].x ||
                transform.y !== transform.targets[transform.targetIndex].y) {
                // Move the transform to his target
                transform.x += Math.sign(transform.targets[transform.targetIndex].x - transform.x) *
                    transform.targetsSpeeds[transform.targetIndex] * deltaTime;
                transform.y += Math.sign(transform.targets[transform.targetIndex].y - transform.y) *
                    transform.targetsSpeeds[transform.targetIndex] * deltaTime;
            } else {
                // If the target is reached pass to the next one
                transform.targetIndex++;
            }

            // Check if the player hit the transform and end the game
            if (player.transform.x + player.transform.width > transform.x &&
                player.transform.x < transform.x + transform.width &&
                player.transform.y + player.transform.height > transform.y &&
                player.transform.y < transform.y + transform.height) {
                endGame();
            }
        }
    }

    // Go to the next phase if the actual one is done
    if (phase < PHASES_DURATION.length && Date.now() - startTime >= PHASES_DURATION[phase]) {
        startTime = Date.now();
        phase++;
    } else if (phase === PHASES_DURATION.length) {
        endGame();
    }

    //#endregion

    //region Animations

    if (!animationEnded) {
        animationNextStep += deltaTime;
        if (animationNextStep >= ANIMATIONS[animationName].stepWait) {
            animationStep++;
            animationNextStep = 0;
            if (animationStep >= ANIMATIONS[animationName].size) {
                animationStep = 0;
                if (!ANIMATIONS[animationName].loop) {
                    animationEnded = true;
                    animationStep = ANIMATIONS[animationName].size - 1;
                }
            }
        }
    }

    //endregion

    //region Display

    // Clear the canvas
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

    // Create my anim
    player.animation = `${animationName}${animationStep}-${player.direction ? "right" : "left"}`;

    // Draw the player
    CTX.drawImage(PLAYER_SPRITES[player.animation],
        player.transform.x - (PLAYER_SPRITE_WIDTH - player.transform.width) / 2,
        player.transform.y, PLAYER_SPRITE_WIDTH, PLAYER_SPRITE_HEIGHT);

    // Draw the platforms
    for (let platform of platforms) {
        CTX.fillStyle = "darkgreen";
        CTX.fillRect(platform.x, platform.y, platform.width, platform.height);
        CTX.strokeStyle = "black";
        CTX.lineWidth = 7;
        CTX.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Draw the transforms of the actual phase
    for (let transform of phaseTransforms[phase]) {
        CTX.fillStyle = "darkred";
        CTX.fillRect(transform.x, transform.y, transform.width, transform.height);
        CTX.strokeStyle = "black";
        CTX.lineWidth = 7;
        CTX.strokeRect(transform.x, transform.y, transform.width, transform.height);
    }

    //#endregion
});

//#region Inputs

// Detect if a key is pressed
document.addEventListener("keydown", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        inputLeft = true;
        setAnimation("walk");
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        inputRight = true;
        setAnimation("walk");
    }

    // Jump
    if (e.key === " " || e.key === "ArrowUp") {
        inputJump = true;
    }
});

// Detect if a key is released
document.addEventListener("keyup", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        inputLeft = false;
        if  (!inputRight) {
            setAnimation("idle");
        }
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        inputRight = false;
        if (!inputLeft) {
            setAnimation("idle");
        }
    }

    // Jump
    if (e.key === " " || e.key === "ArrowUp") {
        inputJump = false;
    }
});

//#endregion
