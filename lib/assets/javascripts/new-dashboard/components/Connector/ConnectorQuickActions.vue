<template>
  <QuickActions
    :actions="actions"
    v-on="getEventListeners()"
    ref="quickActions"
    @open="openQuickactions"
    @close="closeQuickactions" />
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';

export default {
  name: 'ConnectorQuickActions',
  inject: ['backboneViews'],
  components: {
    QuickActions
  },
  props: {
    connection: String,
    storeActionType: {
      type: String,
      default: 'datasets'
    }
  },
  computed: {
    actions () {
      return [{
        name: this.$t('QuickActions.editConnection'),
        event: 'editConnection'
      },
      {
        name: this.$t('QuickActions.delete'),
        event: 'deleteConnection',
        isDestructive: true
      }];
    }
  },
  methods: {
    getEventListeners () {
      const events = this.actions.map(action => action.event);

      return events.reduce(
        (eventListeners, action) => {
          eventListeners[action] = this[action].bind(this);
          return eventListeners;
        }, {}
      );
    },
    openQuickactions () {
      this.$emit('open');
    },
    closeQuickactions () {
      this.$emit('close');
    },
    closeDropdown () {
      this.$refs.quickActions.closeDropdown();
    },
    editConnection () {
      // DialogActions.editDatasetMetadata.apply(this, [this.connection, this.getActionHandlers()]);
      this.closeDropdown();
    },
    deleteConnection () {
      // DialogActions.deleteVisualization.apply(this, [this.connection, 'datasets', this.getActionHandlers()]);
      this.closeDropdown();
    }
  }
};
</script>
