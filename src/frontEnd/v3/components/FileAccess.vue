<template>
  <el-tree :props="treePropName" :data="tree" :load="load" lazy>
    <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-text v-if="data.display">
              <el-icon v-if="data.type===0"><MessageBox /></el-icon>
              <el-icon v-if="data.type===1" color="#c89065">
                  <Folder v-if="!node.expanded"/>
                  <FolderOpened v-if="node.expanded"/>
              </el-icon>
              <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
              <el-icon v-if="data.type===3"><Link /></el-icon>
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
import {Link,Files, Folder, FolderOpened, MessageBox} from "@element-plus/icons-vue";

const DRIVER=0;                 //' 驱动器
const DIRECTORY=1;          //' 文件夹
const FILE=2;                       //' 文件
const SYMBOL=3;               //' 软连接

export default {
  name: "FileAccess",
  components: {Files, Folder, FolderOpened, MessageBox,Link},
  data(){
    return {
      base: '',//D:/Note
      tree:[],
      treePropName:{
        label: 'name',                //. label读 name字段
        isLeaf: 'leaf',                 //. 是否叶子读leaf字段
        children: 'children',
      }
    }
  },
  mounted() {
    //console.log('mounted');
    //this.read();
  },
  methods:{
    async load(node,resolve){
      console.log(node);
      if(node.level===0){
        let struct=await window.files.dir(this.base);
        this.tree=this.resolveNode(struct);
      }else{
        let struct=await window.files.dir(node.data.path);
        resolve(this.resolveNode(struct));
      }
    },
    resolveNode(struct){
      return struct.map(file=>({
        type:file.type,
        name:file.name,
        label:file.name,
        path:file.path,
        display:true,
        leaf:[FILE,SYMBOL].includes(file.type)
      }));
    }

  }
}
</script>

<style scoped>

</style>