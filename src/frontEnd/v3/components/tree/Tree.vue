<template>
  <el-button @click="test">test1</el-button>
  <Node v-for="(node) in data" :nodedata="node">
        <!--<template #default="{ node }">-->
        <slot :node="node"></slot>
  </Node>
</template>

<script>
import Node from "@/frontEnd/v3/components/tree/Node.vue";


export default {
  name: "Tree",
  components:{
    Node
  },
  props:{
    data:{
      type:Array
    }
  },
  created() {
    this.treeData=this.createNode(this.data);
  },
  watch:{
    /*data:{
      handler(nVal,oVal){

      },
      deep:true
    }*/
  },
  data(){
    return {
      treeData:[],
      treeNodes:{}
    }
  },
  methods:{
    initData(){
      this.treeData.map(d=>this.createNode())
    },
    createNode(data){
      let n={data,id:'13'};
      if(data.children&&data.children.length>0){
        n.children=data.children.map(d=>this.createNode(d));
      }
      return n;
      //let node=id?`${id}-1`
      /*return {
        data:data,
        node:{
          id:id,
          expand:false,
          isLeaf:data.isLeaf!==undefined?data.isLeaf:true
        }
      }*/
    },

    test(){
      console.log(this.data);
    }
  }

}
</script>

<style scoped>

</style>