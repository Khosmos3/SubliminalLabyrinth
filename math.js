class Rand {
    static random() {
        return Math.random();
    }

    static chance(c) {
        return c > this.random();
    }

    static intRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static range(min, max) {
        return Math.random() * (max - min) + min;
    }

    static choice(arr) {
        return arr[this.intRange(0, arr.length - 1)];
    }

    // static bool(chance = .5) {
    //     return this.random() < chance;
    // }

    static vector() {
        return new Vector(Rand.range(-1, 1), Rand.range(-1, 1))
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(v) {
        const EPS = 1e-6;
        return Math.abs(this.x - v.x) < EPS && Math.abs(this.y - v.y) < EPS;
    }

    // +=, -=, *=, /=

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mul(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    div(s) {
        return this.mul(1 / s);
    }

    // +, -, *, /

    plus(v) {
        return this.copy().add(v);
    }

    minus(v) {
        return this.copy().sub(v);
    }

    times(s) {
        return this.copy().mul(s);
    }

    over(s) {
        return this.copy().div(s);
    }
}

function lerp(a1, a2, t) {
    return a1 + t * (a2 - a1);
}

function clamp(n, min, max) {
    return Math.max(Math.min(n, max), min);
}