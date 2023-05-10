<template>
  <el-button @click="read">浏览</el-button>
  <el-tree :data="tree" :load="load" lazy>
    <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-text v-if="node.data.display">
              <el-icon v-if="node.data.isDirectory" color="#c89065" style="font-size: 18px;"><Folder /></el-icon>
              <el-icon v-if="!node.data.isDirectory" color="#689e82"><Files /></el-icon>
            </el-text>
          <span>{{ node.label }}</span>
<!--          <span>
            <a @click="append(data)"> Append </a>
            <a style="margin-left: 8px" @click="remove(node, data)"> Delete </a>
          </span>-->
        </span>
    </template>
  </el-tree>
</template>

<script>
export default {
  name: "FileAccess",
  data(){
    return {
      base: 'D:/Note',
      tree:[]
    }
  },
  mounted() {
    console.log('mounted');
    this.read();
  },
  methods:{
    async read(){
      let struct=await window.files.dir(this.base);
      this.tree=struct.map(({name,isDirectory,path})=>({
        label:name,
        isDirectory,
        path,
        display:true
      }));
      console.log(struct);
    },
    async load(node){
      console.log(node);
      //let struct=await window.files.dir(this.base);
    }
  }
}
</script>

<style scoped>

</style>