// Particle sphere configuration
const sphereRad = 280; // 20..500
const radius_sp = 1; // 1..2
let framesPerRotation = 5000;

let r = 52;
let g = 235;
let b = 222;

const setLightBlue = () => {
    r = 52;
    g = 235;
    b = 222;
};
const setOrange = () => {
    r = 255;
    g = 191;
    b = 0;
};
const setViolet = () => {
    r = 235;
    g = 67;
    b = 250;
};
const setFuchsia = () => {
    r = 201;
    g = 10;
    b = 144;
};

setLightBlue();

const turnSpeed = () => (2 * Math.PI) / framesPerRotation;

const onUserSpeaking = () => {
    console.log("user speaking");
    framesPerRotation = 5000;
    setOrange();
};
const onProcessing = () => {
    console.log("processing");
    framesPerRotation = 1000;
    setViolet();
};
const onAiSpeaking = () => {
    console.log("ai speaking");
    framesPerRotation = 5000;
    setFuchsia();
};
const reset = () => {
    console.log("reset");
    framesPerRotation = 5000;
    setLightBlue();
};

const wait = 1;
let count = wait - 1;
const numToAddEachFrame = 8;
const particleList: { first: Particle | null } = {
    first: null,
};
const recycleBin: { first: Particle | null } = {
    first: null,
};
const particleAlpha = 1; // maximum alpha
const fLen = 320; // represents the distance from the viewer to z=0 depth.

// we will not draw coordinates if they have too large of a z-coordinate (which means they are very close to the observer).
const zMax = fLen - 2;

let turnAngle = 1; // initial angle
const sphereCenterY = 0;
const sphereCenterZ = -3 - sphereRad;
const particleRad = 2.5;

// alpha values will lessen as particles move further back, causing depth-based darkening:
const zeroAlphaDepth = -750;

// random acceleration factors - causes some random motion
const randAccelX = 0.1;
const randAccelY = 0.1;
const randAccelZ = 0.1;
const gravity = 0; // try changing to a positive number (not too large, for example 0.3), or negative for floating upwards.
const rgbString = () => "rgba(" + r + "," + g + "," + b + ",";
// we are defining a lot of variables used in the screen update functions globally so that they don't have to be redefined every frame.
let p: Particle | null = null;
let outsideTest = false;
let nextParticle: Particle | null = null;
let sinAngle = 0;
let cosAngle = 1;
let rotX = 0;
let rotZ = 0;
let depthAlphaFactor = 0;
let i = 0;
let theta = 0;
let phi = 0;
let x0 = 0;
let y0 = 0;
let z0 = 0;

interface Particle {
    x: number;
    y: number;
    z: number;
    velX: number;
    velY: number;
    velZ: number;
    age: number;
    stuckTime: number;
    dead: boolean;
    attack: number;
    hold: number;
    decay: number;
    initialValue: number;
    holdValue: number;
    lastValue: number;
    accelX: number;
    accelY: number;
    accelZ: number;
    projX: number;
    projY: number;
    alpha: number;
    right: boolean;
    prev: Particle | null;
    next: Particle | null;
}

function draw(
    context: CanvasRenderingContext2D,
    displayWidth: number,
    displayHeight: number,
    projCenterX: number,
    projCenterY: number
) {
    // if enough time has elapsed, we will add new particles.
    count++;
    if (count >= wait) {
        count = 0;
        for (i = 0; i < numToAddEachFrame; i++) {
            theta = Math.random() * 2 * Math.PI;
            phi = Math.acos(Math.random() * 2 - 1);
            x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
            y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
            z0 = sphereRad * Math.cos(phi);

            // We use the addParticle function to add a new particle. The parameters set the position and velocity components.
            const newP = addParticle(
                x0,
                sphereCenterY + y0,
                sphereCenterZ + z0,
                0.002 * x0,
                0.002 * y0,
                0.002 * z0
            );

            // we set some "envelope" parameters which will control the evolving alpha of the particles.
            newP.attack = 50;
            newP.hold = 50;
            newP.decay = 100;
            newP.initialValue = 0;
            newP.holdValue = particleAlpha;
            newP.lastValue = 0;

            // the particle will be stuck in one place until this time has elapsed:
            newP.stuckTime = 90 + Math.random() * 20;

            newP.accelX = 0;
            newP.accelY = gravity;
            newP.accelZ = 0;
        }
    }

    // update viewing angle
    turnAngle = (turnAngle + turnSpeed()) % (2 * Math.PI);
    sinAngle = Math.sin(turnAngle);
    cosAngle = Math.cos(turnAngle);

    // background fill
    context.fillStyle = "#000000";
    context.fillRect(0, 0, displayWidth, displayHeight);

    // update and draw particles
    p = particleList.first;
    while (p != null) {
        // before list is altered record next particle
        nextParticle = p.next;

        // update age
        p.age++;

        // if the particle is past its "stuck" time, it will begin to move.
        if (p.age > p.stuckTime) {
            p.velX += p.accelX + randAccelX * (Math.random() * 2 - 1);
            p.velY += p.accelY + randAccelY * (Math.random() * 2 - 1);
            p.velZ += p.accelZ + randAccelZ * (Math.random() * 2 - 1);

            p.x += p.velX;
            p.y += p.velY;
            p.z += p.velZ;
        }

        /*
        We are doing two things here to calculate display coordinates.
        The whole display is being rotated around a vertical axis, so we first calculate rotated coordinates for
        x and z (but the y coordinate will not change).
        Then, we take the new coordinates (rotX, y, rotZ), and project these onto the 2D view plane.
        */
        rotX =
            cosAngle * p.x +
            sinAngle * (p.z - sphereCenterZ);
        rotZ =
            -sinAngle * p.x +
            cosAngle * (p.z - sphereCenterZ) +
            sphereCenterZ;
        const m = (radius_sp * fLen) / (fLen - rotZ);
        p.projX = rotX * m + projCenterX;
        p.projY = p.y * m + projCenterY;

        // update alpha according to envelope parameters.
        if (p.age < p.attack + p.hold + p.decay) {
            if (p.age < p.attack) {
                p.alpha =
                    ((p.holdValue - p.initialValue) / p.attack) * p.age +
                    p.initialValue;
            } else if (p.age < p.attack + p.hold) {
                p.alpha = p.holdValue;
            } else if (p.age < p.attack + p.hold + p.decay) {
                p.alpha =
                    ((p.lastValue - p.holdValue) / p.decay) *
                        (p.age - p.attack - p.hold) +
                    p.holdValue;
            }
        } else {
            p.dead = true;
        }

        // see if the particle is still within the viewable range.
        outsideTest =
            p.projX > displayWidth ||
            p.projX < 0 ||
            p.projY < 0 ||
            p.projY > displayHeight ||
            rotZ > zMax;

        if (outsideTest || p.dead) {
            recycle(p);
        } else {
            // depth-dependent darkening
            depthAlphaFactor = 1 - rotZ / zeroAlphaDepth;
            depthAlphaFactor =
                depthAlphaFactor > 1
                    ? 1
                    : depthAlphaFactor < 0
                    ? 0
                    : depthAlphaFactor;
            context.fillStyle =
                rgbString() + depthAlphaFactor * p.alpha + ")";

            // draw
            context.beginPath();
            context.arc(p.projX, p.projY, m * particleRad, 0, 2 * Math.PI, false);
            context.closePath();
            context.fill();
        }

        p = nextParticle;
    }
}

function addParticle(
    x0: number,
    y0: number,
    z0: number,
    vx0: number,
    vy0: number,
    vz0: number
): Particle {
    let newParticle: Particle;

    // check recycle bin for available drop:
    if (recycleBin.first != null) {
        newParticle = recycleBin.first;
        // remove from bin
        if (newParticle.next != null) {
            recycleBin.first = newParticle.next;
            newParticle.next.prev = null;
        } else {
            recycleBin.first = null;
        }
    } else {
        // if the recycle bin is empty, create a new particle (a new empty object):
        newParticle = {} as Particle;
    }

    // add to beginning of particle list
    if (particleList.first == null) {
        particleList.first = newParticle;
        newParticle.prev = null;
        newParticle.next = null;
    } else {
        newParticle.next = particleList.first;
        particleList.first.prev = newParticle;
        particleList.first = newParticle;
        newParticle.prev = null;
    }

    // initialize
    newParticle.x = x0;
    newParticle.y = y0;
    newParticle.z = z0;
    newParticle.velX = vx0;
    newParticle.velY = vy0;
    newParticle.velZ = vz0;
    newParticle.age = 0;
    newParticle.dead = false;
    newParticle.right = Math.random() < 0.5;
    return newParticle;
}

function recycle(p: Particle) {
    // remove from particleList
    if (particleList.first === p) {
        if (p.next != null) {
            p.next.prev = null;
            particleList.first = p.next;
        } else {
            particleList.first = null;
        }
    } else {
        if (p.next == null) {
            p.prev!.next = null;
        } else {
            p.prev!.next = p.next;
            p.next.prev = p.prev;
        }
    }
    // add to recycle bin
    if (recycleBin.first == null) {
        recycleBin.first = p;
        p.prev = null;
        p.next = null;
    } else {
        p.next = recycleBin.first;
        recycleBin.first.prev = p;
        recycleBin.first = p;
        p.prev = null;
    }
}

export const particleActions = {
    onUserSpeaking,
    onProcessing,
    onAiSpeaking,
    reset,
    draw,
};
