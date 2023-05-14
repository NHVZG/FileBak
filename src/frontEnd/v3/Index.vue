<template>
  <el-button @click="tab">切换</el-button>
  <Chat v-if="type===1"/>
  <FileAccess v-if="type===2"/>
</template>

<script>
import Chat from "@/frontEnd/v3/components/Chat.vue";
import FileAccess from "@/frontEnd/v3/components/FileAccess.vue";
export default {
  name: "Index-v3",
  components:{
    Chat,
    FileAccess
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