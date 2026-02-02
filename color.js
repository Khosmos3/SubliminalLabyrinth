class Color {
    constructor(c = false) {
        if (c === false)
            [this.r, this.g, this.b] = Color.hexToRGB("#ffffff");
        else if (typeof c === "object")
            [this.r, this.g, this.b] = c;
        else if (typeof c === "string")
            [this.r, this.g, this.b] = Color.hexToRGB(c);
    }

    getHex() {
        return Color.RGBToHex(this.r, this.g, this.b);
    }

    static hexToRGB(hex) {
        return [Number("0x" + hex.substring(1, 3)), Number("0x" + hex.substring(3, 5)), Number("0x" + hex.substring(5, 7))];
    }

    static RGBToHex(r, g, b) {
        return "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
    }

    colorLerp(c, t) {
        if (typeof c !== "Color") c = new Color(c);

        let out = new Color();

        out.r = Math.round(lerp(this.r, c.r, t));
        out.g = Math.round(lerp(this.g, c.g, t));
        out.b = Math.round(lerp(this.b, c.b, t));

        return out;
    }

    static colorLerp(c1, c2, t) {
        if (typeof c1 !== "Color") c1 = new Color(c1);
        if (typeof c2 !== "Color") c2 = new Color(c2);

        let out = new Color();

        out.r = Math.round(lerp(c1.r, c2.r, t));
        out.g = Math.round(lerp(c1.g, c2.g, t));
        out.b = Math.round(lerp(c1.b, c2.b, t));

        return out;
    }

    static chainColorLerp(colors, t) {
        let total = 0;
        for (let i = 0; i < colors.length; i++)
            total += colors[i][1];

        let T = total * t;
        let m = 0;

        for (let i = 0; i < colors.length; i++) {
            for (let j = 0; j < colors[i][1]; j++) {
                if (T >= m && T < m + 1)
                    return this.colorLerp(colors[i][0], colors[i + 1 < colors.length ? i + 1 : 0][0], j / (colors[i][1]));

                m++
            }
        }
    }

    invert() {
        this.r = 255 - this.r;
        this.g = 255 - this.g;
        this.b = 255 - this.b;
    }

    inverse() {
        return new Color([255 - this.r, 255 - this.g, 255 - this.b]);
    }

    static invert(color) {
        if (typeof color !== "Color") color = new Color(color);

        return new Color([255 - color.r, 255 - color.g, 255 - color.b]);
    }

    greyscale() {
        let average = Math.round((this.r + this.b + this.g) / 3);

        this.r = average;
        this.b = average;
        this.g = average;
    }

    asGreyscale() {
        let average = Math.round((this.r + this.b + this.g) / 3);

        return new Color([average, average, average]);
    }

    static greyscale(color) {
        if (typeof color !== "Color") color = new Color(color);

        let average = Math.round((color.r + color.b + color.g) / 3);

        return new Color([average, average, average]);
    }

    shade(amount) {
        this.r = Math.round(clamp(this.r + amount, 0, 255));
        this.g = Math.round(clamp(this.g + amount, 0, 255));
        this.b = Math.round(clamp(this.b + amount, 0, 255));
    }

    shaded(amount) {
        let out = new Color();

        out.r = Math.round(clamp(this.r + amount, 0, 255));
        out.g = Math.round(clamp(this.g + amount, 0, 255));
        out.b = Math.round(clamp(this.b + amount, 0, 255));

        return out;
    }

    static shade(color, amount) {
        if (typeof color !== "Color") color = new Color(color);

        let out = new Color();

        out.r = Math.round(clamp(color.r + amount, 0, 255));
        out.g = Math.round(clamp(color.g + amount, 0, 255));
        out.b = Math.round(clamp(color.b + amount, 0, 255));

        return out;
    }

    shiftR(amount) {
        this.r = Math.round(clamp(this.r + amount, 0, 255));
    }

    shiftedR(amount) {
        return new Color([Math.round(clamp(this.r + amount, 0, 255)), this.g, this.b]);
    }

    static shiftR(color, amount) {
        if (typeof color !== "Color") color = new Color(color);

        return new Color([Math.round(clamp(color.r + amount, 0, 255)), color.g, color.b]);
    }

    shiftG(amount) {
        this.g = Math.round(clamp(this.g + amount, 0, 255));
    }

    shiftedG(amount) {
        return new Color([this.r, Math.round(clamp(this.g + amount, 0, 255)), this.b]);
    }

    static shiftG(color, amount) {
        if (typeof color !== "Color") color = new Color(color);

        return new Color([color.r, Math.round(clamp(color.g + amount, 0, 255)), color.b]);
    }

    shiftB(amount) {
        this.b = Math.round(clamp(this.b + amount, 0, 255));
    }

    shiftedB(amount) {
        return new Color([this.r, this.g, Math.round(clamp(this.b + amount, 0, 255))]);
    }

    static shiftB(color, amount) {
        if (typeof color !== "Color") color = new Color(color);

        return new Color([color.r, color.g, Math.round(clamp(color.b + amount, 0, 255))]);
    }

    add(color, amount) {
        this.r = Math.round(clamp(this.r + color.r*amount, 0, 255));
        this.g = Math.round(clamp(this.g + color.g*amount, 0, 255));
        this.b = Math.round(clamp(this.b + color.b*amount, 0, 255));
    }

    added(color, amount) {
        let out = new Color();

        out.r = Math.round(clamp(this.r + color.r*amount, 0, 255));
        out.g = Math.round(clamp(this.g + color.g*amount, 0, 255));
        out.b = Math.round(clamp(this.b + color.b*amount, 0, 255));

        return out;
    }

    static add(color1, color2, amount) {
        if (typeof color1 !== "Color") color1 = new Color(color1);

        let out = new Color();

        out.r = Math.round(clamp(color1.r + color2.r*amount, 0, 255));
        out.g = Math.round(clamp(color1.g + color2.g*amount, 0, 255));
        out.b = Math.round(clamp(color1.b + color2.b*amount, 0, 255));

        return out;
    }

    average(color) {
        this.r = Math.round((this.r + color.r) / 2);
        this.g = Math.round((this.g + color.g) / 2);
        this.b = Math.round((this.b + color.b) / 2);
    }

    averaged(color) {
        let out = new Color();

        out.r = Math.round((this.r + color.r) / 2);
        out.g = Math.round((this.g + color.g) / 2);
        out.b = Math.round((this.b + color.b) / 2);

        return out;
    }

    average(color1, color2) {
        if (typeof color1 !== "Color") color1 = new Color(color1);

        let out = new Color();

        out.r = Math.round((color1.r + color2.r) / 2);
        out.g = Math.round((color1.g + color2.g) / 2);
        out.b = Math.round((color1.b + color2.b) / 2);

        return out;
    }
}