<template>
  <section>
    <div class="hello">
      <h1>{{ msg }}</h1>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
      msg: "Welcome to CARTO\'s new dashboard"
    };
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.hello {
  text-align: center;
}
</style>
