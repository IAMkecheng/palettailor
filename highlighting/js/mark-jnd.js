/**
 * JND for different mark, based on Danielle Albers Szafir's paper:
 * "Modeling Color Difference for Visualization Design"
 * the input diameter should be visual angle: 1 degree approximately 25 pixels wide
 */

class MarkJND {
    constructor() {
        this.pointParas = { c: { l: 0.0937, a: 0.0775, b: 0.0611 }, k: { l: 0.0085, a: 0.0121, b: 0.0096 } }
        this.barParas = { c: { l: 0.1056, a: 0.0881, b: 0.0719 }, k: { l: 0.0061, a: 0.0067, b: 0.0059 }, elongation: { l: 0.0134, a: 0.0117, b: 0.0105 } }
        this.lineParas = { c: { l: 0.0742, a: 0.0623, b: 0.0425 }, k: { l: 0.0023, a: 0.0015, b: 0.0009 } }
    }

    pointJND(diameter, p) {
        if (diameter === 0) {
            return { l: 0, a: 0, b: 0 }
        }
        return {
            l: Math.abs(p / (this.pointParas.c.l - this.pointParas.k.l / diameter)),
            a: Math.abs(p / (this.pointParas.c.a - this.pointParas.k.a / diameter)),
            b: Math.abs(p / (this.pointParas.c.b - this.pointParas.k.b / diameter))
        }
    }

    barJND(shortest, longest, p) {
        if (shortest === 0) {
            return { l: 0, a: 0, b: 0 }
        }
        let elongation = longest / shortest
        return {
            l: Math.abs(p / (this.barParas.c.l - this.barParas.k.l / shortest - this.barParas.elongation.l / elongation)),
            a: Math.abs(p / (this.barParas.c.a - this.barParas.k.a / shortest - this.barParas.elongation.a / elongation)),
            b: Math.abs(p / (this.barParas.c.b - this.barParas.k.b / shortest - this.barParas.elongation.b / elongation))
        }
    }

    lineJND(thickness, p) {
        if (thickness === 0) {
            return { l: 0, a: 0, b: 0 }
        }
        return {
            l: Math.abs(p / (this.lineParas.c.l - this.lineParas.k.l / thickness)),
            a: Math.abs(p / (this.lineParas.c.a - this.lineParas.k.a / thickness)),
            b: Math.abs(p / (this.lineParas.c.b - this.lineParas.k.b / thickness))
        }
    }
}