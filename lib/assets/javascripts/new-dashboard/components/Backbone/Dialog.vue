<template>
  <div class="Dialog is-white">
    <button class="CDB-Shape Dialog-closeBtn" @click="close">
      <div class="CDB-Shape-close is-blue is-huge"></div>
    </button>

    <div class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dialog',
  methods: {
    close () {
      this.$emit('close');
    }
  }
};
</script>

<style lang="scss">
.Dialog .Dialog-header {
  box-sizing: content-box;

  * {
    box-sizing: content-box;
  }
}
</style>
