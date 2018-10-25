<template>
  <button @click="openCreateModal">Create Map</button>
</template>

<script>
import CreateDialog from 'new-dashboard/components/Dialogs/CreateDialog.vue';

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
        template: `<CreateDialog :dialogType="dialogType" :backgroundPollingView="backgroundPollingView" v-on:close="$emit('close')"/>`,
        props: ['dialogType', 'backgroundPollingView'],
        components: { CreateDialog }
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
