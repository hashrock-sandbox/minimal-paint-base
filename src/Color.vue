<template>
  <svg viewBox="0 0 200 300" width="200" height="300" ref="canv">
    <defs>
      <linearGradient id="hsv1" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="objectBoundingBox"
        spreadMethod="repeat">
        <stop offset="0%" stop-color="#ff0000" />
        <stop offset="16.7%" stop-color="#ffff00" />
        <stop offset="33.3%" stop-color="#00ff00" />
        <stop offset="50.0%" stop-color="#00ffff" />
        <stop offset="66.7%" stop-color="#0000ff" />
        <stop offset="83.3%" stop-color="#ff00ff" />
        <stop offset="100%" stop-color="#ff0000" />
      </linearGradient>
      <linearGradient id="hsv2" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="objectBoundingBox"
        spreadMethod="repeat">
        <stop offset="0%" :stop-color="slBox[0]" />
        <stop offset="100%" :stop-color="slBox[1]" />
      </linearGradient>
      <linearGradient id="hsv3" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="objectBoundingBox"
        spreadMethod="repeat">
        <stop offset="0%" :stop-color="slBox[2]" />
        <stop offset="100%" :stop-color="slBox[3]" />
      </linearGradient>
    </defs>
    <rect rx="20" :fill="hsl" x="0" y="260" width="20" height="20" />
    <g>
      <rect x="0" y="0" width="200" height="200" fill="url(#hsv2)" />
      <rect x="0" y="0" width="200" height="200" fill="url(#hsv3)" @pointermove="moveSV" @pointerup="up"
        @pointerdown="downSV" />
      <circle style="pointer-events: none;" :cx="s * 200 / 100" :cy="(100 - v) * 200 / 100" r="5" stroke="black"
        fill="white" />
    </g>
    <g transform="translate(0, 200)">
      <rect fill="url(#hsv1)" x="0" y="0" height="20" width="200" @pointermove="moveH" @pointerup="up"
        @pointerdown="downH" />
      <circle style="pointer-events: none;" :cx="h * 200 / 360" cy="10" r="5" stroke="black" fill="white" />
    </g>
  </svg>
</template>

<script>
// https://stackoverflow.com/questions/3423214/convert-hsb-hsv-color-to-hsl/54116681#54116681
const hsl2hsv = (h, s, l, v = s * Math.min(l, 1 - l) + l) => [h, v ? 2 - 2 * l / v : 0, v];
const hsv2hsl = (h, s, v, l = v - v * s / 2, m = Math.min(l, 1 - l)) => [h, m ? (v - l) / m : 0, l];

export default {
  props: {
    initialColor: Object
  },
  data() {
    return {
      h: 50,
      s: 100,
      v: 50,
      pressed: false
    };
  },
  watch: {
    hsl(value) {
      this.$emit("change", value);
    }
  },
  computed: {
    hsl() {
      const [h, s, l] = hsv2hsl(this.h, this.s / 100, this.v / 100);
      return `hsl(${h.toFixed(0)}, ${(s * 100).toFixed(0)}%, ${(l * 100).toFixed(0)}%)`;
    },
    slBox() {
      return [
        `hsla(${this.h}, 0%, 100%, 1)`,
        `hsla(${this.h}, 100%, 50%, 1)`,
        `hsla(${this.h}, 100%, 0%, 0)`,
        `hsla(${this.h}, 0%, 0%, 1)`,
      ]
    },
    sStop() {
      return [
        `hsl(${this.h}, 0%, ${this.l}%)`,
        `hsl(${this.h}, 100%, ${this.l}%)`
      ];
    },
    lStop() {
      return [
        `hsl(${this.h}, ${this.s}%, 0%)`,
        `hsl(${this.h}, ${this.s}%, 50%)`,
        `hsl(${this.h}, ${this.s}%, 100%)`
      ];
    }
  },
  methods: {
    getX(ev) {
      const el = this.$refs.canv;
      const pt = el.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      return pt.matrixTransform(el.getScreenCTM().inverse()).x;
    },
    getY(ev) {
      const el = this.$refs.canv;
      const pt = el.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      return pt.matrixTransform(el.getScreenCTM().inverse()).y;
    },
    downH(ev) {
      ev.target.setPointerCapture(ev.pointerId);
      this.pressed = true;
      this.moveH(ev);
    },
    moveH(ev) {
      if (!this.pressed) {
        return;
      }
      this.h = (this.getX(ev) / 200) * 360;
    },
    moveSV(ev) {
      if (!this.pressed) {
        return;
      }
      this.v = 100 - (this.getY(ev) / 200) * 100;
      this.s = (this.getX(ev) / 200) * 100
    },
    downSV(ev) {
      ev.target.setPointerCapture(ev.pointerId);
      this.pressed = true;
      this.moveSV(ev);
    },
    up(ev) {
      this.pressed = false;
    }
  },
  mounted() {
    console.log("mounted")

    if (this.initialColor) {
      const [h, s, v] = hsl2hsv(this.initialColor.h, this.initialColor.s, this.initialColor.l);

      this.h = h;
      this.s = s;
      this.v = v;
    }
  }
};
</script>

<style>
</style>

