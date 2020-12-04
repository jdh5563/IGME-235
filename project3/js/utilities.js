// Establish keyboard controls
// BOOST: Spacebar
// FORWARD: W
// LEFT: A
// BACKWARD: S
// RIGHT: D
const keyboard = Object.freeze({
    BOOST: 32,
    FORWARD: 87,
    LEFT: 65,
    BACKWARD: 83,
    RIGHT: 68
});

const keys = [];

window.onkeyup = (e) => {
    keys[e.keyCode] = false;
    e.preventDefault();
}

window.onkeydown = (e) => {
    keys[e.keyCode] = true;
}

// Bounding box collision detection - it compares PIXI.Rectangles
function rectsIntersect(sprite1, sprite2) {
    let sprite1Bounds = sprite1.getBounds();
    let sprite2Bounds = sprite2.getBounds();

    return sprite1Bounds.x + sprite1Bounds.width > sprite2Bounds.x && 
    sprite1Bounds.x < sprite2Bounds.x + sprite2Bounds.width && 
    sprite1Bounds.y + sprite1Bounds.height > sprite2Bounds.y && 
    sprite1Bounds.y < sprite2Bounds.y + sprite2Bounds.height;
}

// Clamps an object between min and max
function clamp(val, min, max) {
    return val < min ? min : (val > max ? max : val);
}

// Returns a random number between min and max
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// Gives the dot product of 2 vectors
function dotProduct(vector1, vector2) {
    return (vector1.x * vector2.x) + (vector1.y * vector2.y);
}

// Returns a normalized version of a vector
function getNormalized(vector) {
    let normalizedVector = vector;
    magnitude = Math.hypot(vector.x, vector.y);
    if (magnitude != 1 && magnitude != 0) {
        normalizedVector.x = vector.x / magnitude;
        normalizedVector.y = vector.y / magnitude;
    }

    return normalizedVector;
}

// Projects a vector onto a target vector
function project(vector, targetVector) {
    let projectedVector = { x: 0, y: 0 };
    let normalizedTarget = getNormalized(targetVector);
    let scalar = dotProduct(vector, normalizedTarget);

    return projectedVector = { x: scalar * normalizedTarget.x, y: scalar * normalizedTarget.y };
}