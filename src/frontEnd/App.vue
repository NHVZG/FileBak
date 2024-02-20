<template>
<!--  <TestIndex/> --> <!--v1-->
<!--  <Index/>-->
  <IndexV3/> <!--v3-->
<!--  <IndexV4/>-->
</template>

<script>
import TestIndex from "../test/frontend/TestIndex.vue";
import Index from "../frontEnd/v1/components/Index.vue";
import IndexV3 from "./v3/Index.vue";
import IndexV4 from "./v4/Index.vue";

export default {
  name: 'App',
  components: {
    TestIndex,
    Index,
    IndexV3,
    IndexV4
  },
  data(){
    return {
      view: {
        styles: {
          increment: {base: 'rgba(187,249,162)', list: ['rgba(187,249,162,0.42)'], stroke: '#94d27b'},
          incrementUpdate: {base: 'rgba(162,249,235)', list: ['rgba(162,249,235,0.42)'], stroke: '#6fcec0'},
          update: {base: 'rgba(224,249,162)', list: ['rgba(224,249,162,0.42)'], stroke: '#aac365'},
          except: {base: 'rgba(202,202,202)', list: ['rgba(202,202,202,0.42)'], stroke: '#a08c8c'},
          cover: {base: 'rgba(151,161,244)', list: ['rgba(151,161,244,0.42)'], stroke: '#7f89df'},
          remove: {base: 'rgba(231,163,190)', list: ['rgba(231,163,190,0.42)'], stroke: '#d188a6'},
          mapping: {base: 'rgb(237 224 255)', list: ['rgba(222,189,231,0.42)'], stroke: '#bf94cb'},
          normal: {base: 'white', list: ['white'], stroke: 'white'}
        }
      }
    }
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
.el-tree{
  --el-tree-node-hover-bg-color:draked !important;
}


body {
  /*background-color: /#ff0000;*/
}
.increment{
  /*background-color: #bbf9a2;*/
  background-color: v-bind('view.styles.increment.base');
  /*border-bottom: 1px v-bind('view.styles.increment.stroke') solid;*/
}
.incrementUpdate{
  /*background-color: #a2f9eb;*/
  background-color: v-bind('view.styles.incrementUpdate.base');
}
.update{
  /*background-color: #e0f9a2;*/
  background-color: v-bind('view.styles.update.base');
}
.except{
  /*background-color: #cacaca;*/
  background-color: v-bind('view.styles.except.base');
}
.cover{
  /*background-color: #97a1f4;*/
  background-color: v-bind('view.styles.cover.base');
}
.remove{
  /*background-color: #e7a3be;*/
  background-color: v-bind('view.styles.remove.base');
}
.mapping{
  /*background-color: #debde7;*/
  background-color: v-bind('view.styles.mapping.base');
}
.mapping>div:nth-child(1){/*>div:nth-child(1):after*/
  /*background-color: v-bind('view.styles.mapping.base');*/
}
.normal{
  background-color: v-bind('view.styles.normal.base');
}

.zip-increment{

}
.zip-increment>div:nth-child(1):after{
  content: '123';
  float: right;
}


.left-scroll{/*'右到左*/
  /*direction: rtl;*/
}
.left-scroll div{/*'恢复左到右*/
  /*direction: ltr;*/
}
.right-scroll{/*'左到右*/
  /*direction: ltr;*/
}

.box{
  /*使用element-ui滚动组件*/
  /*overflow-y: auto;
  overflow-x: auto;*/
  position: relative;
}
/*.is-current>.el-tree-node__content{
  background-color: red;
}
.el-tree-node__content:hover{
  background-color: red;
}*/
/*
.wrapper {
  float: left;
  animation: background 5s infinite alternate;
}

@keyframes background {
  from {
    background: pink;
  }
  to {
    background: #c0d6ff;
  }
}*/

</style>
