function get(id) {
    return document.getElementById(id) ?? document.getElementsByClassName(id);
}

function set(text, id = "display") {
    get(id).innerHTML = text;
}

const pressedKeys = new Set();
document.addEventListener("keydown", (e) => pressedKeys.add(e.key));
document.addEventListener("keyup", (e) => pressedKeys.delete(e.key));

const keyPressed = key => pressedKeys.has(key);
const handleInput = (input, offset) => input == 1 || input % offset == 1;
const Controls = {
    moveNorth: { input: ["w", "ArrowUp"], active: 0 },
    moveSouth: { input: ["s", "ArrowDown"], active: 0 },
    moveWest: { input: ["a", "ArrowLeft"], active: 0 },
    moveEast: { input: ["d", "ArrowRight"], active: 0 },
    interact: { input: ["e"], active: 0 },
    screenshot: { input: ["c"], active: 0 },
}

const WIDTH = window.screen.width;
const HEIGHT = window.screen.height;
let day = 0;
let universeType = Rand.choice["knots", "particles", "wave-particles", "waves", "fibers", "tempers", "strings", "pixels", "fragmented thoughts", "perceptions"];
let currentEffect = false;
let backgroundColor = new Color("#ffffff")
let t = 0;
let gameOpened = false;
let Labyrinth = new Maze(14, 8);
Labyrinth.generate(0, 3);

let white = get("white");
white.addEventListener("animationend", () => {
    play();
});

get("title").addEventListener("animationend", () => {
    get("start").style.display = "block";
    get("start").classList.add("initButtonAnimate");
    get("title").classList.remove("titleAnimate");
})

get("start").addEventListener("animationend", () => {
    get("cred").style.display = "block";
    get("cred").classList.add("initButtonAnimate");
    get("start").classList.remove("initButtonAnimate");
})

get("cred").addEventListener("animationend", () => {
    get("cred").classList.remove("initButtonAnimate");
})

play();

function play() {
    let disp = get("display");
    disp.addEventListener("animationstart", () => {
        disp.style.pointerEvents = "none";
    });
    disp.addEventListener("animationend", () => {
        disp.style.pointerEvents = "auto";
        disp.classList.remove("fade");
    });

    white.style.display = "none";
    get("start-menu").style.display = "none";
    //get("container").style.display = "flex";        
    let cvs = get("canvas");
    cvs.width = WIDTH;
    cvs.height = HEIGHT;
    let c = cvs.getContext("2d");
    c.fillStyle = "green";


    Labyrinth.updateLog({ first: true });

    let permutation = makePermutation();
    let permutation2 = makePermutation();

    setInterval(() => {
        c.clearRect(0, 0, WIDTH, HEIGHT);


        for (const entry in Controls) {
            let active = false;
            for (let i = 0; i < Controls[entry].input.length; i++)
                active = keyPressed(Controls[entry].input[i]) ? true : active;
            if (active) Controls[entry].active++;
            else Controls[entry].active = 0;
        }

        if (handleInput(Controls.moveNorth.active, 50) && Labyrinth.currentRoom.connectsTo(0, -1, true)) {
            Labyrinth.move("north");
        }

        if (handleInput(Controls.moveSouth.active, 50) && Labyrinth.currentRoom.connectsTo(0, 1, true)) {
            Labyrinth.move("south");
        }

        if (handleInput(Controls.moveEast.active, 50) && Labyrinth.currentRoom.connectsTo(1, 0, true)) {
            Labyrinth.move("east");
        }

        if (handleInput(Controls.moveWest.active, 50) && Labyrinth.currentRoom.connectsTo(-1, 0, true)) {
            Labyrinth.move("west");
        }

        let res = 8;
        let p = 0;
        let p2;

        for (let i = 0; i < WIDTH; i+=res) {
            for (let j = 0; j < HEIGHT; j+=res) {
                p = 0;

                let freq = 0.002;
                // let amplitude = 1;
                // let frequency = 0.003;
                // let persistence = 0.5;
                // let lacunarity = 2;
                // for (let w = 0; w < 3; w++) {
                //     p += amplitude*Rand.perlin3D(i*frequency, j*frequency, (t+day)*10000*frequency, permutation);
                //     amplitude *= persistence;
                //     frequency *= lacunarity;
                // }

                p = Rand.octave([i*freq, j*freq, (t+day)*10], [permutation], Rand.perlin3D, 4);

                p = clamp((p + 1) / 2, 0, 1);

                if (p > 0.995) {
                    c.fillStyle = "white"
                    c.globalAlpha = p;
                    c.fillRect(i, j, res, res);
                } else if (p > 0.8) {
                    c.fillStyle = "#737272ff"
                    c.globalAlpha = (1-p)+0.7;
                    c.fillRect(i, j, res, res);
                } else if (p > 0.65) {
                    c.fillStyle = "green"
                    c.globalAlpha = p;
                    c.fillRect(i, j, res, res);
                } else if (p > 0.6) {
                    c.globalAlpha = 1;
                    c.fillStyle = "#ffe8b3ff";
                    c.fillRect(i, j, res, res);
                } else if (p > 0.58) {
                    c.fillStyle = "white"
                    c.fillRect(i, j, res, res);
                } else {
                // if (p > 0.45 && p < 0.55) {
                //     c.fillStyle = "white"
                //     c.globalAlpha = 1-p;
                //     c.fillRect(i, j, res, res);
                // } else {
                    if (p > 0.47 && p < 0.5)
                        c.fillStyle = "white"
                    else c.fillStyle = "teal"
                    c.globalAlpha = (p * 0.4) + 0.5;
                    c.fillRect(i, j, res, res);
                }

                // c.fillStyle = "white";
                // c.globalAlpha = Math.max(p2-0.2, 0);
                // c.fillRect(i, j, res, res)
                
            }
        }

        // if (handleInput(Controls.interact.active, 500)) {
        //     currentEffect = new BackgroundEffect((x) => Color.chainColorLerp(
        //         [["#ffffff", 100],
        //         ["#000000", 100]], x), 200);
        // }

        if (t > 1) {
            t = 0;
            day++;
        }
        backgroundColor = Color.chainColorLerp([
            ["#b4c8ce", 700],
            ["#dbedf3", 10000],
            ["#afe6f6", 12000],
            ["#a4d0f0", 10000],
            ["#5d629c", 1000],
            //["#a0c7e3", 200],
            ["#eea44c", 500],
            ["#fc7b1e", 500],
            ["#cf2f72", 500],
            ["#b0091c", 2000],
            ["#2d0a4f", 6000],
            ["#060426", 15000],
            ["#040215", 10000],
        ], t);                

        if (currentEffect && !currentEffect.complete) {
            backgroundColor = currentEffect.update(t);
        }
        // console.log(backgroundColor)

        // console.log(t)

        // get("background").style.background = backgroundColor.getHex();
        get("container").style.color = backgroundColor.inverse().asGreyscale().shaded(-70).getHex();
        get("background").style.border = "0.7vw solid " + backgroundColor.shaded(-50).getHex();
        let clickables = get("clickable");
        let clickMatches = document.querySelectorAll(".clickable");
        for (let i = 0; i < clickables.length; i++) {
            if (!clickMatches[i].matches(':hover')) clickables[i].style.backgroundColor = backgroundColor.shaded(25).getHex();
            else if (!clickMatches[i].matches(':active')) clickables[i].style.backgroundColor = backgroundColor.shaded(80).shiftedB(-30).getHex();
            else clickables[i].style.backgroundColor = backgroundColor.shaded(-50).shaded(30).getHex();
        }

        // ["#ff5555", 500], rainbow
        // ["#ffaa00", 500],
        // ["#ffff00", 500],
        // ["#00ff00", 500],
        // ["#5555ff", 500],
        // ["#ff00ff", 500]

        t += 0.0002;
    }, 16);
}