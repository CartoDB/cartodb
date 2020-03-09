<template>
  <button class="button is-primary" @click="openCreateModal" :class="{'u-is-disabled': disabled}">
    <slot />
  </button>
</template>

<script>
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import CreateDialog from 'new-dashboard/components/Backbone/Dialogs/CreateDialog.vue';

export default {
  name: 'CreateButton',
  inject: ['backboneViews'],
  props: {
    visualizationType: {
      type: String,
      default: 'maps'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    openCreateModal () {
      this.$modal.show({
        template: `
        <Dialog @close="$emit('close')">
          <CreateDialog
            :dialogType="dialogType"
            :backgroundPollingView="backgroundPollingView"
            :mamufasImportView="mamufasImportView"
            @close="$emit('close')" />
        </Dialog>`,
        props: ['dialogType', 'backgroundPollingView', 'mamufasImportView'],
        components: { Dialog, CreateDialog }
      },
      {
        dialogType: this.$props.visualizationType,
        backgroundPollingView: this.backboneViews.backgroundPollingView.getBackgroundPollingView(),
        mamufasImportView: this.backboneViews.mamufasImportView.getView()
      },
      {
        width: '100%',
        height: '100%'
      });
    }
  }
};
</script>
