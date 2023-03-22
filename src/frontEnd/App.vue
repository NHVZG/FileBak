<template>
<!--  <TestIndex/>-->
  <Chat/>
</template>

<script>
import TestIndex from "../test/frontend/TestIndex.vue";
import Chat from "./components/Chat.vue";

export default {
  name: 'App',
  components: {
    TestIndex,
    Chat
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
