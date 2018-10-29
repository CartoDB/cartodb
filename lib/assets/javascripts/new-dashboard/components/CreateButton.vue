<template>
  <button class="button button--small is-primary" @click="openCreateModal">
    <slot />
  </button>
</template>

<script>
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import CreateDialog from 'new-dashboard/components/Backbone/Dialogs/CreateDialog.vue';

export default {
  name: 'CreateButton',
  props: {
    visualizationType: {
      type: String,
      default: 'maps'
    }
  },
  methods: {
    openCreateModal () {
      this.$modal.show({
        template: `
        <Dialog v-on:close="$emit('close')">
          <CreateDialog :dialogType="dialogType" :backgroundPollingView="backgroundPollingView" v-on:close="$emit('close')"/>
        </Dialog>`,
        props: ['dialogType', 'backgroundPollingView'],
        components: { Dialog, CreateDialog }
      },
      {
        dialogType: this.$props.visualizationType,
        backgroundPollingView: this.$parent.$parent.$refs.backgroundPollingView.getBackgroundPollingView()
      },
      {
        width: '100%',
        height: '100%'
      });
    }
  }
};
</script>
