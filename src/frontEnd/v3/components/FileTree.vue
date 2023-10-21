<template>
  <el-tree :props="treePropName" :data="treeData" ref="tree" default-expand-all :filter-node-method="filterNode" @nodeClick="onNodeClick">
    <template #default="{ node, data }">

      <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${node.id}`"><!--:data-node-id="`${data.id}`" :data-node-bsid="data.bsid" :id="`node_${node.id}`" :data-node-level="`${node.level}`"-->
              <span >
          <!--<el-text v-if="data.display">-->
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                    <el-icon v-if="data.type===4"><Box /></el-icon>
          <!--</el-text>-->
                <!-- <span class="node-text"><span><span style="background-color: #a5eecc">{{node.id}}</span>-{{ node.label }}</span></span>                -->
                 <el-popover placement="right-end" :width="500" trigger="hover"  effect="dark" :hide-after="100" popper-style="font-size:1px" :disabled="true">
                    <template #reference>
                        <span class="node-text"><span><span style="background-color: #a5eecc">{{node.id}}</span>-{{ node.label }}</span></span>
                    </template>
                    <template #default>
                      <span style="white-space: pre-wrap;font-size:10px">
                        {{JSON.stringify(data,(k,v)=>{
                        switch(k){
                          case 'children':return undefined;
                          case 'parent':return undefined;
                          case 'path':return v;
                          case 'type':return undefined;
                          case 'bsid':return v;
                          case 'name':return undefined;
                          case 'inZip':return v;
                          case 'level':return v;
                          case 'style':return v;
                          case 'rules':return Object.entries(v.ruleMap).reduce((o,e)=>({
                            ...o,
                            [e[0]]:e[1].map(s=>({
                              config: s.config.mode,
                              inherit:s.inherit,
                              through:s.config.through,
                              mapping:s.config.target,
                              source:s.nodes.source?.id,
                              target:s.nodes.target?.id,
                              match:s.nodes.match?.id,
                              root:s.nodes.root?.id,
                              merge:s.nodes.merge?.id,
                            }))
                          }),{});
                          /*case 'nodes':return {
                            source:v?.source?.id,
                            target:v?.target?.id,
                            match:v?.match?.id,
                            root:v?.root?.id,
                            merge:v?.merge?.id
                          };*/

                          /*case 'nodes':return v.map(n=>n.name);
                          case 'cur':return v.id;
                          case 'match':return v.id;
                          case 'children':return null;
                          case 'root':return v.id;
                          case 'origin':return v.id;
                          case 'target':return v&&v instanceof Array?Array.from(v).map(i=>i?.id):v;
                          case 'from': return v?({left:v?.left?.id,right:v?.right?.id}):v;*/

                          default:return v;
                        }
                      },4)}}
                      </span>
                    </template>
                  </el-popover>
                <span style="float: right;color: red" v-if="
                (data.rule&&data.rule.match&&data.rule.match.length>0&&data.rule.match[0].target)||
                (data.merge&&data.merge.mapping&&data.merge.mapping.rule.match&&data.merge.mapping.rule.match.length>0&&data.merge.mapping.rule.match[0].target)">
                  <el-icon><Switch/></el-icon>
                </span>
              </span>
      </div>

    </template>
  </el-tree>
</template>

<script>
import {Folder, FolderOpened, MessageBox, Files, Box, Switch} from "@element-plus/icons-vue";

export default {
  name: "FileTree",
  components: {Switch, Box, FolderOpened, Folder, MessageBox,Files},
  props:{
    treeData:{
      type:Array,
      default:[]
    },
    onTreeItemClass:{
      type:Function,
      default:(data,node)=>{}
    },
    filterNode:{
      type:Function,
      default:(param,data,node)=>{}
    },
    onRegisterNode:{
      type:Function,
      default:(node,data)=>{}
    }
  },

  data(){
    return {
      treePropName:{
        label: 'name',                //. label读 name字段
        isLeaf: 'leaf',                 //. 是否叶子读leaf字段
        children: 'children',
        class:this.onTreeItemClass
      }
    };
  },
  methods:{
    registerRef(node, data) {
      data.id = node.id;
      data.bsid = node.parent.data.bsid?(node.parent.data.bsid+'.'+node.id):(node.id+'');
      data.pid=node.parent.id;
      data.parent=node.parent;
      data.level=node.level;
      this.onRegisterNode(node,data);


      return `node_${node.id}`;
    },
    filter(param){
      return this.$refs.tree.filter(param);
    },
    getNode(id){
      return this.$refs.tree.getNode(id);
    },
    onNodeClick(data,node,tree,event){

    }
  }
}
</script>

<style scoped>
.diff-node{
  width: 100%;
  text-align: left;
  /*padding: 4px 0;*/
}

</style>