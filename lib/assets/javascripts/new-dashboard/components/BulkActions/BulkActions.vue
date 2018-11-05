<template>
  <section class="bulk-actions">
    <button
      class="button button--ghost"
      :class="{'button--danger': action.isDestructive}"
      v-for="action in actions"
      :key="action.event"
      @click="doAction(action.event)">
      {{ action.name }}
    </button>
  </section>
</template>

<script>
export default {
  name: 'BulkActions',
  props: {
    actions: {
      type: Array,
      required: true
    }
  },
  methods: {
    doAction (action) {
      this.$emit(action);
    }
  }
};
</script>

<style lang="scss" scoped>
.bulk-actions {
  display: flex;
}
</style>
