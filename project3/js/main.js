// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application({
    width: 960,
    height: 540
});

document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

// aliases
let stage;

// game variables
let startScene;
let gameScene, car, ai, boostValue, lapNumber, track, checkpoints, finishLine, maxLaps;
let gameOverScene, gameOverText;
let paused = false;
let background;

function setup() {
    stage = app.stage;

    maxLaps = 3;

    // Create a background image
    track = new Track("images/track.png", { x: -900, y: -650 });
    finishLine = new Checkpoint("images/checkpoint-bottom.png", 8, { x: 500, y: 220 });
    background = PIXI.Sprite.from("images/grass.png");
    checkpoints = [
        new Checkpoint("images/checkpoint-bottom.png", 0, { x: 1050, y: 220 }),
        new Checkpoint("images/checkpoint-right.png", 1, { x: 1150, y: 75 }),
        new Checkpoint("images/checkpoint-right.png", 2, { x: 1150, y: -350 }),
        new Checkpoint("images/checkpoint-top.png", 3, { x: 1050, y: -579 }),
        new Checkpoint("images/checkpoint-top.png", 4, { x: -600, y: -579 }),
        new Checkpoint("images/checkpoint-left.png", 5, { x: -815, y: -350}),
        new Checkpoint("images/checkpoint-left.png", 6, { x: -815, y: 75 }),
        new Checkpoint("images/checkpoint-bottom.png", 7, {x: -600, y: 220 }),
        finishLine
    ];

    // #1 - Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);

    // #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    // #5 - Create car
    car = new Car({ x: sceneWidth / 2, y: sceneHeight / 2 }, 500, 3, 150, .95, 100, 500);
    ai = new AI({ x: sceneWidth / 2, y: sceneHeight / 2 + 45 }, 3, 3, 150, .95, 100, 500);

    boostValue = new PIXI.Text("Boost: " + car.currentBoost);
    boostValue.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 8,
        fontFamily: "Press Start 2P",
        stroke: 0x000000,
        strokeThickness: 6
    });
    boostValue.anchor.set(0.5, 0.5);
    boostValue.x = car.position.x;
    boostValue.y = car.position.y - 25;

    lapNumber = new PIXI.Text("Lap: " + car.currentLap + "/" + maxLaps);
    lapNumber.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 8,
        fontFamily: "Press Start 2P",
        stroke: 0x000000,
        strokeThickness: 6
    });
    lapNumber.anchor.set(0.5, 0.5);
    lapNumber.x = car.position.x;
    lapNumber.y = car.position.y - 50;

    // Add the background to the scene
    startScene.addChild(background);
    startScene.addChild(track);
    for (let check of checkpoints) {
        startScene.addChild(check);
    }

    // Add the car with labels to the scene
    startScene.addChild(car);
    startScene.addChild(ai);
    startScene.addChild(boostValue);
    startScene.addChild(lapNumber);

    gameOverText = new PIXI.Text("Refresh the page to play again!\nThis will be a real game over screen soon.");
    gameOverText.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 8,
        fontFamily: "Press Start 2P",
        stroke: 0x000000,
        strokeThickness: 6
    });
    gameOverText.anchor.set(0.5, 0.5);
    gameOverText.x = sceneWidth / 2;
    gameOverText.y = sceneHeight / 2;
    gameOverScene.addChild(gameOverText);

    // #8 - Start update loop
    app.ticker.add(gameLoop);
}

function startGame() {
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
}

function end() {
    gameOverScene.visible = true;
    gameScene.visible = false;
    startScene.visible = false;
    paused = true;
}

function gameLoop() {
    if (!paused) {
        // #1 - Calculate "delta time"
        let dt = 1 / app.ticker.FPS;
        if (dt > 1 / 12) dt = 1 / 12;

        // Resolves an edge case for boost
        // tracking that causes a flicker
        // for the text at 0 boost
        let zeroBoost = false;
        if (car.currentBoost == 0) {
            zeroBoost = true;
        }

        // Check if the car is on the track
        if (!rectsIntersect(car, track)) {
            car.maxSpeed = 200;
        }
        else {
            car.maxSpeed = 500;
        }

        if(!rectsIntersect(ai, track)){
            ai.maxSpeed = 1;
        }
        else{
            ai.maxSpeed = 3;
        }

        // Update all objects
        car.update(dt);
        ai.update(checkpoints[ai.currentCheckpoint], car, dt);
        track.update(car, dt);
        for (let check of checkpoints) {
            check.update(car, dt);
            check.setCheckpoint(ai);
        }

        // Update boost display
        boostValue.text = "Boost: ";
        if (car.currentBoost == 1 && zeroBoost) {
            boostValue.text += 0;
        }
        else {
            boostValue.text += car.currentBoost;
        }

        lapNumber.text = "Lap: " + car.currentLap + "/" + maxLaps;

        if (car.currentLap > 3) {
            end();
        }
    }
}