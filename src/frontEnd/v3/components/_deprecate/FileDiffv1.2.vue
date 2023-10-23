<template>
  <el-row>
    <el-col :span="9">
      <el-form>
        <el-form-item><el-switch active-text="无模式着色" inactive-text="模式着色" v-model="view.colorMode"></el-switch></el-form-item>
        <el-form-item>
          <el-checkbox :disabled="view.colorMode" v-model="view.colorMode1" label="全量同步"></el-checkbox>
          <el-checkbox :disabled="view.colorMode" v-model="view.colorMode3" label="增量同步"></el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox :disabled="view.colorMode" v-model="view.colorMode3" label="覆盖增量同步"></el-checkbox>
          <el-checkbox :disabled="view.colorMode" v-model="view.colorMode4" label="同步"></el-checkbox>
        </el-form-item>
      </el-form>

    </el-col>
    <el-col :span="6">
      <el-switch active-text="合并后" inactive-text="全部节点" v-model="view.midTreeFilterMode" @change="onFilterModeChange"></el-switch>
    </el-col>
    <el-col :span="9"></el-col>
  </el-row>
  <el-row>
    <!--
    <el-col :span="10">
      <div class="box left-scroll" :style="`height:${boxHeight}px`" @scroll="onLeftBoxScroll" ref="leftTreeBox">
        <el-tree :props="treePropName" :data="leftTree" ref="leftTree" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${data.id}`" :data-node-bsid="data.bsid" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="left.choose&&left.choosePath!==data.path">
                    {{left.choose?left.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>

    <el-col :span="2">
      <div style="height: 400px;">
        <canvas style="height: 100%;width: 100%" ref="canvas"></canvas>
      </div>
    </el-col>

    <el-col :span="10">
      <div class="box" :style="`height:${boxHeight}px`" @scroll="onRightBoxScroll" ref="rightTreeBox">
        <el-tree :props="treePropName" :data="rightTree" ref="rightTree" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${data.id}`" :data-node-bsid="data.bsid" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="right.choose&&right.choosePath!==data.path">
                    {{right.choose?right.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>
      -->
    <el-col :span="7">
      <div class="box left-scroll" :style="`height:${boxHeight}px`" @scroll="onLeftBoxScroll" ref="leftTreeBox">
        <el-tree :props="treePropName" :data="leftTree" ref="leftTree" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${data.id}`" :data-node-bsid="data.bsid" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="left.choose&&left.choosePath!==data.path">
                    {{left.choose?left.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>

    <el-col :span="2">
      <div style="height: 400px;">
        <canvas style="height: 100%;width: 100%" ref="canvas"></canvas>
      </div>
    </el-col>

    <el-col :span="6">
      <div class="box left-scroll" :style="`height:${boxHeight}px`" @scroll="" ref="midTreeBox">
        <el-tree :props="treePropName" :data="midTree" ref="midTree"  :filter-node-method="filterNode" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${data.id}`" :data-node-bsid="data.bsid" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
<!--                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="left.choose&&left.choosePath!==data.path">
                    {{left.choose?left.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>-->
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>

    <el-col :span="2">
      <div style="height: 400px;">
        <canvas style="height: 100%;width: 100%" ref="canvas1"></canvas>
      </div>
    </el-col>

    <el-col :span="7">
      <div class="box" :style="`height:${boxHeight}px`" @scroll="onRightBoxScroll" ref="rightTreeBox">
        <el-tree :props="treePropName" :data="rightTree" ref="rightTree" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${data.id}`" :data-node-bsid="data.bsid" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="right.choose&&right.choosePath!==data.path">
                    {{right.choose?right.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>

  </el-row>
  <el-row>
  <el-button @click="colors">colors</el-button>
  <el-button @click="leftTreeEl">leftTree</el-button>
  <el-button @click="draw">draw</el-button>
  <el-button @click="getRef">getRef</el-button>
  </el-row>
  <el-row>
    <el-col :span="24">
    <el-collapse accordion v-model="view.mergeConf.collapse">
      <el-collapse-item title="全局同步模式" name="5">
        <div>
          <el-form>
            <el-form-item>
              <el-radio-group v-model="treeMergeConf.coverActiveMode">
                <el-radio-button label="1">仅匹配规则路径生效</el-radio-button>
                <el-radio-button label="2">整个目录生效</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-select v-model="treeMergeConf.coverMode">
                  <el-option v-for="item in view.mergeConf.coverModeOptions" :key="item.value" :label="item.label" :value="item.value">
                    <el-popover placement="right-end" :width="200" trigger="hover" :content="item.desc" effect="dark" :hide-after="100">
                      <template #reference><div>{{item.label}}</div></template>
                    </el-popover>
                  </el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-item>
      <el-collapse-item name="1">
        <template #title>路径匹配</template>
        <div>
          <div class="merge-config-panel"><el-icon @click="addMergeConf(1)"><Plus /></el-icon></div>
          <div v-for="(item,idx) in treeMergeConf.cover.exact" class="merge-config-rule-item">
            <el-row :gutter="2">
            <el-col :span="18">
              <el-input v-model="item.value"/>
            </el-col>
            <el-col :span="6">
              <el-select v-model="item.type">
                <el-option v-for="item in view.mergeConf.coverModeOptions" :key="item.value" :label="item.label" :value="item.value"/>
              </el-select>
              <el-text>&nbsp;<el-icon @click="deleteMergeConf(1,idx,item)" style="color: red;cursor: pointer;"><Remove /></el-icon></el-text>
            </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="正则匹配" name="2">
        <div>
          <div class="merge-config-panel"><el-icon @click="addMergeConf(2)"><Plus /></el-icon></div>
          <div v-for="(item,idx) in treeMergeConf.cover.regex" class="merge-config-rule-item">
            <el-row :gutter="2">
              <el-col :span="18">
                <el-input v-model="item.value"/>
              </el-col>
              <el-col :span="6">
                <el-select v-model="item.type">
                  <el-option v-for="item in view.mergeConf.coverModeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
                <el-text>&nbsp;<el-icon @click="deleteMergeConf(2,idx,item)" style="color: red;cursor: pointer;"><Remove /></el-icon></el-text>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="忽略路径" name="3">
        <div>
          <div class="merge-config-panel"><el-icon @click="addMergeConf(3)"><Plus /></el-icon></div>
          <div v-for="(item,idx) in treeMergeConf.except.exact" class="merge-config-rule-item">
            <el-row :gutter="2">
              <el-col :span="18">
                <el-input v-model="item.value"/>
              </el-col>
              <el-col :span="6">
                <el-text>&nbsp;<el-icon @click="deleteMergeConf(3,idx,item)" style="color: red;cursor: pointer;"><Remove /></el-icon></el-text>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="忽略正则" name="4">
        <div>
          <div class="merge-config-panel"><el-icon @click="addMergeConf(4)"><Plus /></el-icon></div>
          <div v-for="(item,idx) in treeMergeConf.except.regex" class="merge-config-rule-item">
            <el-row :gutter="2">
              <el-col :span="18">
                <el-input v-model="item.value"/>
              </el-col>
              <el-col :span="6">
                <el-text>&nbsp;<el-icon @click="deleteMergeConf(4,idx,item)" style="color: red;cursor: pointer"><Remove /></el-icon></el-text>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="删除路径" name="6">
        <div>
          <div class="merge-config-panel"><el-icon @click="addMergeConf(6)"><Plus /></el-icon></div>
          <div v-for="(item,idx) in treeMergeConf.remove.exact" class="merge-config-rule-item">
            <el-row :gutter="2">
              <el-col :span="18">
                <el-input v-model="item.value"/>
              </el-col>
              <el-col :span="6">
                <el-text>&nbsp;<el-icon @click="deleteMergeConf(6,idx,item)" style="color: red;cursor: pointer;"><Remove /></el-icon></el-text>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="删除正则" name="7">
        <div>
          <div class="merge-config-panel"><el-icon @click="addMergeConf(7)"><Plus /></el-icon></div>
          <div v-for="(item,idx) in treeMergeConf.remove.regex" class="merge-config-rule-item">
            <el-row :gutter="2">
              <el-col :span="18">
                <el-input v-model="item.value"/>
              </el-col>
              <el-col :span="6">
                <el-text>&nbsp;<el-icon @click="deleteMergeConf(7,idx,item)" style="color: red;cursor: pointer"><Remove /></el-icon></el-text>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-item>



    </el-collapse>
    </el-col>

  </el-row>

</template>

<script>
import {Link, Files, Folder, FolderOpened, MessageBox, Plus, Remove} from "@element-plus/icons-vue";
import {detailedDiff} from "deep-object-diff";
import $ from "jquery";
import {list2map,recursiveTree,treeMap,treeLeaf,elTreeParent} from "@/frontEnd/v3/components/common/util";
import {ElMessage, ElMessageBox} from "element-plus";

const DRIVER=0;                 //' 驱动器
const DIRECTORY=1;          //' 文件夹
const FILE=2;                       //' 文件
const SYMBOL=3;               //' 软连接

export default {
  name: "FileDiff",
  components: {Remove, Plus, Files, Folder, FolderOpened, MessageBox,Link},
  data(){
    return {
      boxHeight:400,
      treeItemHeight:26,
      viewPortNodes:null,   //视窗可见节点数+2


      base: '',//D:/Note
      tree:[],
      midTree:[],
      leftTree:[
        {"type":0,"name":"C","label":"C","path":"C:/","display":true,"leaf":false,id:'abc'},
        {"type":0,"name":"D","label":"D","path":"D:/","display":true,"leaf":false,
          children: [{"type":1,"name":"$RECYCLE.BIN","label":"$RECYCLE.BIN","path":"D://$RECYCLE.BIN","display":true,"leaf":false,children: [{"type":2,"name":"1.jpg","label":"1.jpg","path":"D://$RECYCLE.BIN/1.jpg","display":true,"leaf":true},{"type":2,"name":"2.jpg","label":"2.jpg","path":"D://$RECYCLE.BIN/2.jpg","display":true,"leaf":true}]},{"type":1,"name":".temp","label":".temp","path":"D://.temp","display":true,"leaf":false,children:[{"type":1,"name":"t1","label":"t1","path":"D://.temp/t1","display":true,"leaf":false}]},
            {"type":2,"name":"1.jpg","label":"1.jpg","path":"D://1.jpg","display":true,"leaf":true},
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false,children:[{"type":1,"name":"v","label":"v","path":"D://Coding/Refer/v","display":true,"leaf":false,children:[{"type":1,"name":"f","label":"f","path":"D://Coding/Refer/v/f","display":true,"leaf":true}]}]},
                {"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false,children:[
                    {"type":2,"name":"abc.jpg","label":"abc.jpg","path":"D:/Coding/.config/abc.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc1.jpg","label":"abc1.jpg","path":"D:/Coding/.config/abc1.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc2.jpg","label":"abc2.jpg","path":"D:/Coding/.config/abc2.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc3.jpg","label":"abc3.jpg","path":"D:/Coding/.config/abc3.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc4.jpg","label":"abc4.jpg","path":"D:/Coding/.config/abc4.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc5.jpg","label":"abc5.jpg","path":"D:/Coding/.config/abc5.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc6.jpg","label":"abc6.jpg","path":"D:/Coding/.config/abc6.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc7.jpg","label":"abc7.jpg","path":"D:/Coding/.config/abc7.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc8.jpg","label":"abc8.jpg","path":"D:/Coding/.config/abc8.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc9.jpg","label":"abc9.jpg","path":"D:/Coding/.config/abc9.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc10.jpg","label":"abc10.jpg","path":"D:/Coding/.config/abc10.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc11.jpg","label":"abc11.jpg","path":"D:/Coding/.config/abc11.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc12.jpg","label":"abc12.jpg","path":"D:/Coding/.config/abc12.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc13.jpg","label":"abc13.jpg","path":"D:/Coding/.config/abc13.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc14.jpg","label":"abc14.jpg","path":"D:/Coding/.config/abc14.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc15.jpg","label":"abc15.jpg","path":"D:/Coding/.config/abc15.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc16.jpg","label":"abc16.jpg","path":"D:/Coding/.config/abc16.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc17.jpg","label":"abc17.jpg","path":"D:/Coding/.config/abc17.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc18.jpg","label":"abc18.jpg","path":"D:/Coding/.config/abc18.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc19.jpg","label":"abc19.jpg","path":"D:/Coding/.config/abc19.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc20.jpg","label":"abc20.jpg","path":"D:/Coding/.config/abc20.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc21.jpg","label":"abc21.jpg","path":"D:/Coding/.config/abc21.jpg","display":true,"leaf":true},
                  ]},
                {"type":1,"name":".config2","label":".config2","path":"D:/Coding/.config2","display":true,"leaf":false},
                {"type":1,"name":".config3","label":".config3","path":"D:/Coding/.config3","display":true,"leaf":false}
              ]},
            {"type":1,"name":".Game1","label":"Game1","path":"D:/Game1","display":true,"leaf":false,children: [    {"type":2,"name":".test","label":".test","path":"D:/Game1/.test","display":true,"leaf":true}]},
            {"type":1,"name":"Game","label":"Game","path":"D://Game","display":true,"leaf":false},{"type":1,"name":"Home","label":"Home","path":"D://Home","display":true,"leaf":false},{"type":1,"name":"Note","label":"Note","path":"D://Note","display":true,"leaf":false},{"type":1,"name":"Software","label":"Software","path":"D://Software","display":true,"leaf":false},
            //{"type":1,"name":"Test","label":"Test","path":"D://Test","display":true,"leaf":false,children:[{"type":1,"name":".config","label":".config","path":"D:/Test/.config","display":true,"leaf":false},{"type":1,"name":"a","label":"a","path":"D:/Test/a","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Test/Refer","display":true,"leaf":false}]},
            {"type":1,"name":"备份","label":"备份","path":"D://备份","display":true,"leaf":false},{"type":2,"name":"httpsbm.ruankao.org.cnsignup.txt","label":"httpsbm.ruankao.org.cnsignup.txt","path":"D://httpsbm.ruankao.org.cnsignup.txt","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214717.jpg","label":"Screenshot_20230201214717.jpg","path":"D://Screenshot_20230201214717.jpg","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214726.jpg","label":"Screenshot_20230201214726.jpg","path":"D://Screenshot_20230201214726.jpg","display":true,"leaf":true},{"type":2,"name":"微信图片_20220903142927.jpg","label":"微信图片_20220903142927.jpg","path":"D://微信图片_20220903142927.jpg","display":true,"leaf":true},
            {"type":2,"name":"报名照片.jpg","label":"报名照片.jpg","path":"D://报名照片.jpg","display":true,"leaf":true},
            {"type":2,"name":"2.jpg","label":"2.jpg","path":"D://2.jpg","display":true,"leaf":true},
            {"type":2,"name":"3.jpg","label":"3.jpg","path":"D://3.jpg","display":true,"leaf":true},
            {"type":2,"name":"4.jpg","label":"4.jpg","path":"D://4.jpg","display":true,"leaf":true},
            {"type":2,"name":"5.jpg","label":"5.jpg","path":"D://5.jpg","display":true,"leaf":true},
            {"type":2,"name":"6.jpg","label":"6.jpg","path":"D://6.jpg","display":true,"leaf":true},
            {"type":1,"name":"xxx","label":"xxx","path":"D://xxx","display":true,"leaf":false,
                children: [
                  {"type":1,"name":"aaa","label":"aaa","path":"D://xxx/aaa","display":true,"leaf":false,children:[{"type":2,"name":"2.jpg","label":"2.jpg","path":"D://2.jpg","display":true,"leaf":true}]},
                  {"type":1,"name":"bbb","label":"bbb","path":"D://xxx/bbb","display":true,"leaf":false,children:[{"type":2,"name":"3.jpg","label":"3.jpg","path":"D://3.jpg","display":true,"leaf":true}]},
                  {"type":1,"name":"ccc","label":"ccc","path":"D://xxx/cccc","display":true,"leaf":false,children:[{"type":2,"name":"4.jpg","label":"4.jpg","path":"D://4.jpg","display":true,"leaf":true}]},
                  {"type":1,"name":"ddd","label":"ddd","path":"D://xxx/ddd","display":true,"leaf":false,children:[{"type":2,"name":"5.jpg","label":"5.jpg","path":"D://5.jpg","display":true,"leaf":true}]},
                ]
            },
          ]
        }],
      rightTree:[
        {"type":0,"name":"C","label":"C","path":"C:/","display":true,"leaf":false},
        {"type":0,"name":"D","label":"D","path":"D:/","display":true,"leaf":false,expanded:true,
          children: [{"type":1,"name":"$RECYCLE.BIN","label":"$RECYCLE.BIN","path":"D://$RECYCLE.BIN","display":true,"leaf":false,children: [{"type":2,"name":"2.jpg","label":"2.jpg","path":"D://$RECYCLE.BIN/2.jpg","display":true,"leaf":true}]},{"type":1,"name":".temp","label":".temp","path":"D://.temp","display":true,"leaf":false,children:[{"type":1,"name":"t1","label":"t1","path":"D://.temp/t1","display":true,"leaf":false,children:[{"type":1,"name":"t11","label":"t11","path":"D://.temp/t1/t11","display":true,"leaf":true},]}]},
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false,children: [{"name":"abc5.jpg","label":"abc5.jpg","path":"D:/Coding/.config/abc5.jpg","display":true,"leaf":true,type:2}]},{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false,children:[{"type":1,"name":"v","label":"v","path":"D://Coding/Refer/v","display":true,"leaf":false,children:[{"type":1,"name":"f","label":"f","path":"D://Coding/Refer/v/f","display":true,"leaf":false,children:[{"type":1,"name":"h","label":"h","path":"D://Coding/Refer/v/f/h","display":true,"leaf":true}]},{"type":1,"name":"s","label":"s","path":"D://Coding/Refer/v/s","display":true,"leaf":true}]},{"type":1,"name":"t","label":"t","path":"D://Coding/Refer/t","display":true,"leaf":true}]}]},
            {"type":1,"name":"备份1","label":"备份1","path":"D://备份1","display":true,"leaf":false},
            {"type":1,"name":"Game","label":"Game","path":"D://Game","display":true,"leaf":false},{"type":1,"name":"Home","label":"Home","path":"D://Home","display":true,"leaf":false},{"type":1,"name":"Note","label":"Note","path":"D://Note","display":true,"leaf":false},{"type":1,"name":"Software","label":"Software","path":"D://Software","display":true,"leaf":false},
            {"type":1,"name":"Test","label":"Test","path":"D://Test","display":true,"leaf":false,children:[{"type":1,"name":".config","label":".config","path":"D:/Test/.config","display":true,"leaf":false},{"type":1,"name":"a","label":"a","path":"D:/Test/a","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Test/Refer","display":true,"leaf":false}]},
            {"type":1,"name":"备份","label":"备份","path":"D://备份","display":true,"leaf":false},{"type":2,"name":"httpsbm.ruankao.org.cnsignup.txt","label":"httpsbm.ruankao.org.cnsignup.txt","path":"D://httpsbm.ruankao.org.cnsignup.txt","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214717.jpg","label":"Screenshot_20230201214717.jpg","path":"D://Screenshot_20230201214717.jpg","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214726.jpg","label":"Screenshot_20230201214726.jpg","path":"D://Screenshot_20230201214726.jpg","display":true,"leaf":true},{"type":2,"name":"微信图片_20220903142927.jpg","label":"微信图片_20220903142927.jpg","path":"D://微信图片_20220903142927.jpg","display":true,"leaf":true},
            {"type":2,"name":"报名照片.jpg","label":"报名照片.jpg","path":"D://报名照片.jpg","display":true,"leaf":true},
            {"type":2,"name":"k.jpg","label":"k.jpg","path":"D://k.jpg","display":true,"leaf":true},
            {"type":1,"name":"xxx","label":"xxx","path":"D://xxx","display":true,"leaf":true,
              children: [
                {"type":2,"name":"ccc","label":"ccc","path":"D://xxx/cccc","display":true,"leaf":true},
                {"type":2,"name":"ddd","label":"ddd","path":"D://xxx/ddd","display":true,"leaf":true},
                {"type":2,"name":"aaa","label":"aaa","path":"D://xxx/aaa","display":true,"leaf":true},
                {"type":2,"name":"bbb","label":"bbb","path":"D://xxx/bbb","display":true,"leaf":true},
              ]
            },
          ]
        }],
      remoteTree:[],
      remoteResolve:null,


      view:{
        midTreeFilterMode:false,
        colorMode1:false,
        colorMode2:false,
        colorMode3:false,
        colorMode4:false,
        colorMode:true,
        colorRemove:true,
        colorExcept:true,
        colorIfChildEdit:true,

        mergeConf:{
          coverModeOptions:[
            {value:'1',label:'增量同步',desc:'不影响已有文件，只传输缺失'},
            {value:'2',label:'全量同步',desc:'完全复制所有数据，删除不受控的文件'},
            {value:'3',label:'覆盖增量同步',desc:'相同文件覆盖，传输新增文件，不删除不受控的文件'},
            {value:'4',label:'更新同步',desc:'仅仅更新相同文件，不传输新增文件，不删除不受控的文件'}
          ],
          collapse:'5'
        }
      },
      treeMergeConf:{
        coverMode:'1',
        coverActiveMode:"1",
        cover:{
          exact:[
            {value:'D:/Coding/Refer',type:'2'},
            {value:'D:/Coding/.config',type:'3'},
            {value:'D://$RECYCLE.BIN',type:'4'}
          ],
          regex:[
            {value:".*/3\\.jpg$",type:'2'},
            {value:".*/Coding$",type:'1'},
            //{value:".*/abc.*?\\.jpg$",type:'1'},
          ]
        },
        except:{
          exact:[
            {value:'D://1.jpg'},
            //{value:'D:/Coding/.config'},
          ],
          regex:[
            {value:".*/6\\.jpg$"}
          ]
        },
        remove:{
          exact:[
            {value:'D:/Test/.config'}
          ],
          regex:[
            {value:'httpsbm\.ruankao\.org\.cnsignup\.txt'}
          ]
        }
      },
      treePropName:{
        label: 'name',                //. label读 name字段
        isLeaf: 'leaf',                 //. 是否叶子读leaf字段
        children: 'children',
        class:(data,node)=>data.class||data.borderClass?data.class+' '+data.borderClass:''
      },
      diffs:{},
      difference:{},
      left:{
        scrollTimer:null,
        scrolling:false,
        choose:true,
        choosePath:'D://Coding',
        base:'',
        treeRefs:null
      },
      right:{
        scrollTimer:null,
        scrolling:false,
        choose:true,
        choosePath:'D://Test',
        base:'',
        treeRefs:null
      },

      canvas:{
        width:0,
        height:0,
      },
      styles:{
        node:{
          border:'3px solid ',
          add:{
            class:'node-add',
            fill:['#a5f77f63','#6bf75063','#3AED4663'],
            border:'rgba(21,128,30,0.25)',
            borderBottom:'2px solid '+'rgba(0,255,25,0.11)'
          },
          removed:{
            fill:['#eab4c675','rgba(229,130,162,0.42)','rgba(213,69,105,0.41)'],
            border:'rgba(217,175,175,0.72)',
            borderBottom:'2px solid '+'rgba(217,175,175,0.72)'
          },
          edit:{
            fill:['#D9D9D97C','#B4B4B47C','#9696967C'],
            border:'rgba(95,95,95,0.49)',
          },
          normal:'inherit'
        }
      },
      util:{
        //, 叶子节点覆盖
        onLeaf:function(type){
          return leaf=>leaf.type=leaf.type>type?type:leaf.type;
        },
        //, 自定义规则 构建节点
        buildLeaf:function(node,key,extraData,onLeaf,updateLeaf=false){
            return map=>{
              if (!node.bsid) return;
              if (!map[key]) map[key] = {};
              if(onLeaf){
                let leaf = treeLeaf(node.bsid, '.', map[key], 'children', 'value');
                if(leaf)return onLeaf(leaf);
              }
              if(updateLeaf)return;
              let value={path:node.path,bsid:node.bsid,...extraData};
              treeMap(node.bsid, value, '.', map[key], 'children', 'value');
            }
        },
        check:function (node,rules,match){
          let isMatch=false;
          for (let r of rules) {
            if (!r.test(node.path))continue;
            isMatch=true;
            match(r,node);
          }
          return isMatch;
        }
      },
      timer:null
    }
  },
  computed:{
    leftScroll(){
      return this.right.scrolling?null:this.onLeftBoxScroll
    },
    rightScroll(){
      return this.left.scrolling?null:this.onRightBoxScroll
    },
    compileRules(){  //.编译初始化自定义规则
      let {cover,except,remove}=this.treeMergeConf;

      let buildRegex=(list,build)=>{
        return list.map(item=>{
          let regex=new RegExp(item.value);
          return {test:(val)=>regex.test(val),...build(item,regex)};
        });
      };
      let buildEqual=(list,build)=>{
        return list.map(item=>{
          return {test:(val)=>item.value===val,...build(item)};
        });
      };

      return {
        cover:[
            ...buildRegex(cover.regex.filter(i=>i.type==='2'&&i.value),({value})=>({value,mode:'regex'})),
            ...buildEqual(cover.exact.filter(i=>i.type==='2'&&i.value),({value})=>({value,mode:'exact'}))
        ],
        increment:[
          ...buildRegex(cover.regex.filter(i=>i.type==='1'&&i.value),({value})=>({value,mode:'regex'})),
          ...buildEqual(cover.exact.filter(i=>i.type==='1'&&i.value),({value})=>({value,mode:'exact'}))
        ],
        incrementCover:[
          ...buildRegex(cover.regex.filter(i=>i.type==='3'&&i.value),({value})=>({value,mode:'regex'})),
          ...buildEqual(cover.exact.filter(i=>i.type==='3'&&i.value),({value})=>({value,mode:'exact'}))
        ],
        update:[
          ...buildRegex(cover.regex.filter(i=>i.type==='4'&&i.value),({value})=>({value,mode:'regex'})),
          ...buildEqual(cover.exact.filter(i=>i.type==='4'&&i.value),({value})=>({value,mode:'exact'}))
        ],
        except: [
          ...buildRegex(except.regex.filter(i=>i.value),rule=>({...rule,mode:'regex'})),
          ...buildEqual(except.exact.filter(i=>i.value),rule=>({...rule,mode:'exact'}))
        ],
        remove: [
          ...buildRegex(remove.regex.filter(i=>i.value),rule=>({...rule,mode:'regex'})),
          ...buildEqual(remove.exact.filter(i=>i.value),rule=>({...rule,mode:'exact'}))
        ]
      };
    },
    filterRules(){
      let filter=(key)=>{
        return (node,diff)=>{
          let leaf=treeLeaf(node.bsid, '.', diff[key], 'children', 'value');
          return leaf&&leaf.type<3;
        };
      };
      return {
        add: filter('add'),
        except: filter('except'),
        remove: filter('remove'),
        cover: filter('cover'),
        common:(node,diff)=>treeLeaf(node.bsid, '.', diff.common, 'children', 'value')
      }
    },
    customRules(){    //.自定义规则
      let util=this.util;
      let {increment,cover,except,remove,incrementCover,update}=this.compileRules;
      let conf=(key,rules,order)=>{
        return {
          compile(left,right,pLeft,pRight,side) {
            let node = side === 'left' ? left : right;
            let match = {regex:[],exact:[]};
            let isMatch=util.check(node,rules,rule=>match[rule.mode].push(rule.value));
            return {
              match: isMatch,
              child: true,
              parent: true,
              build: util.buildLeaf(node, key, {type:1,...match}, util.onLeaf(1), match.exact.length === 0 && match.regex.length === 0),
              buildChild: util.buildLeaf(node, key, {type:2,...match}, util.onLeaf(2), false),                                                                                           //子节点继承父节点规则，即使不匹配也要写入
              buildParent: util.buildLeaf(node, key, {type:3,...match}, util.onLeaf(3), match.exact.length === 0 && match.regex.length === 0)
            };
          },
          name:key,
          order
        };
      };
      return [
          conf('except',except,100),                                                   //例外
          conf('remove',remove,101),                                                //删除
          conf('update',update,102),                                                 //更新
          conf('increment',increment,103),                                       //增量
          conf('incrementCover',incrementCover,104),                    //增量覆盖
          conf('cover',cover,105),                                                       //全量
      ];
    },
    rules() { //.固有规则
      let util=this.util;
      let build=(node,key,extraData)=>{
        return map=> {
          if (!node.bsid)return;
          if (!map[key]) map[key] = {};
          let value={path:node.path,bsid:node.bsid,...extraData};
          treeMap(node.bsid, value, '.', map[key], 'children', 'value');
        };
      };
      let add={
        compile(left,right,pLeft,pRight,side){
          let node=side==='left'?left:right;
          return {
            match: side==='left'?left&&(!right):right&&(!left),
            child: true,
            parent: false,
            build:util.buildLeaf(node,'add',{type:1}),
            buildChild:util.buildLeaf(node,'add',{type:2}),
            buildParent:util.buildLeaf(node,'add',{type:3})
          };
        },
        name:'add',
        order:0
      };
      let common={
        compile(left,right,pLeft,pRight,side){
          let node=side==='left'?left:right;
          return {
            match: left&&right,
            child: false,
            parent: true,
            build:util.buildLeaf(node,'common',{type:1}),
            buildChild:util.buildLeaf(node,'common',{type:2}),
            buildParent:util.buildLeaf(node,'common',{type:3})
          };
        },
        name:'common',
        order:1
      };
      return [add,common];
    }

  },
  mounted() {
    this.diffs=this.diff(
        {id:0,children:this.leftTree},
        {id:0,children:this.rightTree},null,null,
        true,false);                                                                          //初始化对比
    this.viewPortNodes=(this.boxHeight/this.treeItemHeight)+2;                //初始化可视节点数
    let change=this.buildDrawStruct();
    this.drawDiff(change);

    let diffs={left:{},right:{}};
    this.findDiff(diffs,{id:0,bsid:'',children:this.leftTree}, {id:0,bsid:'',children:this.rightTree},null,null,[...this.rules,...this.customRules],{left: new Set(),right:new Set()});
    this.difference=diffs;
    console.log(diffs);

    let midTree={};
    this.mergeTree(this.leftTree,'left',midTree);
    this.mergeTree(this.rightTree,'right',midTree);
    this.midTree=midTree.children;
    console.log(midTree);

    console.log('==');

    this.$nextTick(()=>{
      let left=this.visibleNode(this.$refs.leftTreeBox,this.$refs.leftTree);
      let mid=this.visibleNode(this.$refs.midTreeBox,this.$refs.midTree);
      let right=this.visibleNode(this.$refs.rightTreeBox,this.$refs.rightTree);

      console.log(this.buildDrawStructs(left,mid,this.difference.left));
    });



    let leaf = treeLeaf('2.7.12.13', '.', diffs.left.add, 'children', 'value');
    //console.log(leaf);
    //this.read();
    /*window.files.onFileStructReply(function(struct){
      _this.remoteResolve(_this.resolveNode(struct));
    });*/
    //this.compareTree();

 /*   let type=false;
    this.timer=setInterval(()=>{
      $(_this.$refs.leftTreeBox).animate({ scrollTop:type?0: 1273 }, {duration: 2000,queue:false});
      type=!type;
    },5000);*/

  },
  beforeUnmount(){
    clearInterval(this.timer);
  },
  methods:{
    addMergeConf(type){
      let filters=(arr)=>arr.some(i=>!i.value);
      let arr;
      switch (type){
        case 1:arr=this.treeMergeConf.cover.exact;break;
        case 2:arr=this.treeMergeConf.cover.regex;break;
        case 3:arr=this.treeMergeConf.except.exact;break;
        case 4:arr=this.treeMergeConf.except.regex;break;
        case 6:arr=this.treeMergeConf.remove.exact;break;
        case 7:arr=this.treeMergeConf.remove.regex;break;
      }
      if(filters(arr)){
        return ElMessage.error('请先填完前面留空规则');
      }
      arr.push({value:'',type:this.treeMergeConf.coverMode});
    },
    deleteMergeConf(type,idx,item){
      let arr;
      switch (type){
        case 1:arr=this.treeMergeConf.cover.exact;break;
        case 2:arr=this.treeMergeConf.cover.regex;break;
        case 3:arr=this.treeMergeConf.except.exact;break;
        case 4:arr=this.treeMergeConf.except.regex;break;
        case 6:arr=this.treeMergeConf.remove.exact;break;
        case 7:arr=this.treeMergeConf.remove.regex;break;
      }
      //arr.splice(arr.indexOf(item),1);
      arr.splice(idx,1);
    },


    //,render
    //.初始化节点数据
    registerRef(node, data) {
      data.id = node.id;
      data.bsid = node.parent.data.bsid?(node.parent.data.bsid+'.'+node.id):(node.id+'');
      data.pid=node.parent.id;
      data.level=node.level;
      return `node_${node.id}`;
    },


    async load(node,resolve){
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
    },
    loadRemote(node,resolve){
      if(node.level===0) {
        //window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:''}});
      }else{
        window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:node.data.path}});
      }
      this.remoteResolve=resolve;
    },
    getRemoteFileStruct(){
      window.testWebrtc.channelSend('client2',{type:'file-struct-request',data:{base:''}});
    },

    chooseLeft(event,data,node){
      console.log(node);
      event.stopPropagation();
      if(this.left.choose&&this.left.choosePath!==data.path)return;

      if(!this.left.choose){
        this.left.choose=true;
        this.left.choosePath=data.path;
      }else{
        this.left.choose=false;
        this.left.choosePath='';
      }
      if([FILE,SYMBOL].includes(data.type))return;
      node.expand();
      //node.expanded=true;
    },
    chooseRight(event,data,node){
      event.stopPropagation();
      if(this.right.choose&&this.right.choosePath!==data.path)return;

      if(!this.right.choose){
        this.right.choose=true;
        this.right.choosePath=data.path;
      }else{
        this.right.choose=false;
        this.right.choosePath='';
      }
      if([FILE,SYMBOL].includes(data.type))return;
      node.expand();
      //node.expanded=true;
    },

   //%v2
    onFilterModeChange(type){
      this.$refs.midTree.filter(type);
    },
    filterNode(type,data,node){
      if(!type)return true;
      if(!node.parent.visible)return false;

      let ignore=data.left&&this.filterRules.except(data.left, this.difference.left);
      let remove=data.right&&this.filterRules.remove(data.right, this.difference.right);
      if(!data.right&&ignore)return false;
      if(!data.left&&remove)return false;
      if(data.left&&data.right&&ignore&&remove)return false;

      //右新增节点-如果匹配到左边全量匹配则 需要过滤
      if(!data.left) {
        let pLeftNode = elTreeParent(node, (node) => node.data.left);
        if (pLeftNode && this.filterRules.cover(pLeftNode.data.left, this.difference.left)) return false;
      }

      return true;
    },
    coloring(struct){
      let starts=struct.filter(i=>!i.pre&&i.type);

      let canvas=this.$refs.canvas;
      let ctx=canvas.getContext('2d');
      let parent=canvas.parentElement;
      canvas.width=parent.clientWidth;
      canvas.height=parent.clientHeight;
      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
      //ctx.lineWidth=1;
      let leftTree=this.$refs.leftTree;
      let midTree=this.$refs.midTree;

      let radius=35;
      let borderBottomStyle='3px solid ';
      let addFill=this.styles.node.add.fill;

      let color={
        updated:['rgba(223,163,114,0.57)','rgba(174,119,73,0.71)','rgba(134,79,37,0.72)'],
        increment:['rgba(163,223,114,0.76)','rgba(85,174,73,0.74)','rgba(60,134,37,0.67)'],
        incrementCover:['rgba(114,223,201,0.8)','rgba(73,174,164,0.86)','rgba(37,134,129,0.76)'],
        cover:['rgba(114,149,223,0.64)','rgba(73,105,174,0.73)','rgba(37,68,134,0.74)'],
        except:['rgba(223,214,114,0.69)','rgba(174,150,73,0.78)','rgba(134,90,37,0.7)'],
        remove:['rgba(223,114,114,0.6)','rgba(174,73,73,0.7)','rgba(134,37,37,0.76)'],
      }

      let idx=0;
      for(let i of starts){
          let j =i;
          let height=1;
          while(j.next)height++;

          //bundle.levelChange?++idx:(idx=0);
          let index=idx%addFill.length;
          let style=color[i.type][index];                                                                //循环取色值

          ctx.strokeStyle=style;
          ctx.fillStyle=style;

          let left1={x:-1,y:bundle.y};                                                                    //-1延申到不可视区域 防止最后闭合曲线导致留下边框
          let left2={x:-1,y:bundle.y+bundle.node.length*this.treeItemHeight};
          let right1={x:parent.clientWidth,y:value.right.y+this.treeItemHeight};

          ctx.beginPath();
          ctx.moveTo(left1.x, left1.y);
          ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y-2);
          ctx.bezierCurveTo(right1.x-radius,right1.y,left2.x+radius+10,left2.y,left2.x,left2.y);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();




      }
    },
    buildDrawStructs(leftTree,midTree,leftDiff){

     /* let map={__first:null};

      let stack=[],pointer=-1;
      let level=0;

      let find=(node,key)=>treeLeaf(node.bsid,'.',leftDiff[key],'children','value');
      let is=leaf=>leaf&&leaf.type<3;

      let curNode;
      let link=(id,bsid,rule,y,level,type)=>{

        if(!curNode)
          curNode=map[id]={[type]:{y,id,rule,level}};
        else
          curNode.next=map[id]={pre:curNode,[type]:{y,rule,id,level}};

        let bsids=bsid.split('.');
        if(bsids.length<2)return;
        for(let idx=0;idx<bsids.length-1;++idx){
          let b=bsids[idx];
          let o=map[b];
          if(!o){
            o=map[b]={link:[]};
          }
          if(!o.link)o.link=[];
          o.link.push(id);
        }
      }


      for (let node of midTree) {
        let item = node.data.left;
        if (!item) continue;
        let id=item.id;
        let bsid=item.bsid;

        //.node类型
        let except = find(item, 'except');
        let remove = find(item, 'remove');
        let update = find(item, 'update');
        let increment = find(item, 'increment');
        let incrementCover = find(item, 'incrementCover');
        let cover = find(item, 'cover');
        let rule;
        if (is(except)) rule = 'except';
        else if (is(remove)) rule = 'remove';

        let pre = stack[pointer];
        let preRule = pre ? pre.rule : null;

        if (!rule && (!preRule || (preRule !== 'except' && preRule !== 'remove'))) {
          if (is(update)) rule = 'update';
          else if (is(increment)) rule = 'increment';
          else if (is(incrementCover)) rule = 'incrementCover';
          else if (is(cover)) rule = 'cover';
        }

        if(rule){
          if(!pre){
            level=node.level;
            stack[++pointer]={level:node.level,rule};
            link(id,bsid,rule,node.y,node.level,'right');
          }
          else{
            if(node.level>=pre.level){
              if(level>node.level){
                curNode=null;
              }
              link(id,bsid,rule,node.y,node.level,'right');
              level=node.level;
            }else{
              let p=pointer
              while(pointer>0&&stack[p].level>node.level){
                --pointer;
              }
              stack[++pointer]={level:node.level,rule};
              link(id,bsid,rule,node.y,node.level,'right');
            }
          }
        }else{
          if(!pre){

          }
          else{
            if(node.level<pre.level){
              let p=pointer
              while(pointer>0&&stack[p].level>node.level){
                --pointer;
              }
              link(id,bsid,preRule,node.y,node.level,'right');
            }else{
              link(id,bsid,preRule,node.y,node.level,'right');
            }
          }
        }
      }


      stack=[];
      pointer=-1;
      level=0;
      for(let item of leftTree){

      }

      return map;*/

      //. {left:{start,end},right:{start,end}}

  
      
      let map={},curNode;
      let stack = [], pointer = -1;                  //覆盖规则栈
      let level = 0;                                      //相同规则匹配到的最后节点层级
      let side='right';

      let find=(node,key)=>treeLeaf(node.bsid,'.',leftDiff[key],'children','value');
      let is=leaf=>leaf&&leaf.type<3;
      let parents=(id,bsid)=>{
        let bsids=bsid.split('.');
        if(bsids.length<2)return;
        for(let idx=0;idx<bsids.length-1;++idx){
          let b=bsids[idx];
          let o=map[b];
          if(!o){
            o=map[b]={link:[]};
          }
          if(!o.link)o.link=[];
          o.link.push(id);
        }
      }
      let link=(linkLast)=>{
        return linkLast?
            (id,bsid,rule,y,level,side,render=true)=>{
              let o=map[id];
              o=o||{};
              o[side]={y,rule,id,level,render};
              o.pre=curNode;
              o.rule=rule;
              if(curNode)curNode.next=o;
              curNode=o;
              map[id]=o;
              if(render) parents(id,bsid);
            }:
            (id,bsid,rule,y,level,side,render=true)=>{
              curNode=map[id]={[side]:{y,id,rule,level,render}};
              curNode.rule=rule;
              if(render) parents(id,bsid);
            };
      }
      
      for (let item of midTree) {
        let node=item.data.left;
        if (!node) continue;

        let except = find(node, 'except');
        let remove = find(node, 'remove');
        let update = find(node, 'update');
        let increment = find(node, 'increment');
        let incrementCover = find(node, 'incrementCover');
        let cover = find(node, 'cover');
        let rule;
        if (is(except)) rule = 'except';
        else if (is(remove)) rule = 'remove';

        let pre = stack[pointer];
        let preRule = pre ? pre.rule : null;

        if (!rule && (!preRule || (preRule !== 'except' && preRule !== 'remove'))) {
          if (is(update)) rule = 'update';
          else if (is(increment)) rule = 'increment';
          else if (is(incrementCover)) rule = 'incrementCover';
          else if (is(cover)) rule = 'cover';
        }


        if (rule) {                                                                                                   //匹配到规则
          if (preRule) {
            if (rule === preRule) {                                                                       //当前节点规则与最后一个覆盖规则相同
              if(pre.level>item.level){                                                                   //当前节点规则超出父节点规则
                while (pointer > 0 && stack[pointer].level >= item.level) {
                  --pointer;
                }
                level=item.level;
                stack[++pointer]={level:item.level,rule};
                link(true)(node.id,node.bsid,rule,item.y,item.level,side);
              }else{
                if (level > item.level) {                                                                  //相同规则但层级超过最后节点层级
                  level=item.level;
                  link(true)(node.id,node.bsid,rule,item.y,item.level,side);
                }
                else {                                                                                               //继续下探
                  level=item.level;
                  link(false)(node.id,node.bsid,rule,item.y,item.level,side);
                }
              }
            } else {                                                                                                 //新规则节点
              if(pre.level>item.level){                                                                   //新规则节点超出父节点规则
                while (pointer > 0 && stack[pointer].level >= item.level) {
                  --pointer;
                }
                level=item.level;
                stack[++pointer]={level:item.level,rule};
                link(true)(node.id,node.bsid,rule,item.y,item.level,side);
              }
              else{                                                                                                   //新规则节点层级在父节点下
                level=item.level;
                stack[++pointer]={level:item.level,rule};
                link(true)(node.id,node.bsid,rule,item.y,item.level,side);
              }
            }
          } else {                                                                                                  //无前节点规则
            level=item.level;
            stack[++pointer]={rule,level:item.level};
            link(true)(node.id,node.bsid,rule,item.y,item.level,side);
          }
        } else if (pointer > 0) {
          if(pre.level>item.level){
            while (pointer > 0 && stack[pointer].level >item.level) {              //.保留最后一个规则（相同层级）
              --pointer;
            }
            if(pointer>0){                                                                                  //有父规则
              link(true)(node.id,node.bsid,stack[pointer].rule,item.y,item.level,side);
              level=item.level;
            }else{
              link(true)(node.id,node.bsid,null,item.y,item.level,side,false)                                                                //.仅挂载 不绘制;
              level=item.level;
            }
          }
          else{                                                                                                       //有父规则-继承
            link(true)(node.id,node.bsid,stack[pointer].rule,item.y,item.level,side);
            level=item.level;
          }
        } else {
          link(true)(node.id,node.bsid,rule,item.y,item.level,side,false)                                                                //.仅挂载 不绘制;
          level=item.level;
        }
      }

      curNode=null;
      stack = [], pointer = -1;                  //覆盖规则栈
      level = 0;                                      //相同规则匹配到的最后节点层级
      side='left';
      find=()=>{};
      let unLink=(node)=>{
        curNode=node;
        if(node.pre)node.pre.next=null;
        node.pre=null;
      }
      let relate=(node,side,y)=>{
        if(node.link){
          for(let i of node.link){
            if(!map[i][side]){
              map[i][side]={y};
              continue;
            }
            if(map[i][side].y===null||map[i][side].y===undefined){
              map[i][side].y=y;
              continue;
            }
            let _y=map[i][side].y;
            if(y>_y)map[i][side].y=y;
          }
        }

      }


      for(let item of leftTree){

        let except = find(item, 'except');
        let remove = find(item, 'remove');
        let update = find(item, 'update');
        let increment = find(item, 'increment');
        let incrementCover = find(item, 'incrementCover');
        let cover = find(item, 'cover');
        let rule;
        if (is(except)) rule = 'except';
        else if (is(remove)) rule = 'remove';

        let pre = stack[pointer];
        let preRule = pre ? pre.rule : null;

        if (!rule && (!preRule || (preRule !== 'except' && preRule !== 'remove'))) {
          if (is(update)) rule = 'update';
          else if (is(increment)) rule = 'increment';
          else if (is(incrementCover)) rule = 'incrementCover';
          else if (is(cover)) rule = 'cover';
        }

        let node=map[item.id];

        if (rule) {                                                                                                   //匹配到规则
          if (preRule) {
            if (rule === preRule) {                                                                       //当前节点规则与最后一个覆盖规则相同
              if(pre.level>item.level){                                                                   //当前节点规则超出父节点规则
                while (pointer > 0 && stack[pointer].level >= item.level) {
                  --pointer;
                }
                level=item.level;
                stack[++pointer]={level:item.level,rule};

                if(node){
                  unLink(node);
                  relate(node,side,item.y);
                }else{
                  link(true)(item.id,item.bsid,rule,item.y,item.level,side);
                }
              }else{
                if (level > item.level) {                                                                  //相同规则但层级超过最后节点层级
                  level=item.level;
                  if(node){
                    unLink(node);
                    relate(node,side,item.y);
                  }else {
                    link(true)(item.id, item.bsid, rule, item.y, item.level, side);
                  }
                }
                else {                                                                                               //继续下探
                  level=item.level;
                  link(false)(item.id,item.bsid,rule,item.y,item.level,side);
                }
              }
            } else {                                                                                                 //新规则节点
              if(pre.level>item.level){                                                                   //新规则节点超出父节点规则
                while (pointer > 0 && stack[pointer].level >= item.level) {
                  --pointer;
                }
                level=item.level;
                stack[++pointer]={level:item.level,rule};
                if(node){
                  unLink(node);
                  relate(node,side,item.y);
                }else {
                  link(true)(item.id, item.bsid, rule, item.y, item.level, side);
                }
              }
              else{                                                                                                   //新规则节点层级在父节点下
                level=item.level;
                stack[++pointer]={level:item.level,rule};
                if(node){
                  unLink(node);
                  relate(node,side,item.y);
                }else {
                  link(true)(item.id, item.bsid, rule, item.y, item.level, side);
                }
              }
            }
          } else {                                                                                                  //无前节点规则
            level=item.level;
            stack[++pointer]={rule,level:item.level};
            if(node){
              unLink(node);
              relate(node,side,item.y);
            }else {
              link(true)(item.id, item.bsid, rule, item.y, item.level, side);
            }
          }
        } else if (pointer > 0) {
          if(pre.level>item.level){
            while (pointer > 0 && stack[pointer].level >item.level) {              //.保留最后一个规则（相同层级）
              --pointer;
            }
            if(pointer>0){                                                                                  //有父规则
              if(node){
                unLink(node);
                relate(node,side,item.y);
              }else {
                link(true)(item.id, item.bsid, stack[pointer].rule, item.y, item.level, side);
              }
              level=item.level;
            }else{
              if(node){
                unLink(node);
                relate(node,side,item.y);
              }else {
                link(true)(item.id, item.bsid, null, item.y, item.level, side, false)                                                                //.仅挂载 不绘制;
              }
              level=item.level;
            }
          }
          else{                                                                                                       //有父规则-继承
            if(node){
              unLink(node);
              relate(node,side,item.y);
            }else {
              link(true)(item.id, item.bsid, stack[pointer].rule, item.y, item.level, side);
            }
            level=item.level;
          }
        } else {
          if(node){
            unLink(node);
            relate(node,side,item.y);
          }else {
            link(true)(item.id, item.bsid, rule, item.y, item.level, side, false)                                                                //.仅挂载 不绘制;
          }
          level=item.level;
        }
      }

      return map;
    },
    visibleNode(treeBoxRef,treeRef){
      let start=Math.floor(treeBoxRef.scrollTop/this.treeItemHeight)-1;       //可视起始项坐标
      start=start<0?0:start;
      let origin=start*this.treeItemHeight-treeBoxRef.scrollTop;                         //绘图起始点作为绘图坐标原点y （滚动节点一半情况）
      return $(treeBoxRef)
          .find(".diff-node:visible")
          .toArray()
          .splice(start,this.viewPortNodes)
          .map((n,idx)=>{
            let node=treeRef.getNode(n.dataset.nodeId);
            return {
              node,
              data:node.data,
              bsid: node.data.bsid,
              e: n,
              y: origin + this.treeItemHeight * idx,    //起始y
              id: node.id,
              level: node.level
            }
          });
    },
    //, 构建合并树
    //[except],[remove]
    mergeTree(tree,from,map){
      for(let node of tree){
        recursiveTree(
            node,
            'children',
            ({path,bsid,type,label,name,display,id},pNode,pVal)=>{
              if(pVal.children){
                let nodes=pVal.children.filter(i=>i.path===path);
                if(nodes.length>0){
                  nodes[0][from]={path,bsid,type,name,id,arr:bsid.split('.')}
                  return nodes[0];
                }
              }else{
                pVal.children=[];
              }
              let child={from,path,bsid,type,label,name,display,[from]:{path,bsid,type,name,id,arr:bsid.split('.')}};
              pVal.children.push(child);
              return child;
            },
            null,
            map
        );
      }
    },



    //, 对比两棵树 初始化节点关系
    findDiff(diffs,leftNode,rightNode,pLeftNode,pRightNode,rules,parentRules={left: new Set(),right: new Set()}){
      let leftMap = leftNode?list2map(leftNode.children,'path'):{};
      let rightMap = rightNode?list2map(rightNode.children,'path'):{};
      let curRules={left:new Set(),right:new Set()};

      for(let entry of Object.entries(leftMap)) {
        let path = entry[0];
        let left = entry[1];
        let right=rightMap[path];
        let subRules={left:new Set(parentRules.left),right:new Set(parentRules.right)};  //子节点覆盖的规则
        //. 左节点构建父节点传递子节点规则
        for(let rule of parentRules.left){
          rule.compile(left,right,leftNode,rightNode,'left').buildChild(diffs.left);
        }
        //. 左节点构建自身匹配规则
        for(let ruleBuilder of rules){
          let rule=ruleBuilder.compile(left,right,leftNode,rightNode,'left');
          if(!rule.match)continue;

          rule.build(diffs.left);

          if(rule.child){
            subRules.left.add(ruleBuilder);
          }
          if(rule.parent){
            curRules.left.add(ruleBuilder);
          }
        }
        let matchSubRules=this.findDiff(diffs,left,right,leftNode,rightNode,rules, subRules);//. 遍历所有左新增，共同节点
        matchSubRules.left.forEach(s=>{
          s.compile(leftNode,rightNode,pLeftNode,pRightNode,'left').buildParent(diffs.left);
          curRules.left.add(s)
        });
        matchSubRules.right.forEach(s=>{
          s.compile(leftNode,rightNode,pLeftNode,pRightNode,'right').buildParent(diffs.right);
          curRules.right.add(s)
        });
      }

      for(let entry of Object.entries(rightMap)) {
        let subRules={left:new Set(parentRules.left),right:new Set(parentRules.right)};  //子节点覆盖的规则
        let right = entry[1];
        //. 右节点构建父节点传递子节点规则
        for(let rule of parentRules.right){
          rule.compile(leftMap[entry[0]],right,leftNode,rightNode,'right').buildChild(diffs.right);
        }
        //. 右节点构建父节点传递子节点规则
        for(let ruleBuilder of rules){
          let rule=ruleBuilder.compile(leftMap[entry[0]],right,leftNode,rightNode,'right');
          if(!rule.match)continue;

          rule.build(diffs.right);

          if(rule.child){//右新增节点
            subRules.right.add(ruleBuilder);
          }
          if(rule.parent){
            curRules.right.add(ruleBuilder);
          }
        }
        if(!leftMap[entry[0]]){//. 遍历右新增节点
          let matchSubRules=this.findDiff(diffs,null,right,leftNode,rightNode,rules, subRules);
          matchSubRules.right.forEach(s=>{
            s.compile(leftNode,rightNode,pLeftNode,pRightNode,'right').buildParent(diffs.right);
            curRules.right.add(s)
          });
        }
      }

      return curRules;
    },

    //%v1
    onLeftBoxScroll(){
      let change=this.buildDrawStruct();
      this.drawDiff(change);

      if(this.right.scrolling)return;
      this.left.scrolling=true;

      if(change.firstCommon.left){
        let node=this.$refs.leftTree.getNode(change.firstCommon.left.id);
        let common=this.diffs.common[node.data.path];
        let e=$(this.$refs.rightTree.$el).find(`[data-node-id=${common.r_id}]`)[0];

        this.$refs.rightTreeBox.scrollTo({top: e.offsetTop - change.firstCommon.left.y-5});//behavior: 'smooth' 会导致一直左右滚动
        clearTimeout(this.left.scrollTimer);
        this.left.scrollTimer = setTimeout(() => this.left.scrolling = false, 50);
      }
    },
    onRightBoxScroll(){
      let change=this.buildDrawStruct();
      this.drawDiff(change);

      if(this.left.scrolling)return;
      this.right.scrolling=true;

      if(change.firstCommon.right){
        let node=this.$refs.rightTree.getNode(change.firstCommon.right.id);
        let common=this.diffs.common[node.data.path];
        let e=$(this.$refs.leftTree.$el).find(`[data-node-id=${common.l_id}]`)[0];
        this.$refs.leftTreeBox.scrollTo({top: e.offsetTop - change.firstCommon.right.y-5});
        clearTimeout(this.right.scrollTimer);
        this.right.scrollTimer = setTimeout(() => this.right.scrolling = false, 50);
      }

    },
    buildDrawStruct(){
      let leftNodes=this.findBoxVisibleNode(this.$refs.leftTreeBox);
      let rightNodes=this.findBoxVisibleNode(this.$refs.rightTreeBox);   //{id,e,y,level}
      let change= {
        add: {                                                                                                        //' 左新增
          __set:new Set(),                                                                                     //change.add渲染顺序
//        r_pid: {                                                                                                  //r_pid 左新增节点的父节点对应的右节点id，e为dom，y为起始y坐标，levelChange是否树层次变化，用于区分连续多个不同层次的新增节点
//             link,
//             left:[{node:[{e,l_id}],y,levelChange}],                                             //r_pid对应左列表多组新增节点
//             right:{y,e}                                                                                        //左新增父节点对应的右节点
//        }
        },
        addLink:{

        },
        leftEdit:{                                                                                                  //' 左编辑节点（临时）
//          r_id:{l_id,e,y,levelChange,next,delay}                                                //r_id 左编辑节点对应右编辑节点id，l_id为左节点id,e为dom，y左编辑节点起始y坐标，levelChange是否层级变化，next下一个r_id，delay如果左右编辑节点同时可视，需要渲染成同一背景色，因此左边不着色，右边循环时着色
        },
        rightEdit:[                                                                                               //' 右编辑节点
//         {
//            left:{node:[{e,l_id}],y},                                                                      //左边组，e:dom,y:左起始y坐标
//            right:{node:[e,r_id],y}                                                                       //右边组，e:dom,y:右起始y坐标
//         }
        ],
        firstCommon: {                                                                                       //'左列表第一个共同节点或编辑节点
//          left:{e,id,y},                                                                                         //左边列表滚动用
//          right:{e,id,y}                                                                                       //右边列表滚动用
        },
        common: {                                                                                              //' 相同节点或编辑节点（临时）用于右边遍历
//         l_id:{e,y}                                                                                              //l_id左边id，对应e,y
        },
        removed:[                                                                                               //' 右新增
//         {
//           right:{node:[{e,r_id}],y},                                                                    //右边对应的一组e,y
//           left:{e,y,l_pid},                                                                                   //右边组父节点对应的左节点e,y
//           levelChange                                                                                     //左列表是否层级变化||右列表是否层级变化
//         }
        ]
      };
      const {add,leftEdit,common,rightEdit,removed,firstCommon,addLink}=change;

      let type;           //上一个列表项类型
      let level;          //上一个列表项层级
      let p_r_id;        //上一个左编辑列表项对应右边列表项id，用于链表
      let next;           //上一个左编辑节点指向的下个节点，用于右列表判断是否需要分开渲染

      for(let left of leftNodes){
        let diffItem;
        if((diffItem=this.diffs.add[left.id])){                                                       //,左新增
          let {r_pid}=diffItem;
          let bundle=add[r_pid];
          if(!bundle){
            let set=this.getParents('right',r_pid);
            for(let p of set){
              if(!addLink[p]){
                addLink[p]={to:new Set()};
              }
              addLink[p].to.add(r_pid);
            }
            bundle=add[r_pid]={left: [], right: {}};
          }
          if(type!=='add'){
            bundle.left.push({node:[{e:left.e,l_id:left.id}],y:left.y,levelChange:false});
            level=left.level;
          }else if(level>left.level){
            bundle.left.push({node:[{e:left.e,l_id:left.id}],y:left.y,levelChange:true});
            level=left.level;
          }else{
            bundle.left[bundle.left.length-1].node.push({e:left.e,l_id:left.id});
          }
          add.__set.add(r_pid);
          type='add';
        }else if((diffItem=this.diffs.edit[left.id])){                                              //, 左编辑
          if(type!=='edit'){
            leftEdit[diffItem.r_id]={l_id:left.id,e:left.e,y:left.y,levelChange:false};
            level=left.level;
          }else if(level>=left.level){
            leftEdit[diffItem.r_id]={l_id:left.id,e:left.e,y:left.y,levelChange:true};
            level=left.level;
          }else{
            leftEdit[diffItem.r_id]={l_id:left.id,e:left.e,y:left.y,levelChange:false};
            leftEdit[p_r_id].next=diffItem.r_id;
          }
          if(!firstCommon.left){
            firstCommon.left={e:left.e,id:left.id,y:left.y};
          }
          common[left.id]={e:left.e,y:left.y,l_id:left.id};
          p_r_id=diffItem.r_id;
          type='edit';
        }else{                                                                                                       //,相同
          if(!firstCommon.left){
            firstCommon.left={e:left.e,id:left.id,y:left.y};
          }
          common[left.id]={e:left.e,y:left.y,l_id:left.id};
          level=null;
          type='common';
        }
      }
      type=null;
      level=null;
      for(let right of rightNodes){
        let diffItem;
        let diffParent;
        if((diffParent=change.addLink[right.id])){
          for(let p of diffParent.to){
            let item=change.add[p];
            if(!item.level||item.level<right.level){
              item.right.y=right.y;
              item.right.e=right.e;
              item.right.level=right.level;
            }
          }
        }
        if((diffItem=change.add[right.id])){                                                      //, 左新增
            diffItem.right.y=right.y;
            diffItem.right.e=right.e;
            diffItem.right.level=right.level;
        }
        if((diffItem=this.diffs.removed[right.id])){                                            //,右新增
          //let leftNode=change.common[diffItem.l_pid]||{e:null,y:null};
          let leftNode=change.common[diffItem.l_pid];
          if(!leftNode){
            let set=this.getParents('left',diffItem.l_pid);
            for(let p of set){
              if((leftNode=change.common[p]))break;
            }
            if(!leftNode)leftNode={e:null,y:null};
          }


          if(type!=='removed'){
            removed.push({left:{e:leftNode.e,y:leftNode.y,l_pid:leftNode.l_id},right:{node:[{e:right.e,r_id:right.id}],y:right.y},levelChange:false});
            level=right.level;
          }else if(level>right.level){
            removed.push({left:{e:leftNode.e,y:leftNode.y,l_pid:leftNode.l_id},right:{node:[{e:right.e,r_id:right.id}],y:right.y},levelChange:true});
            level=right.level;
          }else{
            removed[removed.length-1].right.node.push({e:right.e,r_id:right.id});
          }
          type='removed';
        }else if((diffItem=this.diffs.rightEdit[right.id])){                                   //,右编辑
          let left=leftEdit[right.id];
          if(left){
            left.delay=true;
          }
          if(type!=='edit'){
            rightEdit.push({right:{node:[{e:right.e,r_id:right.id}],y:right.y},left:left?{node:[{e:left.e,l_id:left.l_id}],y:left.y}:{node:[],y:null},levelChange:false});
            level=right.level;
          }else if(level>=right.level){
            rightEdit.push({right:{node:[{e:right.e,r_id:right.id}],y:right.y},left:left?{node:[{e:left.e,l_id:left.l_id}],y:left.y}:{node:[],y:null},levelChange:true});
            level=right.level;
          }else if(!next){
            rightEdit.push({right:{node:[{e:right.e,r_id:right.id}],y:right.y},left:left?{node:[{e:left.e,l_id:left.l_id}],y:left.y}:{node:[],y:null},levelChange:left&&left.levelChange});
          }else{
            let edits=rightEdit[rightEdit.length-1];
            edits.right.node.push({e:right.e,r_id:right.id});
            edits.levelChange=left?left.levelChange:false;
            if(left)edits.left.node.push({e:left.e,l_id:left.l_id});
          }
          if(!firstCommon.right){
            firstCommon.right={e:right.e,id:right.id,y:right.y};
          }
          next=left?left.next:null;
          type='edit';
        }else{                                                                                                       //,相同
          if(!firstCommon.right){
            firstCommon.right={e:right.e,id:right.id,y:right.y};
          }
          level=null;
          type='common';
        }
      }
      return change;
    },
    drawDiff(changes){
      let canvas=this.$refs.canvas;
      let ctx=canvas.getContext('2d');
      let parent=canvas.parentElement;
      canvas.width=parent.clientWidth;
      canvas.height=parent.clientHeight;
      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
      //ctx.lineWidth=1;

      let leftTree=this.$refs.leftTree;
      let rightTree=this.$refs.rightTree;
      let radius=35;
      let borderBottomStyle='3px solid ';
      let addFill=this.styles.node.add.fill;
      let editFill=this.styles.node.edit.fill;
      let removedFill=this.styles.node.removed.fill;

      let idx=0;
      for(let r_pid of changes.add.__set){                                                           //' 左新增
        let value=changes.add[r_pid];
        for(let bundle of value.left){
          bundle.levelChange?++idx:(idx=0);
          let index=idx%addFill.length;
          let addStyle=addFill[index];                                                                //循环取色值

          //bundle.node.map(n=>n.e.parentElement.style.backgroundColor=addStyle);
          //if(value.right.e)value.right.e.parentElement.style.borderBottom=borderBottomStyle+addStyle;
          bundle.node.map(n=>leftTree.getNode(n.l_id).data.class=`node-add${index}`);
          rightTree.getNode(r_pid).data.borderClass='node-border-bottom-add';


          if(typeof bundle.y!=='number'||typeof value.right.y!=='number')continue;
          ctx.strokeStyle=addStyle;
          ctx.fillStyle=addStyle;

          let left1={x:-1,y:bundle.y};                                                                    //-1延申到不可视区域 防止最后闭合曲线导致留下边框
          let left2={x:-1,y:bundle.y+bundle.node.length*this.treeItemHeight};
          let right1={x:parent.clientWidth,y:value.right.y+this.treeItemHeight};

          ctx.beginPath();
          ctx.moveTo(left1.x, left1.y);
          ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y-2);
          ctx.bezierCurveTo(right1.x-radius,right1.y,left2.x+radius+10,left2.y,left2.x,left2.y);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        }
      }
      idx=0;
      for(let value of Object.values(changes.leftEdit)){                            //'左编辑节点
        value.levelChange?++idx:(idx=0);
        //let editStyle=editFill[idx%editFill.length];
        //if(!value.delay)value.e.parentElement.style.backgroundColor=editStyle;
        if(!value.delay)leftTree.getNode(value.l_id).data.class=`node-edit${idx%editFill.length}`;
      }
      idx=0;
      for(let value of changes.rightEdit){                                                        //'右编辑节点
        value.levelChange?++idx:(idx=0);
        let index=idx%editFill.length;
        let editStyle=editFill[index];

        //value.left.e.map(e=>e.parentElement.style.backgroundColor=editStyle);
        //value.right.e.map(e=>e.parentElement.style.backgroundColor=editStyle);

        value.left.node.map(n=>leftTree.getNode(n.l_id).data.class=`node-edit${index}`);
        value.right.node.map(n=>rightTree.getNode(n.r_id).data.class=`node-edit${index}`);

        if(typeof value.left.y!=='number'||typeof value.right.y!=='number')continue;

        ctx.strokeStyle=editStyle;
        ctx.fillStyle=editStyle;
        let left1={x:-1,y:value.left.y};
        let left2={x:-1,y:value.left.y+value.left.node.length*this.treeItemHeight};
        let right1={x:parent.clientWidth+1,y:value.right.y};
        let right2={x:parent.clientWidth+1,y:value.right.y+value.right.node.length*this.treeItemHeight};
        ctx.beginPath();
        ctx.moveTo(left1.x, left1.y);
        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y);
        ctx.lineTo(right2.x,right2.y);
        ctx.bezierCurveTo(right2.x-radius,right2.y,left2.x+radius,left2.y,left2.x,left2.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      }
      idx=0;
      for(let value of changes.removed){
        value.levelChange?++idx:(idx=0);
        let index=idx%removedFill.length;
        let removedStyle=removedFill[index];

        //value.right.e.map(e=>e.parentElement.style.backgroundColor=removedStyle);
        //if(value.left.e)value.left.e.parentElement.style.borderBottom=borderBottomStyle+removedStyle;
        value.right.node.map(n=>rightTree.getNode(n.r_id).data.class=`node-removed${index}`);
        if(value.left.l_pid)leftTree.getNode(value.left.l_pid).data.borderClass=`node-border-bottom-removed`;

        if(typeof value.left.y!=='number'||typeof value.right.y!=='number')continue;

        ctx.strokeStyle=removedStyle;
        ctx.fillStyle=removedStyle;
        let left1={x:0,y:value.left.y+this.treeItemHeight};
        let right1={x:parent.clientWidth+1,y:value.right.y};
        let right2={x:parent.clientWidth+1,y:value.right.y+value.right.node.length*this.treeItemHeight};
        ctx.beginPath();
        ctx.moveTo(left1.x, left1.y-1);
        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y);
        ctx.lineTo(right2.x,right2.y);
        ctx.bezierCurveTo(right2.x-radius-10,right2.y,left1.x+radius,left1.y,left1.x,left1.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      }
    },
    findBoxVisibleNode(treeBoxRefs){                                                            //. 获得滚动窗口可视节点(暂时显示全部）
      let start=Math.floor(treeBoxRefs.scrollTop/this.treeItemHeight)-1;       //可视起始项坐标
      start=start<0?0:start;
      let origin=start*this.treeItemHeight-treeBoxRefs.scrollTop;                         //绘图起始点作为绘图坐标原点y （滚动节点一半情况）
      return $(treeBoxRefs)
          .find(".diff-node:visible")
          .toArray()
          .splice(start,this.viewPortNodes)
          .map((n,idx)=>({
            e: n,                                                                   //起始y
            y: origin + this.treeItemHeight * idx,
            id: n.dataset.nodeId,
            level:parseInt(n.dataset.nodeLevel)
          }));
    },
    getParents(type,id){
      let a;
      let side;
      let common;
      let set=new Set();
      switch (type){
        case 'left':    a=this.diffs.edit;
                             common=this.diffs.rightCommon;
                             side='l';break;
        case 'right':  a=this.diffs.rightEdit;
                             common=this.diffs.leftCommon;
                             side='r';break;
      }
      let p=a[id]||common[id];
      if(p) {
        let pid=p[`${side}_pid`];
        while ((p=a[pid]||common[pid])) {
          set.add(p[`${side}_id`])
          pid=p[`${side}_pid`];
          if(set.has(pid))break;
        }
      }
      return set;
    },
    diff(leftNode, rightNode,l_pid,r_pid, deep = false,edit=true) {                                 //. 比较左右树
      let diffs={
        add:{},                         //左边新增节点
        edit:{},                         //相同结构，子节点不同
        rightEdit:{},                 //右编辑节点
        removed:{},                 //右边新增节点
        common:{},                //
        leftCommon:{},          //左相同节点
        rightCommon:{},       //右相同节点
      };
      let createChildDiff=(l_id,r_id)=>({
        l_id,                             //左节点id
        r_id,                             //右节点id
        l_pid:leftNode.id,       //左父节点id
        r_pid:rightNode.id     //右父节点id
      });
      let createDiff=(l_id,r_id)=>({
        l_id,                             //左节点id
        r_id,                             //右节点id
        l_pid:l_pid,                  //左父节点id
        r_pid:r_pid                  //右父节点id
      });
      let change=false;
      let commons=[];
      let leftMap = list2map(leftNode.children,'path');
      let rightMap = list2map(rightNode.children,'path');
      for(let n of Object.keys(leftMap)){
        if(rightMap[n]&&deep){                                     //相同节点
          diffs.leftCommon[leftMap[n].id]={l_id:leftMap[n].id,r_id:rightMap[n].id,l_pid,r_pid};
          diffs.rightCommon[rightMap[n].id]={l_id:leftMap[n].id,r_id:rightMap[n].id,l_pid,r_pid};

          diffs.common[n]={l_id:leftMap[n].id,r_id:rightMap[n].id};
          commons.push({leftNode:leftMap[n],rightNode:rightMap[n]});
        }else{                                                                     //左边新增节点
          let left=leftMap[n];
          change=true;
          //diffs.add[left.id]=createDiff(left.id);
          recursiveTree(left,'children',(node)=>diffs.add[node.id]=createChildDiff(node.id));
        }
      }
      Object.keys(rightMap).map(n=>{                  //右边新增节点
        if(!leftMap[n]){
          let right=rightMap[n];
          change=true;
          //diffs.removed[right.id]=createDiff(null,right.id);
          recursiveTree(right,'children',(node)=>diffs.removed[node.id]=createChildDiff(node.id));
        }
      });
      if(deep){                                                                 //递归子节点
        commons.map(c=>{
          let subDiffs=this.diff(c.leftNode,c.rightNode,leftNode.id,rightNode.id,deep)
          if((subDiffs.add&&Object.keys(subDiffs.add).length>0)||
              (subDiffs.removed&&Object.keys(subDiffs.removed).length>0)||
              (subDiffs.edit&&Object.keys(subDiffs.edit).length>0))change=true;
          diffs.add={...diffs.add,...subDiffs.add};
          diffs.edit={...diffs.edit,...subDiffs.edit};
          diffs.rightEdit={...diffs.rightEdit,...subDiffs.rightEdit};
          diffs.removed={...diffs.removed,...subDiffs.removed};
          diffs.common={...diffs.common,...subDiffs.common};
          diffs.leftCommon={...diffs.leftCommon,...subDiffs.leftCommon};
          diffs.rightCommon={...diffs.rightCommon,...subDiffs.rightCommon};
        });
      }
      if(change&&edit){                                                           //子树有不一致，标记修改
        diffs.edit[leftNode.id]=createDiff(leftNode.id,rightNode.id);
        diffs.rightEdit[rightNode.id]=createDiff(leftNode.id,rightNode.id);
      }
      return diffs;
    },

    //%test
    compareTree() {
      console.log(detailedDiff(this.leftTree,this.rightTree));
    },
    colors(){
      let row=this.$refs['node_'+this.leftTree[0].id].parentElement.parentElement;
      console.log(row);
      row.style.backgroundColor='red';//inherit
    },
    leftTreeEl(){
      console.log(this.$refs.leftCard.$el.scrollHeight);
      console.log(this.$refs.leftCard.$el.clientHeight);
    },
    getRef(){
      console.log($("#node_6")[0]);
      console.log($("#node_6").is(":visible"));
      console.log(this.$refs.leftTree);
      console.log($(this.$refs.leftTreeBox).find(".diff-node:visible"));
    }
  }

}
</script>

<style scoped>
.custom-tree-node {

  /* background-color: #e6f0e6;*/
}

.node-text{
  display: inline-flex;
  max-width:160px;
}
.node-text>span{
  display:inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diff-node{
  width: 100%;
  text-align: left;
  /*padding: 4px 0;*/
}

.merge-config-panel{
  text-align: left;
  color: #409EFF;
}
.merge-config-panel .el-icon{
  cursor: pointer;
}
.merge-config-rule-item{
  margin: 4px 0;
}
.merge-config-rule-item .el-select{
  width: 100px;
}

.no-pad{/*'无内边距*/
  padding: 0;
}
.left-scroll{/*'右到左*/
  direction: rtl;
}
.left-scroll div{/*'恢复左到右*/
  direction: ltr;
}

.right-scroll{/*'左到右*/
  direction: ltr;
}
.box{
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
}
</style>

<!--全局-->
<style>
.el-tree-node__content:hover {
  /*background-color: #eae7ff !important;*/
}
.el-tree-node:focus>.el-tree-node__content{
  /*background-color: #eae7ff!important;*/
}

/*左新增*/
.node-add0>.el-tree-node__content{
  background-color: v-bind('styles.node.add.fill[0]')!important;
}
.node-add1>.el-tree-node__content{
  background-color: v-bind('styles.node.add.fill[1]')!important;
}
.node-add2>.el-tree-node__content{
  background-color: v-bind('styles.node.add.fill[2]')!important;
}
.node-border-bottom-add>.el-tree-node__content{
  border-bottom: v-bind('styles.node.add.borderBottom')!important;
}
/*左编辑*/
.node-edit0>.el-tree-node__content{
  background-color: v-bind('styles.node.edit.fill[0]')!important;
}
.node-edit1>.el-tree-node__content{
  background-color: v-bind('styles.node.edit.fill[1]')!important;
}
.node-edit2>.el-tree-node__content{
  background-color: v-bind('styles.node.edit.fill[2]')!important;
}
/*右新增*/
.node-removed0>.el-tree-node__content{
  background-color: v-bind('styles.node.removed.fill[0]')!important;
}
.node-removed1>.el-tree-node__content{
  background-color: v-bind('styles.node.removed.fill[1]')!important;
}
.node-removed2>.el-tree-node__content{
  background-color: v-bind('styles.node.removed.fill[2]')!important;
}
.node-border-bottom-removed>.el-tree-node__content{
  border-bottom: v-bind('styles.node.removed.borderBottom')!important;
}



.node-merge-removed{
  background-color: v-bind('styles.node.mergeRemoved');
}





.el-tree-node__content {
  box-sizing: border-box!important;
  /*height: auto !important;*/
}

/*.el-tree-node__content{
  height: auto;
}
.el-tree-node__content>.el-tree-node__expand-icon{
  padding: 0;
}*/

/*
.el-tree-node__content + .el-tree-node__children{
 background-color: red;
}
.el-tree-node__content:hover {
  background-color:inherit;
}
.el-tree-node:focus>.el-tree-node__content {
  background-color: inherit;
}*/
</style>