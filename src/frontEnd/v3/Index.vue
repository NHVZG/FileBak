<template>
<!--  <el-button @click="tab">切换</el-button>
  <Chat v-if="type===1"/>
  <FileAccess v-if="type===2"/>-->
<!--  <Tree></Tree>-->
<!--  <TreeTest></TreeTest>-->
<!--  <FileCompare/>-->
<!--  <FileDiff/>-->
<!--  <FileDiffs/>-->
<!--  <FileDiffsv2/>-->
<!--  <FileDiffsv3/>-->
<!--  <FileDiffsv5/>-->
<!--  <FileDiffsv6/>-->
  <FileDiffsv7/>
</template>

<script>
import Chat from "@/frontEnd/v3/components/Chat.vue";
import FileAccess from "@/frontEnd/v3/components/FileAccess.vue";
import FileCompare from "@/frontEnd/v3/components/FileCompare.vue";
import FileDiff from "@/frontEnd/v3/components/_deprecate/FileDiffv1.2.vue";
import TreeTest from "@/frontEnd/v3/components/tree/TreeTest.vue";
import FileDiffsv2 from "@/frontEnd/v3/components/_deprecate/FileDiffsv2.vue";
import FileDiffsv3 from "@/frontEnd/v3/components/_deprecate/FileDiffsv3.vue";
import FileDiffsv4 from "@/frontEnd/v3/components/_deprecate/FileDiffsv4.vue";
import FileDiffsv5 from "@/frontEnd/v3/components/_deprecate/FileDiffsv5.vue";
import FileDiffsv6 from "@/frontEnd/v3/components/_deprecate/FileDiffsv6.vue";
import FileDiffsv7 from "@/frontEnd/v3/components/FileDiffsv7.vue";
export default {
  name: "Index-v3",
  components:{
    Chat,
    FileAccess,
    FileCompare,
    TreeTest,
    FileDiff,
    FileDiffsv2,
    FileDiffsv3,
    FileDiffsv4,
    FileDiffsv5,
    FileDiffsv6,
    FileDiffsv7
  },
  data(){
    return {
      type:1
    }
  },
  methods:{
    tab(){
      this.type=this.type===1?2:1;
    }
  }
}
</script>

<style scoped>

</style>