class Tile {
    constructor(name, tiles, details) {
        this.name = name;
        this.tiles = tiles;
        
        if (details?.func) this.func = details.func;
        this.addableRooms = details?.addableRooms ?? 0;
        this.connectAdded = details?.connectAdded ?? true;
        this.connectsNearby = details?.connectsNearby ?? false;
    }
}

// ࿄༒   
const ROOMS_ADDABLE = {
    hall: new Tile("hall", ["▒.▒", "  ,", "▒ ▒"], {addableRooms:  1}),
    grassy: new Tile("grassy", ["⢆⡊⢍", "⡁⡐⡴", "⡊⢄⢝"], {addableRooms: 2}),
    fountain: new Tile("fountain", [" . ", "'𐜧 ", "  ,"], {addableRooms:  3, func: (currentRoom) => {currentRoom.effect = Rand.intRange(0, 4)}}),
    bloom: new Tile("bloom", ["❀ ", ",  ", " ❀"], {addableRooms:  2}),
    unkempt: new Tile("unkempt", ["▒X▒", "\\/.", "▒=▒"], {addableRooms:  1}),
    arch: new Tile("arch", ["█∩█", "∩ ∩", "█∩█"], {addableRooms:  1, connectsNearby: true}),
    urn: new Tile("urn", [", .", " ⬮ ", " \","], {addableRooms:  0.5}),
    tree: new Tile("tree", [",  ", ".𐤅.", "\"' "], {addableRooms:  2, func: (currentRoom) => {currentRoom.items.push("shears")}}),
    loop: new Tile("loop", ["., ", "  .", "= ."], {connectsNearby: true}),
    dead: new Tile("dead", ["▒░▒", "░ ░", "▒░▒"]),
    overgrown: new Tile("overgrown", ["▒▒▒", "▒░▒", "▒▒▒"], {addableRooms:  1, connectAdded: false}),
    well: new Tile("well", ["aaa", "aaa", "aaa"], {addableRooms: 1}),
    //dire: new Tile("dire", ["wow", "omg", "lol"], {connectsNearby: true, addableRooms: 1.25, func: (c) => {console.log("Wolf is here!")}})
}

const ROOMS_OTHER = {
    start: new Tile("start", ["###", "#▩#", "###"], {addableRooms:  3}),
    empty: new Tile("empty", ["▓▓▓", "▓▓▓", "▓▓▓"]),
    coin: new Tile("coin", ["▛ ▜", " ▃ ", "▙ ▟"], {func: (currentRoom) => {currentRoom.items.push("coin")}}),
}

const ITEMS = {
    flower: ["flower1", "flower2", "flower3", "flower4", "flower5"],
    shears: ["shears1", "shears2", "shears3", "shears4", "shears5"],
}

class Maze {
    constructor(width, height) {
        this.height = height;
        this.width = width;
        this.numRooms = this.height * this.width;
        this.sizeCap = 100;
        this.size = 0;
        this.rooms = [];
        this.border = "❁═❁║❁═❁║";

        this.posX;
        this.posY;
        this.currentRoom;
        this.lastRoom;
        //this.discoveredRooms = [];

        // for (let i = 0; i < this.height; i++){
        //     this.discoveredRooms.push([]);
        //     for (let j = 0; j < this.width; j++)
        //         this.discoveredRooms[i].push(new Room(j, i));
        // }

        this.reminders = {};
        this.self = {
            understanding: 0,
            items: ["flower", "shears"],
            wearingFlower: false,
        }

        for (let i = 0; i < this.height; i++) {
            this.rooms.push([]);
            for (let j = 0; j < this.width; j++)
                this.rooms[i].push(new Room(j, i));
        }
    }

    map(rooms = this.rooms) {
        let s = this.border[0];

        for (let i = 0; i < this.width; i++)
            s += this.border[1] + this.border[1] + this.border[1] + this.border[1];
        s += this.border[2] + "\n";

        for (let i = 0; i < this.height; i++) {
            for (let round = 0; round < 4; round++) {
                s += this.border[7];

                for (let j = 0; j < this.width; j++) {
                    let t = rooms[i][j].tile;
                    let c = rooms[i][j].connections;

                    if (!rooms[i][j].discovered) {
                        let visitedNeighbors = this.getNeighbors(j, i).filter(room => (room.discovered && room.connectsTo(j, i)));

                        if (visitedNeighbors.map(room => room.y).indexOf(i - 1) !== -1 && round === 0)
                            s += "▓▓ ▓";
                        else if (visitedNeighbors.map(room => room.x).indexOf(j - 1) !== -1 && round === 2)
                            s += " ▓▓▓";
                        else s += "▓▓▓▓";

                        continue;
                    }

                    if (round === 0) {
                        s += c.map(room => room.y).indexOf(i - 1) !== -1 ? "▒▒ ▒" : "▒▒▒▒";
                    } else {
                        if (round === 2)
                            s += (c.map(room => room.x).indexOf(j - 1) !== -1) ? " " : "▒";
                        else s += "▒";

                        s += t.tiles[round - 1];

                        if (this.currentRoom == rooms[i][j] && round == 2)
                            s = s.substring(0, s.length - (s[s.length-2].codePointAt(0) > 50000 ? 3 : 2)).replace("�", "")
                                + "<b>&</b>" + s.substring(s.length - 1);
                    }
                }
                s += "▓" + this.border[3] + "\n";
            }
        }

        s += this.border[3] + "▓";
        for (let i = 0; i < this.width; i++)
            s += "▓▓▓▓";
        s += this.border[7] + "\n";

        s += this.border[6];
        for (let i = 0; i < this.width; i++)
            s += this.border[5] + this.border[5] + this.border[5] + this.border[5];

        return s + this.border[4];
    }

    generate(x = Rand.intRange(0, this.width - 1), y = Rand.intRange(0, this.height - 1)) {
        this.rooms[y][x].tile = ROOMS_OTHER.start;
        this.posX = x;
        this.posY = y;
        this.currentRoom = this.rooms[y][x];
        this.currentRoom.discovered = true;
        this.currentRoom.timesVisited = 1;

        this.advance(x, y);

        set(this.map(), "map")
    }

    advance(x, y) {
        let currentRoom = this.rooms[y][x];
        let tile = currentRoom.tile;

        if (tile.addableRooms > 0) {
            if (tile.addableRooms < 1 && Rand.chance(tile.addableRooms))
                    this.addRoom(x, y, 1, tile.connectAdded);
            else this.addRoom(x, y, tile.addableRooms, tile.connectAdded)
        }

        if (tile.name === "overgrown") {
            this.addRoom(x, y, 1, false, ROOMS_OTHER.coin);
        }

        if (tile.connectsNearby) {
            let valid = this.getNeighbors(x, y).filter(room => room.tile.name !== "empty");
            for (let i = 0; i < valid.length; i++)
                if (valid[i].tile.name !== "overgrown" && valid[i].tile.name !== "coin")
                    this.connectRooms(currentRoom, valid[i]);
        }

        if (tile?.func)
            tile.func(currentRoom);

        currentRoom.new = false;

        this.getNeighbors(x, y).forEach(room => room.new ? this.advance(room.x, room.y) : "");

    }

    addRoom(x, y, numRooms = 1, connect = true, room = false) {
        let valid;
        let newRoom;

        for (let i = 0; i < numRooms; i++) {
            valid = this.getNeighbors(x, y).filter(room => room.tile.name === "empty");
            if (valid.length == 0) return;

            newRoom = Rand.choice(valid);
            newRoom.tile = room ? room : ROOMS_ADDABLE[Rand.choice(Object.keys(ROOMS_ADDABLE))];
            newRoom.new = true;
            if (connect)
                this.connectRooms(this.rooms[y][x], newRoom);
        }
    }

    connectRooms(roomA, roomB) {
        if (roomA.connections.map(room => room.x + "-" + room.y).indexOf(roomB.x + "-" + roomB.y) == -1)
            roomA.connections.push(roomB);
        if (roomB.connections.map(room => room.x + "-" + room.y).indexOf(roomA.x + "-" + roomA.y) == -1)
            roomB.connections.push(roomA);
    }

    getNeighbors(x, y) {
        let arr = [];

        if (this.inBounds(x + 1, y)) arr.push(this.rooms[y][x + 1]);
        if (this.inBounds(x - 1, y)) arr.push(this.rooms[y][x - 1]);
        if (this.inBounds(x, y + 1)) arr.push(this.rooms[y + 1][x]);
        if (this.inBounds(x, y - 1)) arr.push(this.rooms[y - 1][x]);

        return arr;
    }

    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    generateDirections(ret = false) {
        let r = [];

        for (let i = 0; i < this.currentRoom.connections.length; i++) {
            let cx = this.currentRoom.connections[i].x;
            let cy = this.currentRoom.connections[i].y;
            let isLast = this.lastRoom?.x === cx && this.lastRoom?.y === cy;
            let isVisited = this.currentRoom.connections[i].discovered;
            if (cx === this.posX) {
                if (cy === this.posY - 1)
                    r[1] = "You may " + (isLast ? "return " : (isVisited ? "go " : "advance ")) + this.clickable("↟north↟", "Labyrinth.move(\"north\")") + ".<br>";
                else r[2] = "You may " + (isLast ? "return " : (isVisited ? "go " : "advance ")) + this.clickable("↡south↡", "Labyrinth.move(\"south\")") + ".<br>";
            } else if (cy === this.posY) {
                if (cx === this.posX + 1)
                    r[3] = "You may " + (isLast ? "return " : (isVisited ? "go " : "advance ")) + this.clickable("↠east↠", "Labyrinth.move(\"east\")") + ".<br>";
                else r[4] = "You may " + (isLast ? "return " : (isVisited ? "go " : "advance ")) + this.clickable("↞west↞", "Labyrinth.move(\"west\")") + ".<br>";
            }
        }

        r = r.filter(Boolean)

        return (ret ? "You may " + this.clickable("stay here", "Labyrinth.updateLog({stay: true})") + ".<br>" : "") + r.join("");
    }

    move(d) {
        if (d == "north" && this.inBounds(this.posX, this.posY - 1)) this.posY--;
        else if (d == "south" && this.inBounds(this.posX, this.posY + 1)) this.posY++;
        else if (d == "east" && this.inBounds(this.posX + 1, this.posY)) this.posX++;
        else if (d == "west" && this.inBounds(this.posX - 1, this.posY)) this.posX--;

        this.lastRoom = this.currentRoom;
        this.currentRoom = this.rooms[this.posY][this.posX]
        this.currentRoom.discovered = true;
        this.currentRoom.timesVisited++;

        set(this.map(), "map");
        this.updateLog();
    }

    clickable(text, onclick = false) {
        return "<span class='clickable' onclick='get(\"display\").classList.add(\"fade\");" + 
                                                (onclick ? onclick : 'Labyrinth.read(\"' + text + '\")') + "'>" + text + "</span>";
    }

    read(text) {
        let log = "";
        if (text === "home") {
            log += "You can't remember what that would be other than where you are. " +
                "If home is the place of one's birth, this is home. If home is where one lives and dies, this is home. " +
                "If home is where one's heart lies...";
            this.self.understanding++;
        } else if (text === "sleeping") {
            this.reminders.sleeping = true;
            log += "Being awake is like being asleep. You don't need to sleep, you are asleep, you are awake. It is <i>non-two</i>. " +
                "Seeing with the eyes is like seeing with a dream. Neurons flash like rain making such eloquent reveries."
            this.self.understanding++;
        } else if (text === "depths") {
            this.reminders.depths = true;
            log += "You know, but cannot admit, this is where you are. The depths. Something about the fresh air and the sun and moon circling above feels " +
                "so impossibly deep, sundered, sunken. You can breathe, you can't breathe. It is <i>non-two</i>."
            this.self.understanding++;
        } else if (text === "silence") {
            this.reminders.silence = true;
            log += "You pause for a second, letting still air caress your ear. No vibrations echo through you. It really is silent. " +
                "The air itself feels like it could extinguish any word you'd say.";
            this.self.understanding++;
        } else if (text === "hesitence") {
            this.reminders.hesitence = true;
            log += "You hesitate. There's something pure about such an action, something untainted. There's a oneness, a zenness, a suchness. " +
                "You hesitate. In hesitence, there is the bare admission of hesitence, of letting the mind calculate and of being able to do nothing but. " +
                "You hesitate. You are reminded of " + this.clickable("something else") + ".";
            this.self.understanding++;
        } else if (text === "hallways") {
            this.reminders.hallways = true;
            log += "You remember another place, cold, sterile. You're unsure if this place is real or a fragment of a misfired neuron. Long, white halls stretch to the end of your vision. " +
                "The tiles on the floor bear intricate engravings and tesselations. You look deep into their opaque, reflective depths then shiver, shake your head, and return to the labyrinth.";
            this.self.understanding++;
        } else if (text === "keeping secrets") {
            this.reminders.secrets = true;
            log += "It seems like such a peculiar concept. Why would one conceal the truth? Why would one hide their actions? " +
                "And from who? You think.<br><br>There's only one person you can seem to recall and even they are fleeting. Still, you're inexplicably certain you would never hide anything from "
                + this.clickable("them") + ". There would be no reason to.";
            this.self.understanding++;
        } else if (text === "sand") {
            this.reminders.sand = true;
            log += "How does something become sand? You ponder the gravel beneath your feet. Once, it may have been hulking, glacial boulders. Wind, <i>real</i> wind, could whittle it down. " +
                "The rain, the changing of temperatures. The sea. Being embraced by and beaten by the elements in turn. Enduring. And for what loss? To soften? To spread across the world, to become a deeper part of the one that is everything? " +
                "There is no loss in being worn down by time here.";
            this.self.understanding++;
        } else if (text === "flour") {
            this.reminders.flour = true;
            log += "You narrow your memory, sifting particles of flour through the winnowing sieves of your mind. Bread. Warmth. Companionship. You are reminded of a certain richness " +
            "before another cool and silent breeze shakes you from the reverie.";
            this.self.understanding++;
        } else if (text === "breathing") {
            this.reminders.breathing = true;
            log += "You remember to breathe. Your shoulders slack and your stomach loosens. You relax. You breathe in. You breathe out. You realize nothing is happening." +
                "No air flows in, no air flows out. Goosebumps manifest across your flesh. You tighten. In this system of the observer and the environment, which is not real?";
            this.self.understanding++;
        } else if (text === "love") {
            this.reminders.love = true;
            log += "You can be reminded of love because you knew love. When? Across all of space, somewhere, everywhere, through the borders of the universe and the constraints of light, you had felt love. " +
                "Who? All souls, together, as one. All souls, <i>not one, not-two</i>. A soul, someone, sigular. Different from you, not different from you. Love. " +
                "<br><br>You can't really remember.";
            this.self.understanding++;
        } else if (text === "hands") {
            this.reminders.hands = true;
            log += "You look down at your hands, then lift them directly before your eyes. You clench your fists, then splay your fingers as wide as they will go. " +
                "You fold each finger individually, watching how the shadows they cast dance and change. You look closer at the dark lines, crevasses, etches in your skin. " +
                "You realize such small, beautiful details are rare here in this labyrinth. How wonderful it is to occupy a body.";
            this.self.understanding++;
        } else if (text === "something else") {
            log += "You remember you are alive in the world. You remember that life is allowed to have meaning. You are reminded of meaning and of laughing and of having nothing to do. You almost remember somebody.";
            this.self.understanding++;
        } else if (text === "them") {
            log += "You don't know how you know, you don't know who they are, but they would never hurt you. They would let you be anything.";
            this.self.understanding++;
        } else if (text === "Pick a flower?") {
            log += "You pick a flower! The stem connecting it to the hedge gently breaks. " + (this.self.wearingFlower ? "" : this.clickable("Put the flower in your hair?"));
            this.self.items.push("flower");
        } else if (text === "Put the flower in your hair?") {
            log += "You put the white flower gently into your hair. It stays and you smile.";
            this.self.items.splice(this.self.items.indexOf("flower"), 1);
            this.self.wearingFlower = true;
            this.self.understanding++;
        } else if (text === "Take it off?") {
            log += "You slide the white flower from your hair. The rough stem slightly tugs as you pull it out into your hand.";
            this.self.items.push("flower");
            this.self.wearingFlower = false;
        } else if (text === "Put a flower atop the urn?") {
            log += "You reach up and gently bestow the white flower on the urn's cover. It sits there and you observe how the white petals contrast the dark metal. " + 
            "You feel a whisper that isn't there echoing " + Rand.choice(["forgiveness", "relief", "kindness", "nothingness", "a sigh", "melancholy", "a sense of moving on"]) + ".";
            this.self.items.splice(this.self.items.indexOf("flower"), 1);
            this.currentRoom.items.push("flower");
            this.self.understanding++;
        } else if (text === "shears") {
            log += "A pair of shears is leaned into the edges near the corner of this room. It appears to have been placed their moments ago," + 
                    "as if a passing gardener set them down after using them to sculpt the tree. The blades are sharp and new.<br>" + this.clickable("Pick up the shears?");
        } else if (text === "cut to the north") {
            log += "You use the shears, ripping through the hedges. Leaves rip asunder and bits of wood mix with the plain gravel.";
            this.connectRooms(this.currentRoom, this.rooms[this.currentRoom.y - 1][this.currentRoom.x])
        } else if (text === "cut to the south") {
            log += "You use the shears, ripping through the hedges. Leaves rip asunder and bits of wood mix with the plain gravel.";
            this.connectRooms(this.currentRoom, this.rooms[this.currentRoom.y + 1][this.currentRoom.x])
        } else if (text === "cut to the east") {
            log += "You use the shears, ripping through the hedges. Leaves rip asunder and bits of wood mix with the plain gravel.";
            this.connectRooms(this.currentRoom, this.rooms[this.currentRoom.y][this.currentRoom.x + 1])
        } else if (text === "cut to the west") {
            log += "You use the shears, ripping through the hedges. Leaves rip asunder and bits of wood mix with the plain gravel.";
            this.connectRooms(this.currentRoom, this.rooms[this.currentRoom.y][this.currentRoom.x - 1])
        } else if (text === "Pick up the shears?") {
            if (this.self.items.includes("shears")) {
                log += "You already have shears, feeling the weight of them carried at your side. You leave the shears.";
            } else {
                log += "You pick up the shears, hoisting their comfortable weight and feeling the heavy, wooden handle in your palm.";
                this.self.items.push("shears");
            }
            this.currentRoom.items.splice(this.currentRoom.items.indexOf("shears"), 1);
        } else if (text === "silly") {
            this.reminders.silly = true;
            log += "A smile dashes across your face. You feel light and floaty. When you look at things from far away, what matters? What gets distilled? " + 
            "There is very little which truly matters in life and yet everything matters. The world is good, you are free, and there is nothing you cannot be.";
            this.self.understanding++;
        } else if (text === "impermanence") {
            this.reminders.impermanence = true;
            log += "How can something go into nothing? Likewise, how can something arise from nothing? Truly, in interconnectedness, there are no things which can disappear, but therefore there are no things which can be created. Something and nothing are <i>not-two</i>. The world appears to be here, created from nothing, when it is simply nothingness/somethingness returned onto itself. All other appearances are likewise empty.";
            this.self.understanding++;
        } else if (text === "map") {
            set(this.map(), "map");
            log += this.updateLog({stay: true})
        } else if (text === "Sip") {
            log += Rand.choice([
                "You drink from the fountain, wetting your dry lips.",
                "You bend your face toward the mirror of the fountain's surface and drink.",
                "You sip the water. It is cool and smooth.",
                "The water tastes strange.",
                "You drink from the fountain, carefully scooping water with your hands to your mouth.",
            ]);
            console.log(this.currentRoom.effect)
            log += " " + [
                "The chilly water makes you feel refreshed.",
                "The chilly water makes you feel refreshed.",
                "You feel sick and throw up next to the fountain.",
                "You feel ecstatic. The world spins in a million beautiful colors.",
                "You collapse to the ground, eyes skyward. The sky becomes a blur of days and nights. It feels as if a thousands years pass by before you come to.",
            ][this.currentRoom.effect];

            if (this.currentRoom.effect === 4) {
                currentEffect = new BackgroundEffect((x) => Color.chainColorLerp([
                    [backgroundColor.getHex(), 50],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 10], ["#ffffff", 10],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 10], ["#cccccc", 10],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 10], ["#ffffff", 10],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 10], ["#cccccc", 10],
                    ["#eeeeee", 10], ["#dddddd", 10],
                    ["#eeeeee", 20], ["#dddddd", 20],
                    ["#eeeeee", 30], ["#dddddd", 30],
                    ["#eeeeee", 40], ["#dddddd", 40],
                    ["#eeeeee", 200],
                ], x), 300)
                t = 0.7;
            }
            
        }

        set(log + "<br><br>" + Labyrinth.generateDirections(true));
    }

    updateLog(details = {}) {
        let log = "";

        if (details.first ?? false) {
            set("You enter the labyrinth. The sun is rising slowly, filling the air with a misty glow. " +
                "The gravel pathways meander before you. Dark green hedges rise up around you, sturdy and immense. " +
                "They do not remind you of " + this.clickable("home") + ".<br><br>" + this.generateDirections());
            return;
        }

        if (!details.stay ?? true) {
            if (this.currentRoom.timesVisited === 1) {
                log += Rand.choice([
                    "This place is new.",
                    "You delve deeper into the labyrinth.",
                    "You find yourself in an unfamiliar area.",
                    "You push farther into the labyrinth.",
                ]);
            } else if (this.currentRoom.timesVisited >= 2 && this.currentRoom.timesVisited <= 4) {
                log += Rand.choice([
                    "You've been here before.",
                    "This place is familiar.",
                    "You double-back.",
                ]);
            } else if (this.currentRoom.timesVisited > 4 && this.currentRoom.timesVisited <= 7) {
                log += Rand.choice([
                    "You've been here many times.",
                    "This part of the labyrinth is very familiar.",
                    "You reenter this place yet again.",
                ]);
            } else if (this.currentRoom.timesVisited > 7) {
                log += Rand.choice([
                    "This part of the labyrinth is very familiar.",
                    "You've been here many times.",
                    "You seem to be travelling in circles.",
                    "The hedges all begin to look the same.",
                ]);
            }
        } else {
            log += Rand.choice([
                "You linger in this place.",
                "You find yourself seated on the loose, plain gravel on the ground.",
                "You rest here.", 
                "You remain in this place a bit longer.",
            ]);
        }

        if (Rand.random() > 0.5) {
            log += " ";

            if (t > 0.85 && t <= 0.97) {
                log += Rand.choice([
                    "The night begins to fade.",
                    "Light begins to reenter the world.",
                    "The sun is rising in the east.",
                    "Things begin to come back into view.",
                    "The hedges are dewy.",
                    "A light mist kisses your skin.",
                ]);
            } else if (t > 0.97 || t < 0.06) {
                log += Rand.choice([
                    "Dawn is slowly creeping into day.",
                    "The sun is rising in the east.",
                    "A morning mist is melting under the sun.",
                    "The hedges are dewy.",
                    "Clouds crawl across the sky.",
                ]);
            } else if (t > 0.06 && t <= 0.2) {
                log += Rand.choice([
                    "The sky is bright and full.",
                    "The sun is high in the sky. You can see it above you.",
                    "The day is ripe.",
                    "The air is warm.",
                    "Small clouds spot the blue sky.",
                ]);
            } else if (t > 0.2 && t <= 0.3) {
                log += Rand.choice([
                    "The afternoon grows long.",
                    "The air is temperate.",
                    "A breeze rustles across the tops of the hedges.",
                ]);
            } else if (t > 0.4 && t <= 0.49) {
                log += Rand.choice([
                    "The day stretches and lets its shadows grow long.",
                    "The afternoon yawns into evening.",
                    "Lightning bugs flicker around you.",
                    "The air grows cooler.",
                ]);
            } else if (t > 0.49 && t <= 0.55) {
                log += Rand.choice([
                    "A brilliant sunset bleeds its colors into the sky above you.",
                    "The sunset echoes above the hedges.",
                    "The sun slides beneath the horizon.",
                    "The air grows cooler.",
                    "The wind shudders along the tops of the hedges.",
                ]);
            } else if (t > 0.52 && t <= 0.85) {
                log += Rand.choice([
                    "Darkness envelops you.",
                    "The witching hour holds you tightly.",
                    "The night sky is dotted with stars.",
                    "The moon is too low in the sky to see beyond the hedges.",
                    "A cool wind blows.",
                    "Something trills into the night air.",
                    "The air is cold.",
                    "A shooting star passes above you, swift, silent.",
                ]);
            }
        }

        log += "<br>";

        switch (this.currentRoom.tile.name) {
            case "start": log += Rand.choice([
                    "The ground here is rough. Small, broken tiles cover it.",
                    "The ground here is rough. This is where you began.",
                    "The ground here is rough. The hedges are tall and deep green.",
                    "The ground here is rough. Interspersed in the gravel underfoot are small tile fragments.",
                ]);
                break;
            case "hall": log += Rand.choice([
                    "Hedges line your way. The ground underfoot is loose gravel. Small pieces within it seem to glitter.",
                    "Hedges line your way. They tower above you towards the sky.",
                    "Hedges line your way. Their deep green leaves remind you of " + (this.reminders.sleeping ? "sleeping" : this.clickable("sleeping")) + ".",
                    "Hedges line your way. Their deep green leaves remind you of " + (this.reminders.depths ? "depths" : this.clickable("depths")) + ".",
                    "Hedges line your way. Their deep green leaves remind you of " + (this.reminders.silence ? "silence" : this.clickable("silence")) + ".",
                    "Hedges line your way. The air smells fresh and woody.",
                ]);
                break;
            case "grassy": log += Rand.choice([
                    "Hedges tousle grassy ground. The gravel gives way to short, green grass.",
                    "Hedges tousle grassy ground. Instead of gravel, soft grass caresses your bare feet.",
                    "Hedges tousle grassy ground. Looking closely into the feathery fronds, you see no insects.",
                    "Hedges tousle grassy ground. It would be comfortable to lie down here.",
                    "Hedges tousle grassy ground. You wonder what allows such friendly flora to inhabit this place.",
                    "Hedges tousle grassy ground. The hedges seem relaxed and lenient.",
                ]);
                break;
            case "loop": log += Rand.choice([
                    "Hedges grow around you. Small, white flowers eke around their base.",
                    "Hedges grow around you. The gravel below you is a greyish-white.",
                    "Hedges grow around you. Their deep green leaves remind you of " + (this.reminders.secrets ? "keeping secrets" : this.clickable("keeping secrets")) + ".",
                    "Hedges grow around you. They loom above you, unspeaking, unmoving.",
                ]);
                break;
            case "fountain": log += Rand.choice([
                    "A fountain quietly bubbles here. The water is cold and slightly brackish.",
                    "A fountain quietly bubbles here. Moss clings to its stony rim.",
                    "A fountain quietly bubbles here. Lichen speckles across it.",
                    "A fountain quietly bubbles here. A few small patches of algae cover the surface of the water.",
                    "A fountain quietly bubbles here. The stone which composes it is worn.",
                    "A fountain quietly bubbles here. Small, dulled reliefs decorate its edges.",
                    "A fountain quietly bubbles here. Its bowl is not deep. A few small stones rest at its bottom.",
                ]);
                log += "<br>" + this.clickable("Sip") + Rand.choice([
                    " from the fountain?",
                    " deeply from the fountain?",
                    " and sate yourself upon the fountain?",
                    " the waters of the fountain?",
                ]);
                break;
            case "bloom": log += Rand.choice([
                    "Blooming hedges surround you. Their white flowers face you.",
                    "Blooming hedges surround you. The flowers fill the air with a strong, sweet scent.",
                    "Blooming hedges surround you. Their white flowers remind you of " + (this.reminders.hesitence ? "hesitence" : this.clickable("hesitence")) + ".",
                    "Blooming hedges surround you. White flowers with yellow centers emerge from dark green leaves.",
                ]);
                if (!this.self.items.includes("flower"))
                    log += "<br>" + this.clickable("Pick a flower?") + " ";
                break;
            case "tree": log += Rand.choice([
                    "A single, thin tree sprouts from the gravel. Its grey branches hold tiny, green leaves.",
                    "A single, thin tree sprouts from the gravel. There is elegance in its slenderness.",
                    "A single, thin tree sprouts from the gravel. It reminds you of long, marble " + (this.reminders.hallways ? "hallways" : this.clickable("hallways")) + ".",
                    "A single, thin tree sprouts from the gravel. Its leaves, small as they are, flutter.",
                    "A single, thin tree sprouts from the gravel. It grows proudly in the middle of the path.",
                    "A single, thin tree sprouts from the gravel. It is still shorter than the hedges.",
                ]);
                if (!this.currentRoom.items.includes("shears") && !details.stay) log += Rand.choice([
                    " There are no shears here any longer.",
                    " The shears are gone.",
                    " The shears are no longer here. Their absence reminds you of " + (this.reminders.impermanence ? "how things are" : this.clickable("impermanence")) + ".",
                ]);
                break;
            case "unkempt": log += Rand.choice([
                    "Crooked, bare branches poke between dark green leaves. The hedges here are unkempt.",
                    "Crooked, bare branches poke between dark green leaves. The gravel is thin and uneven.",
                    "Crooked, bare branches poke between dark green leaves. Prickly shrubs cling around the base of the hedges.",
                    "Crooked, bare branches poke between dark green leaves. The hedges here are stuggling and dark green leaves scatter upon the ground.",
                    "Crooked, bare branches poke between dark green leaves. Even in this decrepitude, the hedges seem intent on containing you.",
                    "Crooked, bare branches poke between dark green leaves. They remind you of " + (this.reminders.hands ? "your hands" : this.clickable("hands")) + " and the various structures within them.",
                ]);
                break;
            case "arch": log += Rand.choice([
                    "Brick archways form a small arbor amidst the hedges. They are cracked and crumbling, but hold the hedges at bay from this small place.",
                    "Brick archways form a small arbor amidst the hedges. This small structure appears as a boat amidst the ocean of hedges.",
                    "Brick archways form a small arbor amidst the hedges. There are no hedges in this little respite.",
                    "Brick archways form a small arbor amidst the hedges. You can't help but wonder why this is here.",
                    "Brick archways form a small arbor amidst the hedges. They remind you of " + (this.reminders.sand ? "time" : this.clickable("sand")) + " and " + (this.reminders.flour ? "flour" : this.clickable("flour")) + ".",
                ]);
                break;
            case "urn":
                if (this.currentRoom.items.includes("flower")) log += Rand.choice([
                        "A white flower sits atop an urn. The urn is made of iron and appears heavy.",
                        "A white flower sits atop an urn. Its petals are light and pure.",
                        "A white flower sits atop an urn. Wrought iron rings give the urn two handles.",
                        "A white flower sits atop an urn. It reminds you of " + (this.reminders.silly ? "how silly things can be" : this.clickable("silly")) + ".",
                        "A white flower sits atop an urn. The urn shimmers in any light that catches it.",
                    ]);
                else log += Rand.choice([
                        "An urn sits on a small pedestal. It is made of iron and appears very heavy.",
                        "An urn sits on a small pedestal. The hedges here around it are thick.",
                        "An urn sits on a small pedestal. Wrought iron rings give it two handles.",
                        "An urn sits on a small pedestal. It reminds you of " + (this.reminders.love ? "losing something you love" : this.clickable("love")) + ".",
                        "An urn sits on a small pedestal. It reflects little light.",
                    ]);

                if (this.self.items.includes("flower") && !this.currentRoom.items.includes("flower"))
                    log += "<br>" + this.clickable("Put a flower atop the urn?") + " ";
                break;
            case "dead": log += Rand.choice([
                    "Hedges encircle you. Small, prickly shrubs cling around their base.",
                    "Hedges encircle you. Their deep green leaves remind you of " + (this.reminders.breathing ? "not breathing" : this.clickable("breathing")) + ".",
                    "Hedges encircle you. The gravel is coarse and scattered.",
                    "Hedges encircle you. These thick forms seem intent on blotting out the sky.",
                    "Hedges encircle you. They seem to make the air darker.",
                ]);
                break;
            case "overgrown": log += Rand.choice([
                    "You push your way through dense hedges. Their thick branches and heavy leaves threaten to ensnare you.",
                    "You push your way through dense hedges. The hedges wrestle one another, vying for the most exposure to the sun. Branches parry leaves, roots choke roots.",
                    "You push your way through dense hedges. Leafy, jade-green walls form a sun-covering obstacle.",
                ]);
                if (this.currentRoom.connections.length <= 1)
                    log += " You can just barely make out the labyrinth continuing through the tangle of plant material, but can't make it through with strength of your hands and feet alone.";
                else log += " Severed leaves and split branches carve a shoddy path beyond the crowded thicket, leading further into the labyrinth.";

                if (this.self.items.includes("shears")) {
                    let possible = [[this.posX, this.posY - 1, "N"],
                                    [this.posX, this.posY + 1, "S"],
                                    [this.posX + 1, this.posY, "E"],
                                    [this.posX - 1, this.posY, "W"]];
                    
                    for (let i = 0; i < this.currentRoom.connections.length; i++) {
                        let cx = this.currentRoom.connections[i].x;
                        let cy = this.currentRoom.connections[i].y;

                        for (let j = 0; j < possible.length; j++)
                            if (possible[j][0] === cx && possible[j][1] === cy || !this.inBounds(possible[j][0], possible[j][1]))
                                possible.splice(j, 1);
                    }

                    let r = [];
                    for (let i = 0; i < possible.length; i++) {
                        if (possible[i][2] === "N")
                            r[0] = "You may use your shears to " + this.clickable("cut to the north") + ".";
                        else if (possible[i][2] === "S")
                            r[1] = "You may use your shears to " + this.clickable("cut to the south") + ".";
                        else if (possible[i][2] === "E")
                            r[2] = "You may use your shears to " + this.clickable("cut to the east") + ".";
                        else if (possible[i][2] === "W")
                            r[3] = "You may use your shears to " + this.clickable("cut to the west") + ".";
                    }

                    r = r.filter(Boolean)

                    log += "<br>" + r.join("<br>");
                }
                break;
        }
        
        if (this.currentRoom.items.includes("shears")) {
            log += " You notice a pair of " + this.clickable("shears") + ".";
        }

        log += "<br><br>";

        switch (this.currentRoom.connections.length) {
            case 1: log += Rand.choice([
                "You can only go back the way you came.",
                "It seems you've reached a dead end.",
                "There's nowhere else to go but back.",
                "There is nothing beyond here.",
                "This place marks the end of this path."
            ]);
                break;
            case 2: log += Rand.choice([
                "The path continues before you.",
                "You may go back the way you came, or continue forwards.",
                "A single route lies ahead.",
                "The hedges mark a continuing route.",
                "The leafy corridor continues."
            ]);
                break;
            case 3: log += Rand.choice([
                "The road forks here.",
                "You are presented with various options.",
                "There are many paths available to you.",
                "The path branches.",
                "You've come to a crossroads.",
            ]);
                break;
            case 4: log += Rand.choice([
                "Roads cross in all directions here.",
                "This room is connected to all of its neighbors.",
                "You may reach many places from here.",
                "Here, many paths converge.",
                "You've come to a crossroads."
            ]);
                break;
        }
        log += "<br>" + this.generateDirections(true);

        if (this.self.items.length !== 0)
            this.self.hadSomething = true;
        if (true)
            log += "<br>Observe your " + this.clickable("belongings", "Labyrinth.seeItems()") + "?";

        set(log);
        return log;
    }

    seeItems() {
        let log = "";

        if (this.self.items.length === 0)
            log += "You are carrying nothing with you.<br>"

        for (let i = 0; i < this.self.items.length; i++) {
            if (this.self.items[i] === "flower") {
                log += "In your hand is a white flower, plucked from the hedges. " + (this.self.wearingFlower ? "" : this.clickable("Put the flower in your hair?")) + "<br>";
                if (this.self.wearingFlower)
                    log += "You also have a very similar white flower tucked gently behind your ear.<br>";
            }
            else if (this.self.items[i] === "shears")
                log += "You're carrying a pair of gardening shears, solid and cool.<br>";
        }

        if (!this.self.items.includes("flower") && this.self.wearingFlower)
            log += "You have a white flower tucked gently behind your ear. " + this.clickable("Take it off?") + "<br>";

        log += "<br>Return to " + this.clickable("map") + "?";
        
        set(log)

        let invWidth = 28;
        let invHeight = 19;
        let horizontalSpacing = (invWidth - 1) / 3;
        let verticalSpacing = (invHeight - 1) / 3;

        let s = "";
        let slot = 0;
        let itemInSlot = false;
        for (let j = 0; j < invHeight; j++) {
            for (let i = 0; i < invWidth; i++) {
                slot = 3 * Math.floor(j / verticalSpacing) + Math.floor(i / horizontalSpacing);
                itemInSlot = this.self.items[slot];

                if (i%horizontalSpacing===0 && j%verticalSpacing===0) s += this.border[0];
                else if (i%horizontalSpacing===0) s += this.border[3] + (i === invWidth - 1 ? "" : (itemInSlot ? " " : "▓"));
                else if (j%verticalSpacing===0) s += this.border[1];
                else if (itemInSlot) {
                    s += ITEMS[itemInSlot][j%verticalSpacing-1] + " ";
                    i += horizontalSpacing-2;
                } else s += "▓";
            }
            s += "<br>";
        }

        set(s, "map");
    }
}

class Room {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.tile = ROOMS_OTHER.empty;
        this.new = false;
        this.connections = [];
        this.discovered = false;
        this.timesVisited = 0;
        this.items = [];
        this.effect = -1;
    }

    connectsTo(x, y, relative = false) {
        //console.log(this.connections.map(room => room.x + "-" + room.y).indexOf((relative ? x + this.x : x) + "-" + (relative ? y + this.y : y)) !== -1);
        return this.connections.map(room => room.x + "-" + room.y).indexOf((relative ? x + this.x : x) + "-" + (relative ? y + this.y : y)) !== -1;
    }
}

class BackgroundEffect {
    constructor(lerp, length) {
        this.lerp = lerp;
        this.length = length;
        this.progress = 0;
        this.complete = false;
    }

    update(t) {
        this.progress+= 1;
        if (this.progress >= this.length - 1) this.complete = true;
        return (this.progress <= this.length) ? this.lerp(this.progress / this.length) : false;
    }
}