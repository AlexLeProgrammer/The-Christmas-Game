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
        size: 1,
        loop: true,
    },
    jump: {
        size: 5,
        loop: false,
    }
}
const ANIMATION_STEP_WAIT = 3;

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

    /**
     * Constructor.
     * @param x Position of the transform in the X axis.
     * @param y Position of the transform in the Y axis.
     * @param width Width of the transform.
     * @param height Height of the transform.
     */
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

// Represent a player
class Player {
    transform;
    type;
    direction = false;
    animation = "idle0-left";
    isGrounded = false;
    yVelocity = 0;
    jumpRemaining = DEFAULT_MAX_JUMPS;

    /**
     * Constructor.
     * @param transform Transform of the player.
     * @param type Type of the player.
     */
    constructor(transform = new Transform(), type = 0) {
        this.transform = transform;
        this.type = type;
    }
}


//#endregion

//#region Global variables

// Delta-time
let deltaTime = 0;
let lastTick = 0;

// Players
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
            setAnimation("idle");
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
        } else {
            player.transform.x -= PLAYER_SPEED * deltaTime;
        }

        player.direction = false;
    } else if (inputRight && !inputLeft) {
        if (rightDistance !== null && rightDistance < PLAYER_SPEED * deltaTime) {
            player.transform.x += rightDistance;
        } else {
            player.transform.x += PLAYER_SPEED * deltaTime;
        }

        player.direction = true;
    }

    //#endregion

    //region Animations
    if (!animationEnded) {
        animationNextStep += deltaTime;
        if (animationNextStep >= ANIMATION_STEP_WAIT) {
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

    // create my anim
    player.animation = `${animationName}${animationStep}-${player.direction ? "right" : "left"}`;

    // Draw the player
    CTX.drawImage(PLAYER_SPRITES[player.animation],
        player.transform.x - (PLAYER_SPRITE_WIDTH - player.transform.width) / 2,
        player.transform.y, PLAYER_SPRITE_WIDTH, PLAYER_SPRITE_HEIGHT);

    // Draw the platforms
    for (let platform of platforms){
        CTX.fillStyle = "darkgreen";
        CTX.fillRect(platform.x, platform.y, platform.width, platform.height);
        CTX.strokeStyle = "black";
        CTX.lineWidth = 7;
        CTX.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }

    //#endregion

});

//#region Inputs

// Detect if a key is pressed
document.addEventListener("keydown", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        inputLeft = true;
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        inputRight = true;
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
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        inputRight = false;
    }

    // Jump
    if (e.key === " " || e.key === "ArrowUp") {
        inputJump = false;
    }
});

//#endregion
