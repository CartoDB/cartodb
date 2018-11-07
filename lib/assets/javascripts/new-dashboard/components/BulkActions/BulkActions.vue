<template>
  <section class="bulk-actions">
    <button
      class="bulk-actions__button button button--ghost"
      :class="{'is-txtAlert': action.isDestructive}"
      v-if="action.shouldShow"
      v-for="action in actions"
      :key="action.event"
      @click="emitEvent(action.event)">
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
    emitEvent (eventName) {
      this.$emit(eventName);
    }
  }
};
</script>

<style lang="scss" scoped>
.bulk-actions {
  display: flex;

  &__button:last-child {
    padding-right: 0;
  }
}
</style>
