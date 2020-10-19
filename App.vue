<!-- Use preprocessors via the lang attribute! e.g. <template lang="pug"> -->
<template>
  <div id="app" @keydown.space="space = true" @keyup.space="space = false" tabindex="0">
    <div class="wrapper" @wheel="onWheel">
      <canvas
        ref="canvas"
        width="3200"
        height="3200"
        @pointerdown="down"
        @pointerup="up"
        @pointermove="move"
        :style="matrix"
      ></canvas>
      <div
        v-show="space"
        class="grabLayer"
        :class="{grabbing: drag}"
        @pointerdown="wrapperDown"
        @pointermove="wrapperMove"
        @pointerup="wrapperUp"
      ></div>
    </div>
    <div>
      <input type="color" v-model="color" />
      <label>
        <input type="checkbox" v-model="eraser" />Eraser
      </label>
      <select v-model.number="lineWidth">
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>5</option>
        <option>8</option>
        <option>13</option>
        <option>21</option>
        <option>50</option>
        <option>100</option>
      </select>
      <button @click="clear">Clear</button>
      <button @click="save">Save</button>
      <div>x{{scale.toFixed(2 )}}</div>
      <select v-model.number="scale">
        <option>0.01</option>
        <option>0.05</option>
        <option>0.1</option>
        <option>0.2</option>
        <option>0.4</option>
      </select>
    </div>
  </div>
</template>

<script>
import { Rect, Vec2, Transform } from "paintvec";
let ctx = null;
let canvas = null;

export default {
  data() {
    return {
      drag: false,
      old: null,
      eraser: false,
      color: "#000000",
      lineWidth: 100,
      offset: {
        x: 200,
        y: 200
      },
      space: false,
      transformRaw: new Transform().members //no-op
    };
  },
  watch: {
    eraser(n) {
      ctx.globalCompositeOperation = n ? "destination-out" : "source-over";
    },
    lineWidth(w) {
      ctx.lineWidth = w;
    }
  },
  computed: {
    matrix() {
      return { transform: this.transform.toCSSMatrixString() };
    },
    transform: {
      get() {
        return new Transform(...this.transformRaw);
      },
      set(newValue) {
        this.transformRaw = newValue.members;
      }
    },
    scale() {
      return new Rect(new Vec2(0, 0), new Vec2(1, 1)).transform(this.transform)
        .width;
    }
  },
  methods: {
    onWheel(ev) {
      const target_rect = ev.currentTarget.getBoundingClientRect();
      const x = ev.clientX - target_rect.left;
      const y = ev.clientY - target_rect.top;

      // taken from d3.zoom 少しマイルドかも
      let delta =
        -event.deltaY *
        (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
        (event.ctrlKey ? 10 : 1);
      let scale = Math.pow(2, delta);

      // const scale = Math.pow(0.5, ev.deltaY / 256);

      const center = new Vec2(x, y);
      this.transform = this.transform
        .translate(center.neg)
        .scale(new Vec2(scale, scale))
        .translate(center);
    },
    wrapperDown(ev) {
      if (this.space) {
        ev.target.setPointerCapture(ev.pointerId);

        this.drag = true;
        this.old = {
          x: ev.offsetX,
          y: ev.offsetY
        };
        this.initial = this.transformRaw;
      }
    },
    wrapperUp(ev) {
      this.drag = false;
    },
    wrapperMove(ev) {
      if (this.drag) {
        const startPos = new Vec2(this.old.x, this.old.y);
        const pos = new Vec2(ev.offsetX, ev.offsetY);
        const mouseDiff = pos.sub(startPos);
        this.transform = new Transform(...this.initial).translate(mouseDiff);
      }
    },
    down(ev) {
      if (this.space) {
        return;
      }
      canvas.setPointerCapture(ev.pointerId);
      this.drag = true;
      this.old = {
        x: ev.offsetX,
        y: ev.offsetY
      };
      this.move(ev)
    },
    up() {
      this.drag = false;
    },
    move(ev) {
      if (this.space) {
        return;
      }

      if (this.drag) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.moveTo(this.old.x, this.old.y);
        ctx.lineTo(ev.offsetX, ev.offsetY);
        ctx.stroke();
        // ctx.closePath();
        this.old = {
          x: ev.offsetX,
          y: ev.offsetY
        };
      }
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    save() {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "download.png";
      a.click();
    }
  },
  mounted() {
    canvas = this.$refs.canvas;
    ctx = canvas.getContext("2d", {
      desynchronized: true
    });
    ctx.lineCap = "round";
    ctx.lineWidth = this.lineWidth;
    document.getElementById("app").focus();
  }
};
</script>

<style>
body {
  background: #333;
  color: white;
}
canvas {
  touch-action: none;
  background: white;
  transform-origin: 0% 0%;
  position: absolute;
  left: 0;
  top: 0;
}
.wrapper {
  background: #999;
  width: 400px;
  height: 400px;
  overflow: hidden;
  position: relative;
}

.grabLayer {
  position: absolute;
  left: 0;
  top: 0;
  width: 400px;
  height: 400px;
  cursor: grab;
}
.grabLayer.grabbing {
  cursor: grabbing;
}

#app {
  outline: none;
}
</style>
