<template>
  <el-button @click="connect">connect</el-button>
  <div>{{msg}}</div>
  <el-button @click="send">send</el-button>
</template>

<script>
export default {
  name: "ElectronVue",
  data(){
    return {
      msg:''
    }
  },
  methods:{
    async connect(){
      //this.$electron.ipcRenderer.send("webrtc-connect");
      let response =await window.test.file_access('123');
      this.msg=response;
    },
    send(){

    }

  }
}
</script>

<style scoped>

</style>