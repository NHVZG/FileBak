<template>
  <div>
    <el-form-item>

      <el-button @click="connect">connect</el-button>
      <el-input v-model="sendMsg"/>
      <el-button @click="send">send</el-button>
    </el-form-item>
    <el-form-item>

    </el-form-item>
  </div>
</template>

<script>
export default {
  name: "ElectronVueFileAccess",
  data() {
    return {
      peerLoginUrl: 'ws://192.168.1.5',
      sendMsg: ''

    }
  },
  async created() {
    let _this = this;

    window.test.get_init_type((event, value) => {
      _this.sendMsg = value;
    });
  },

  methods: {
    register() {

    },
    async connect() {
      let response = await window.test.file_access('123');
      this.sendMsg = response;
      console.log(1230);
    },
    send() {

    }
  }
}
</script>

<style scoped>

</style>