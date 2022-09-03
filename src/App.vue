<!-- Use preprocessors via the lang attribute! e.g. <template lang="pug"> -->
  <template>
  <div class="wrapper" @keydown.space="space = true" @keyup.space="space = false">
    <div class="pane--left" tabindex="0">
      <div class="wrapper__background" :style="{ transform: matrix }"></div>
      <img class="wrapper__image" v-for="(layer, idx) in backLayers" :key="`back-${idx}`" :src="layer.data"
        :style="{ transform: matrix, opacity: layer.opacity }" v-show="layer.visible" />
      <canvas class="wrapper__canvas" ref="canvas" width="3200" height="3200"
        :style="{ transform: matrix, opacity: canvasOpacity }"
        v-show="selectedLayer ? selectedLayer.visible : true"></canvas>
      <img class="wrapper__image" v-for="(layer, idx) in frontLayers" :key="idx" :src="layer.data"
        :style="{ transform: matrix, opacity: layer.opacity }" v-show="layer.visible" />
      <div class="pointerEventLayer" :class="{ grab: space, grabbing: (drag && space) || pan }" @pointerdown="down"
        @pointerup="up" @pointermove="move" @wheel="onWheel" @touchmove.prevent @pointercancel="cancel"></div>
    </div>
    <div class="pane--right">
      <color @change="setColor" :initial-color="{ h: 188, s: 83, l: 50 }"></color>
      <!-- <input type="color" v-model="color" /> -->

      <fieldset>
        <input id="item-1" class="radio-inline__input" v-model="tool" type="radio" name="accessible-radio" value="pen" checked="checked"/>
        <label class="radio-inline__label" for="item-1">
          <img src="/brush.svg" class="radio-inline__label__icon">
        </label>
        <input id="item-2" class="radio-inline__input" v-model="tool" type="radio" name="accessible-radio" value="eraser"/>
        <label class="radio-inline__label" for="item-2">
          <img src="/eraser.svg" class="radio-inline__label__icon">
        </label>
      </fieldset>

      <div class="pen-size__list">
        <svg @click="setPenSize(penSize)" v-for="penSize in penSizeList" :key="penSize" class="pen-size__item" width="40" height="40" :class="{'selected': penSize === lineWidth}">
          <circle cx="20" cy="13" :r="Math.min(penSize, 10)" fill="#333" />
          <text x="20" y="34" font-size="10" text-anchor="middle" fill="black">{{penSize}}</text>
        </svg>
      </div>

      <div class="layer__wrapper">
        <div v-for="(layer, idx) in layers" :key="idx" class="layer" @click="selectLayer(idx)"
          :class="{ selected: idx === selectedLayerIndex }">
          <img class="layer__thumb" :src="layer.data" width="30" />
          <input type="checkbox" v-model="layer.visible" />
          <div class="layer__label">Layer {{ idx }}</div>
          <!-- <input type="range" step="0.01" min="0" max="1" v-model="layer.opacity" /> -->
        </div>
        <button @click="addLayer">
          <img src="/file.svg" alt="New Layer" class="button__icon"> New Layer
        </button>
      </div>

      <div style="padding-top: 2rem;">
        <button @click="clear">
        <img src="/trash.svg" alt="Clear" class="button__icon">
        Clear</button>
      <button @click="save">
        <img src="/download.svg" alt="Clear" class="button__icon">
        Save</button>
      <span>x{{ scale.toFixed(2) }}</span>

      </div>

    </div>
  </div>

</template>
  
<script>
import { Rect, Vec2, Transform } from "paintvec";
import color from "./Color.vue"

const penSizeList = [
  0.5, 1, 2, 3, 5, 8, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500
];


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
      color: "#000000",
      lineWidth: 13,
      penSizeList,
      offset: {
        x: 200,
        y: 200
      },
      tool: "pen",
      space: false,
      transformRaw: new Transform().members //no-op
    };
  },
  components: {
    color
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
    eraser(){
      return this.tool === "eraser"
    },
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
    setPenSize(size) { 
      this.lineWidth = size;
    },
    setColor(color) { 
      this.color = color;
    },
    cancel(_){
      this.drag = false;      
    },
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
  body,
  html {
    height: 100%;
  }
  
  body {
    margin: 0;
    display: flex;
    background: #333;    overscroll-behavior: none;
  }
  
  #app {
    display: flex;
    flex: 1;
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
    display: flex;
    height: 100%;
    flex: 1;
  }
  
  .pane--left {
    flex: 1;
    background: #999;
    overflow: hidden;
    position: relative;
  }
  
  .pane--right {
    background: #FFF;
    width: 200px;
    overflow: hidden;
    position: relative;
    padding: 4px;
  }
  
  .pointerEventLayer {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    touch-action: manipulation;
  }
  
  .pointerEventLayer.grab {
    cursor: grab;
  }
  
  .pointerEventLayer.grabbing {
    cursor: grabbing;
  }
  
  .layer {
    background: #fff;
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 0.8em;
    border-radius: 2px;
    margin-bottom: 0.25em;
  }
  
  .layer:hover {
    background: rgb(243, 243, 255);
  }
  
  .layer.selected {
    background: rgb(209, 209, 248);
  }
  
  .layer__thumb {
    background: white;
    width: 40px;
    border: 1px solid #999;
    margin: 2px;
  }
  
  .layer__label {
    color: black;
    margin: 0.25em;
  }
  
  .layer__wrapper {
    padding: 0.25em;
    background-color: #999;
  }
  .pen-size__item{
    cursor: pointer;
  }

  .pen-size__item:hover{
    background-color: rgb(241, 242, 255);
  }
  .pen-size__item.selected{
    background-color: rgb(218, 222, 255);
  }
  fieldset{
    border: none;
    padding: 0;
  }

  .radio-inline__input {
    clip: rect(1px, 1px, 1px, 1px);
    position: absolute !important;
  }

  .radio-inline__label {
    display: inline-flex;
    height: 1.5em;
    align-items: center;
    padding: 0.25em 0.5em;
    border-radius: 4px;
  }

  .radio-inline__label__icon{
    height: 1em;
  }

  .radio-inline__input:checked + .radio-inline__label {
    background: #98b2d4;
    color: white;
    text-shadow: 0 0 1px rgba(0,0,0,.7);
  }

  button{
    display: flex;
    align-items: center;
    background-color: white;
    border: 1px solid #999;
    padding: 0.5em 0.75em;
    border-radius: 4px;
    font-size: 0.8em;
  }
  button:hover{
    background-color: rgb(243, 243, 255);
  }
  button:active{
    background-color: rgb(218, 222, 255);
  }
  .button__icon{
    height: 1.5em;
    margin-right: 0.25em;

  }

  </style>
  