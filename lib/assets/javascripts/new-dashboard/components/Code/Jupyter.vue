<template>
  <div class="jupyter">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'JupyterBlock'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.jupyter {
  margin: 16px 0;
  padding: 20px 20px 20px 8px;
  background-color: $white;
}

.jupyter > * {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
