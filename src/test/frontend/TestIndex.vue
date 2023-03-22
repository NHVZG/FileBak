<template>
  <!--  <img alt="Vue logo" src="../frontEnd/assets/logo.png">-->
  <!--  <HelloWorld msg="Welcome to Your Vue.js App"/>-->
  <!--  <WebRTC/>-->
  <!--  <ElectronVue/>-->
  <ElectronVueFileAccess/>
</template>

<script>
import HelloWorld from './HelloWorld.vue'
import ElectronVue from "./ElectronVue.vue";
import WebRTC from './WebRTC.vue'
import ElectronVueFileAccess from "./ElectronVueFileAccess.vue";

export default {
  name: "TestIndex",
  components: {
    HelloWorld,
    WebRTC,
    ElectronVue,
    ElectronVueFileAccess
  }
}
</script>

<style scoped>

</style>