<template>
  <svg viewBox="0 0 200 100" width="200" height="100" ref="canv">
    <defs>
      <linearGradient
        id="hsv1"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
        gradientUnits="userSpaceOnUse"
        spreadMethod="repeat"
      >
        <stop offset="0%" stop-color="#ff0000" />
        <stop offset="16.7%" stop-color="#ffff00" />
        <stop offset="33.3%" stop-color="#00ff00" />
        <stop offset="50.0%" stop-color="#00ffff" />
        <stop offset="66.7%" stop-color="#0000ff" />
        <stop offset="83.3%" stop-color="#ff00ff" />
        <stop offset="100%" stop-color="#ff0000" />
      </linearGradient>
      <linearGradient
        id="hsv2"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
        gradientUnits="userSpaceOnUse"
        spreadMethod="repeat"
      >
        <stop offset="0%" :stop-color="sStop[0]" />
        <stop offset="100%" :stop-color="sStop[1]" />
      </linearGradient>
      <linearGradient
        id="hsv3"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
        gradientUnits="userSpaceOnUse"
        spreadMethod="repeat"
      >
        <stop offset="0%" :stop-color="lStop[0]" />
        <stop offset="50%" :stop-color="lStop[1]" />
        <stop offset="100%" :stop-color="lStop[2]" />
      </linearGradient>
    </defs>
    <rect rx="20" :fill="hsl" x="0" y="0" width="20" height="20" />
    <rect
      fill="url(#hsv1)"
      x="0"
      y="20"
      height="20"
      width="200"
      @pointermove="moveH"
      @pointerup="up"
      @pointerdown="downH"
    />
    <rect
      fill="url(#hsv2)"
      x="0"
      y="40"
      height="20"
      width="200"
      @pointermove="moveS"
      @pointerup="up"
      @pointerdown="downS"
    />
    <rect
      fill="url(#hsv3)"
      x="0"
      y="60"
      height="20"
      width="200"
      @pointermove="moveL"
      @pointerup="up"
      @pointerdown="downL"
    />
    <circle
      style="pointer-events: none;"
      :cx="h * 200 / 360"
      cy="30"
      r="5"
      stroke="black"
      fill="white"
    />
    <circle
      style="pointer-events: none;"
      :cx="s * 200 / 100"
      cy="50"
      r="5"
      stroke="black"
      fill="white"
    />
    <circle
      style="pointer-events: none;"
      :cx="l * 200 / 100"
      cy="70"
      r="5"
      stroke="black"
      fill="white"
    />
  </svg>
</template>

<script>
export default {
  props: {
    initialColor: Object
  },
  data() {
    return {
      h: 50,
      s: 100,
      l: 50,
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
      return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
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
    downS(ev) {
      ev.target.setPointerCapture(ev.pointerId);
      this.pressed = true;
      this.moveS(ev);
    },
    moveL(ev) {
      if (!this.pressed) {
        return;
      }
      this.l = (this.getX(ev) / 200) * 100;
    },
    downL(ev) {
      ev.target.setPointerCapture(ev.pointerId);
      this.pressed = true;
      this.moveL(ev);
    },
    moveS(ev) {
      if (!this.pressed) {
        return;
      }
      this.s = (this.getX(ev) / 200) * 100;
    },
    up(ev) {
      this.pressed = false;
    }
  },
  mounted() {
    if (this.initialColor) {
      this.h = this.initialColor.h;
      this.s = this.initialColor.s;
      this.l = this.initialColor.l;
    }
  }
};
</script>

<style>
</style>

