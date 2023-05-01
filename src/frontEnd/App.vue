<template>
<!--  <TestIndex/>-->
<!--  <Index/>-->
  <IndexV2/>
</template>

<script>
import TestIndex from "../test/frontend/TestIndex.vue";
import Index from "../frontEnd/v1/components/Index.vue";
import IndexV2 from "./v2/Index-v2.vue";

export default {
  name: 'App',
  components: {
    TestIndex,
    Index,
    IndexV2
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
