<template>
  <section class="bulk-actions">
    <template
      v-for="action in actions">
      <button
        class="bulk-actions__button button button--ghost"
        v-if="!action.shouldBeHidden"
        :class="{
          'is-txtAlert': action.isDestructive,
          'u-is-disabled': action.shouldBeDisabled}"
        :disabled="action.shouldBeDisabled"
        :key="action.event"
        @click="emitEvent(action.event)">
        {{ action.name }}
      </button>
    </template>
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
