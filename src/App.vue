<!-- Use preprocessors via the lang attribute! e.g. <template lang="pug"> -->
  <template>
    <div id="app" @keydown.space="space = true" @keyup.space="space = false" tabindex="0">
      <div class="wrapper">
        <div class="wrapper__background" :style="{transform: matrix}"></div>
        <img
          class="wrapper__image"
          v-for="(layer, idx) in backLayers"
          :key="`back-${idx}`"
          :src="layer.data"
          :style="{transform: matrix, opacity: layer.opacity }"
          v-show="layer.visible"
        />
        <canvas
          class="wrapper__canvas"
          ref="canvas"
          width="3200"
          height="3200"
          :style="{transform: matrix, opacity: canvasOpacity}"
          v-show="selectedLayer ? selectedLayer.visible : true"
        ></canvas>
        <img
          class="wrapper__image"
          v-for="(layer, idx) in frontLayers"
          :key="idx"
          :src="layer.data"
          :style="{transform:matrix, opacity: layer.opacity}"
          v-show="layer.visible"
        />
        <div
          class="pointerEventLayer"
          :class="{grab: space, grabbing: (drag && space) || pan}"
          @pointerdown="down"
          @pointerup="up"
          @pointermove="move"
          @wheel="onWheel"
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
        <span>x{{scale.toFixed(2 )}}</span>
        <div>
          <div
            v-for="(layer, idx) in layers"
            :key="idx"
            class="layer"
            @click="selectLayer(idx)"
            :class="{selected: idx === selectedLayerIndex}"
          >
            <img class="layer__thumb" :src="layer.data" width="30" />
            <input type="checkbox" v-model="layer.visible" />
            <div class="layer__label">Layer {{idx}}</div>
            <input type="range" step="0.01" min="0" max="1" v-model="layer.opacity" />
          </div>
          <button @click="addLayer">Add layer</button>
        </div>
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
        layers: [],
        selectedLayerIndex: -1,
        drag: false,
        pan: false,
        old: null,
        eraser: false,
        color: "#000000",
        lineWidth: 13,
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
      },
      selectedLayerIndex(index) {
        ctx.clearRect(0, 0, 3200, 3200);
        const img = new Image();
        img.src = this.layers[index].data;
        ctx.drawImage(img, 0, 0);
      }
    },
    computed: {
      selectedLayer() {
        return this.layers[this.selectedLayerIndex];
      },
      backLayers() {
        return this.layers.slice(0, this.selectedLayerIndex);
      },
      frontLayers() {
        return this.layers.slice(this.selectedLayerIndex + 1);
      },
      matrix() {
        return this.transform.toCSSMatrixString();
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
      },
      canvasOpacity() {
        if (this.selectedLayer) {
          return this.selectedLayer.opacity;
        }
        return 1;
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
      dragMove(ev) {
        const startPos = new Vec2(this.old.x, this.old.y);
        const pos = new Vec2(ev.offsetX, ev.offsetY);
        const mouseDiff = pos.sub(startPos);
        this.transform = new Transform(...this.initial).translate(mouseDiff);
      },
      dragStart(ev) {
        this.pan = true;
        this.old = {
          x: ev.offsetX,
          y: ev.offsetY
        };
        this.initial = this.transformRaw;
      },
      dragEnd() {
        this.pan = false;
      },
      down(ev) {
        ev.target.setPointerCapture(ev.pointerId);
        if (ev.button === 1) {
          this.dragStart(ev);
          return;
        }
        if (this.space) {
          this.dragStart(ev);
          return;
        }
        this.drag = true;
  
        const doc = new Vec2(ev.offsetX, ev.offsetY).transform(
          this.transform.invert()
        );
        this.old = {
          x: doc.x,
          y: doc.y
        };
        this.move(ev);
      },
      up(ev) {
        if (this.pan) {
          this.dragEnd();
          return;
        }
        if (this.drag) {
          this.layers[this.selectedLayerIndex].data = canvas.toDataURL(
            "image/png"
          );
        }
        this.drag = false;
      },
      move(ev) {
        if (this.pan) {
          this.dragMove(ev);
          return;
        }
  
        if (this.space && this.drag) {
          this.dragMove(ev);
          return;
        }
  
        if (this.drag) {
          const doc = new Vec2(ev.offsetX, ev.offsetY).transform(
            this.transform.invert()
          );
          ctx.beginPath();
          ctx.strokeStyle = this.color;
          ctx.moveTo(this.old.x, this.old.y);
          ctx.lineTo(doc.x, doc.y);
          ctx.stroke();
          // ctx.closePath();
          this.old = {
            x: doc.x,
            y: doc.y
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
      },
      createBlankLayer() {
        //注意！現在のcanvasをクリアします
        //iOSのcanvas面積節約のため仕方なくです
        const blank = new Image(3200, 3200);
        ctx.clearRect(0, 0, 3200, 3200);
        ctx.drawImage(blank, 0, 0);
        return canvas.toDataURL("image/png");
      },
      addLayer() {
        this.layers.push({
          visible: true,
          opacity: 1,
          data: this.createBlankLayer()
        });
        this.selectedLayerIndex = this.layers.length - 1;
      },
      selectLayer(index) {
        this.selectedLayerIndex = index;
      }
    },
    mounted() {
      canvas = this.$refs.canvas;
      ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineWidth = this.lineWidth;
  
      this.layers.push({
        visible: true,
        opacity: 1,
        data: this.createBlankLayer()
      });
      this.selectedLayerIndex = 0;
      document.getElementById("app").focus();
    }
  };
  </script>
  
  <style>
  body {
    background: #333;
    color: white;
  }
  .wrapper__background {
    transform-origin: 0% 0%;
    position: absolute;
    left: 0;
    top: 0;
    width: 3200px;
    height: 3200px;
    background: white;
  }
  .wrapper__image {
    transform-origin: 0% 0%;
    position: absolute;
    left: 0;
    top: 0;
  }
  .wrapper__canvas {
    touch-action: none;
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
  
  .pointerEventLayer {
    position: absolute;
    left: 0;
    top: 0;
    width: 400px;
    height: 400px;
  }
  .pointerEventLayer.grab {
    cursor: grab;
  }
  .pointerEventLayer.grabbing {
    cursor: grabbing;
  }
  
  #app {
    outline: none;
  }
  .layer {
    width: 300px;
    background: #ddd;
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid black;
  }
  .layer.selected {
    background: #aad;
  }
  .layer__thumb {
    background: white;
    width: 50px;
  }
  .layer__label {
    color: black;
    margin: 0.25em;
  }
  </style>
  