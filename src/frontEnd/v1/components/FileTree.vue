<template>
  <el-tree
      :props="trees"
      lazy
      show-checkbox
  />
</template>

<script>
export default {
  name: "FileTree",
  data(){
    return {
      trees: {
        label: 'name',
        children: 'zones'
      }
    }
  }
}
</script>

<style scoped>

</style>