<template>
  <FileTree/>
</template>

<script>
import FileTree from "@/frontEnd/components/FileTree.vue";
import Chat from "@/frontEnd/components/Chat.vue";

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