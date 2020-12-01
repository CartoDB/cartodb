<template>
  <div class="connector u-flex u-flex__direction--column u-flex__justify--center u-flex__align--center">
    <div class="ImportButton">
      <i class="is-postgresql"></i>
    </div>
    <span class="is-small is-semibold">PostgreSQL</span>
  </div>
</template>

<script>

export default {
  name: 'Connector',
  components: {},
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.connector {
  width: 124px;
  height: 88px;
  border-radius: 4px;
  background-color: $white;
  border: 1px solid $neutral--300;
}

.ImportButton {
  min-width: 0;
  border: none;
  padding: 0;
  margin: 0;
  height: auto;
  width: auto;
  >*{
    width: 24px;
    height: 24px;
    padding: 0;
  }
}
</style>
