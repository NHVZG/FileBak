<template>
<!--  <TestIndex/> --> <!--v1-->
<!--  <Index/>-->
  <IndexV3/> <!--v3-->
</template>

<script>
import TestIndex from "../test/frontend/TestIndex.vue";
import Index from "../frontEnd/v1/components/Index.vue";
import IndexV3 from "./v3/Index.vue";

export default {
  name: 'App',
  components: {
    TestIndex,
    Index,
    IndexV3
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
