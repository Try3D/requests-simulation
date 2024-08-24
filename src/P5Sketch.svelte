<script>
  import { onMount } from "svelte";
  import p5 from "p5";
  import p5Sketch from "./lib/sketch";

  let sketchRef;

  onMount(() => {
    const sketch = p5Sketch;
    const myP5 = new p5(sketch, sketchRef);

    return () => {
      myP5.remove();
    };
  });
</script>

<div bind:this={sketchRef}></div>

<style>
  div {
    border: 3px solid black;
    box-shadow: 10px 10px 0px 0px #000;
  }
</style>
