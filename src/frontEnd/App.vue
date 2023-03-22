<template>
  <TestIndex/>
<!--  <Index/>-->
</template>

<script>
import TestIndex from "../test/frontend/TestIndex.vue";
import Index from "../frontEnd/components/Index.vue";

export default {
  name: 'App',
  components: {
    TestIndex,
    Index
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
