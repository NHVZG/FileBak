<template>
  <el-button @click="test">test</el-button>
  <Tree :data="data">
      <template #default="{ node }">
        <div>{{node.label}}</div>
      </template>
  </Tree>
</template>

<script>
import Tree from "@/frontEnd/v3/components/tree/Tree.vue";
export default {
  name: "TreeTest",
  components:{
    Tree
  },
  data(){
    return {
      data:[
        {label:'A',children:[
            {label:'A-1',children:[{label:'A-1-1'},{label:'A-1-2'}]},
            {label:'A-2',children:[{label:'A-2-1'},{label:'A-2-2'}]}
          ]},
        {label:'B'},
        {label:'C',children:[{label:'C-1'},{label:'C-2'}]},
      ]
    }
  },
  methods:{
    test(){
      this.data[0].label='D';
    }
  }
}
</script>

<style scoped>

</style>