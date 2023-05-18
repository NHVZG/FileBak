<template>
  <!-- node -->
  <div class="node">
    <div>
      <el-icon class="icon pointer" v-if="nodedata.children&&nodedata.children.length>0"><CaretRight /></el-icon>
      <el-icon class="icon" v-if="!nodedata.children||nodedata.children.length<1"></el-icon>
    </div>
    <div>
      <slot></slot>
    </div>

  </div>

</template>

<script>
import ExpandContent from "@/frontEnd/v3/components/tree/ExpandContent.vue";
import {provide} from "vue";

export default {
  name: "Node",
  components:{
    ExpandContent
  },
  props:{
    nodedata:{
      type:Object
    }
  },
  created() {
  },
  data(){
    return {

    }
  }
}
</script>

<style scoped>
  .node{
    display: flex;
    font-size: 14px;
    align-items: center;
    color: #606266;
  }
  .icon{
    padding: 1px;
  }
  .pointer{
    cursor: pointer;
  }
</style>