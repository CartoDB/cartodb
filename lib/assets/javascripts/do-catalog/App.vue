<template>
  <div class="do-catalog">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'do-catalog'
};
</script>

<style lang="scss" scoped>
.do-catalog {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
</style>
