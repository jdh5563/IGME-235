// A vehicle that can move around the track
class Car extends PIXI.Sprite {
    constructor(position = { x: 0, y: 0 }, maxSpeed = 1, turningSpeed = 3, accelerationRate = 0.1,
        decelerationRate = 0.95, boostPower = 3, maxBoost = 100) {
        super(app.loader.resources["images/car.png"].texture);
        this.anchor.set(.5, .5); // position, scaling, rotating, etc. are now from center of sprite
        this.scale.set(0.25);
        this.position = position;
        this.maxSpeed = maxSpeed;
        this.turningSpeed = turningSpeed;
        this.accelerationRate = accelerationRate;
        this.decelerationRate = decelerationRate;
        this.boostPower = boostPower;
        this.maxBoost = maxBoost;
        this.direction = { x: 1, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.rotation = 0;
        this.currentBoost = 0;
        this.isBoosting = false;
        this.currentCheckpoint = 8;
        this.currentLap = 0;

    }

    update(dt = 1 / 60) {
        this.move(dt);
    }

    move(dt = 1 / 60) {
        if (keys[keyboard.BOOST] && this.currentBoost > 0) {
            this.isBoosting = true;
            this.currentBoost -= 4;
        }
        else {
            this.isBoosting = false;
            this.currentBoost += 1;
        }

        if (this.currentBoost > this.maxBoost) {
            this.currentBoost = this.maxBoost;
        }
        else if (this.currentBoost < 0) {
            this.currentBoost = 0;
        }

        this.setRotation(dt);
        this.setAcceleration(dt);
        this.setVelocity();
    }

    setRotation(dt = 1 / 60) {
        if (keys[keyboard.LEFT] && Math.hypot(this.velocity.x, this.velocity.y) > 0.01) {
            this.rotation -= this.turningSpeed * dt;
        }
        if (keys[keyboard.RIGHT] && Math.hypot(this.velocity.x, this.velocity.y) > 0.01) {
            this.rotation += this.turningSpeed * dt;
        }

        this.direction.x = Math.cos(this.rotation);
        this.direction.y = Math.sin(this.rotation);
        this.direction = getNormalized(this.direction);
    }

    setAcceleration(dt = 1 / 60) {
        this.acceleration.x = this.direction.x * this.accelerationRate;
        this.acceleration.y = this.direction.y * this.accelerationRate;

        if (this.isBoosting) {
            this.acceleration.x *= this.boostPower;
            this.acceleration.y *= this.boostPower;
        }

        this.acceleration.x *= dt;
        this.acceleration.y *= dt;
    }

    setVelocity() {
        if (keys[keyboard.FORWARD]) {
            this.velocity.x += this.acceleration.x;
            this.velocity.y += this.acceleration.y;
        }
        else if (keys[keyboard.BACKWARD]) {
            this.velocity.x -= this.acceleration.x;
            this.velocity.y -= this.acceleration.y;
        }
        else {
            this.velocity.x *= this.decelerationRate;
            this.velocity.y *= this.decelerationRate;
        }

        this.velocity = project(this.velocity, this.direction);

        if (this.isBoosting) {
            this.velocity.x = clamp(this.velocity.x, -this.maxSpeed - this.boostPower, this.maxSpeed + this.boostPower);
            this.velocity.y = clamp(this.velocity.y, -this.maxSpeed - this.boostPower, this.maxSpeed + this.boostPower);
        }
        else {
            this.velocity.x = clamp(this.velocity.x, -this.maxSpeed, this.maxSpeed);
            this.velocity.y = clamp(this.velocity.y, -this.maxSpeed, this.maxSpeed);
        }
    }
}

class AI extends Car {
    constructor(position = { x: 0, y: 0 }, maxSpeed = 1, turningSpeed = 3, accelerationRate = 0.1,
        decelerationRate = 0.95, boostPower = 3, maxBoost = 100) {
        super(position, maxSpeed, turningSpeed, accelerationRate,
            decelerationRate, boostPower, maxBoost);
    }

    update(checkpoint, player, dt = 1/60){
        // Assign any acceleration
        this.setAcceleration(checkpoint);

        // Apply the acceleration to velocity
        this.velocity.x += this.acceleration.x * dt;
        this.velocity.y += this.acceleration.y * dt;
        this.velocity.x = clamp(this.velocity.x, -this.maxSpeed, this.maxSpeed);
        this.velocity.y = clamp(this.velocity.y, -this.maxSpeed, this.maxSpeed);

        // Apply the velocity to position
        this.position.x += this.velocity.x;
        this.position.x -= player.velocity.x * dt;
        this.position.y += this.velocity.y;
        this.position.y -= player.velocity.y * dt;

        // Apply the velocity to direction
        this.direction = getNormalized(this.velocity);

        // Rotate based on the direction
        this.rotation = Math.atan2(this.direction.y, this.direction.x);
    }

    setAcceleration(checkpoint) {
        let desiredPosition = {
            x: getRandom(checkpoint.position.x, checkpoint.position.x + checkpoint.width),
            y: getRandom(checkpoint.position.y, checkpoint.position.y + checkpoint.height)
        };
        // Calculate desired velocity
		// Vector from position to target
		let desiredVelocity = { x: desiredPosition.x - this.position.x, y: desiredPosition.y - this.position.y };

		// Set desired velocity = max speed
        desiredVelocity = getNormalized(desiredVelocity);
        desiredVelocity.x *= this.maxSpeed;
        desiredVelocity.y *= this.maxSpeed;

        // Calculate the seek steering force
        this.acceleration.x += desiredVelocity.x - this.velocity.x;
        this.acceleration.y += desiredVelocity.y - this.velocity.y;
    }
}

// Represents the track as a whole
class Track extends PIXI.Sprite {
    constructor(sprite, position = { x: 0, y: 0 }) {
        super(app.loader.resources[sprite].texture);
        this.position = position;
    }

    update(car, dt = 1 / 60) {
        this.setPosition(car);
    }

    setPosition(car, dt = 1/60) {
        this.x -= car.velocity.x * dt;
        this.y -= car.velocity.y * dt;
    }
}

// Represents a checkpoint
class Checkpoint extends Track {
    constructor(sprite, orderNumber, position = { x: 0, y: 0 }) {
        super(sprite, position);
        this.orderNumber = orderNumber;

    }

    update(car, dt = 1 / 60) {
        this.setPosition(car);
        this.setCheckpoint(car);
    }

    setCheckpoint(car) {
        if (rectsIntersect(this, car) && this.orderNumber == car.currentCheckpoint) {
            car.currentCheckpoint = (this.orderNumber + 1) % 9;
            if (car.currentCheckpoint == 0) {
                car.currentLap++;
            }
        }
    }
}