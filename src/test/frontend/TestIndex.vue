<template>
  <!--  <img alt="Vue logo" src="../frontEnd/assets/logo.png">-->
  <!--  <HelloWorld msg="Welcome to Your Vue.js App"/>-->
  <!--  <WebRTC/>-->
  <!--  <ElectronVue/>-->
  <!--  <ElectronVueFileAccess/>-->
  <ChatLocal/>
</template>

<script>
import HelloWorld from './HelloWorld.vue'
import ElectronVue from "./ElectronVue.vue";
import WebRTC from './WebRTC.vue'
import ElectronVueFileAccess from "./ElectronVueFileAccess.vue";
import ChatLocal from "@/test/frontend/ChatLocal.vue";

export default {
  name: "TestIndex",
  components: {
    HelloWorld,
    WebRTC,
    ElectronVue,
    ElectronVueFileAccess,
    ChatLocal
  }
}
</script>

<style scoped>

</style>