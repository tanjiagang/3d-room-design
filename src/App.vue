<script setup lang="ts">
</script>

<template>
  <RouterView />
</template>

<style>
/* reset css */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}
ul,
li {
  margin: 0;
  padding: 0;
  list-style: none;
}
a {
  text-decoration: none;
  color: inherit;
}
/* dat.gui */
.dg.main {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  background-color: #f0d4af;
  color: #333;
  font: 14px 'Lucida Grande', sans-serif;
  text-shadow: none;
  /* width: 300px; */
}
.dg.main li:not(.folder) {
    /* background: #ffffff;
    border-bottom: 1px solid #2fa1d6; */
    background: #f0d4af;
    border-bottom: 1px solid #846033;
}
.dg.main .cr.number {
    border-left: 3px solid #8b8683;
}
.dg.main.a .close-button {
  color: #000;
  background-color: #bfa291;
}
.dg.main.a .close-button:hover {
  color: #fff;
  background-color: #846033;
}
.dg.main .c .slider {
    background: #ffffff;
}
.dg.main .c .slider:hover {
    background: #856033;
}
.dg.main .c .slider:hover .slider-fg {
    background: #b39c81;
}
.dg.main .c input[type=text] {
    background: #b39c81;
    outline: none;
}
.dg.main .cr.number input[type=text] {
    color: #ffffff;
}
.dg.main .c .slider-fg {
    background: #8460339e;
}
:global(.dg) {
  color: #000000;
  text-shadow: none;
  font: 14px sans-serif;
}
:global(.dg li:not(.folder)) {
    background: #ffffff;
    border-bottom: 1px solid #409eff;
}
</style>
