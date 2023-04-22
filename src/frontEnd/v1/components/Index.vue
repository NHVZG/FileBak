<template>
  <FileTree/>
</template>

<script>
import FileTree from "@/frontEnd/v1/components/FileTree.vue";
import Chat from "@/frontEnd/v1/components/Chat.vue";

export default {
  name: "Index",
  components:{
    Chat,
    FileTree
  }
}
</script>

<style scoped>

</style>