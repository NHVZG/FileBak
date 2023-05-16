<template>
  <el-button @click="getRemoteFileStruct">get</el-button>

  <el-row :gutter="6">
    <el-col :span="12">
      <el-card shadow="always" class="tree-card">
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
      </el-card>
    </el-col>


    <el-col :span="12">
      <el-card shadow="always" class="tree-card">
        <el-tree :props="treePropName" :data="remoteTree" :load="loadRemote" lazy>
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
        </span>
          </template>
        </el-tree>
      </el-card>
    </el-col>
  </el-row>



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
      remoteTree:[],
      remoteResolve:null,
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
    let _this=this;
    window.files.onFileStructReply(function(struct){
      _this.remoteResolve(_this.resolveNode(struct));
    });
  },
  methods:{
    async load(node,resolve){
      if(node.level===0){
        let struct=await window.files.dir(this.base);
        this.tree=this.resolveNode(struct);
      }else{
        let struct=await window.files.dir(node.data.path);
        resolve(this.resolveNode(struct));
      }
    },
    loadRemote(node,resolve){
      if(node.level===0) {
        //window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:''}});
      }else{
        window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:node.data.path}});
      }
      this.remoteResolve=resolve;
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
    },
    getRemoteFileStruct(){
      window.testWebrtc.channelSend('client2',{type:'file-struct-request',data:{base:''}});
    }

  }
}
</script>

<style scoped>
  .tree-card{
    height: 400px;
    overflow-y: auto
  }
</style>