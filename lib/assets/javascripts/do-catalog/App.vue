<template>
  <div class="do-catalog">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style lang="scss" scoped>
.do-catalog {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
