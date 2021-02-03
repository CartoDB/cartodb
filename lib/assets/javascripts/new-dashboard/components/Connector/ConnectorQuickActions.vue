<template>
  <QuickActions
    :actions="actions"
    v-on="getEventListeners()"
    ref="quickActions" />
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';

export default {
  name: 'ConnectorQuickActions',
  components: {
    QuickActions
  },
  props: {
    connection: String,
    editable: {
      type: Boolean,
      default: true
    },
    storeActionType: {
      type: String,
      default: 'datasets'
    }
  },
  computed: {
    actions () {
      return [
        ...(this.editable
          ? [{
            name: this.$t('QuickActions.importDataset'),
            event: 'importDataset'
          }] : []
        ),
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
    closeDropdown () {
      this.$refs.quickActions.closeDropdown();
    },
    importDataset () {
      this.closeDropdown();
      this.$router.push({ name: 'new-connection-connection-dataset', params: { id: this.connection } });
    },
    deleteConnection () {
      this.closeDropdown();
      this.$router.push({ name: 'delete-connection', params: { id: this.connection } });
    }
  }
};
</script>
