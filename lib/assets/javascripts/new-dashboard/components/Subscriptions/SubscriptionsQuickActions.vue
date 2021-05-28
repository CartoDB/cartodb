<template>
  <QuickActions
    :actions="actions"
    v-on="getEventListeners()"
    ref="quickActions" />
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';

export default {
  name: 'SubscriptionsQuickActions',
  components: {
    QuickActions
  },
  props: {
  },
  computed: {
    actions () {
      return [
        {
          name: this.$t('QuickActions.accessInBigquery'),
          event: 'accessBigQuery'
        },
        {
          name: this.$t('QuickActions.accessInAWS'),
          event: 'accessAWS'
        },
        {
          name: this.$t('QuickActions.accessInAzure'),
          event: 'accessAzure'
        }
      ];
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
    accessBigQuery () {
      this.closeDropdown();
      this.$emit('onAccess', 'bigquery');
    },
    accessAWS () {
      this.closeDropdown();
      this.$emit('onAccess', 'aws');
    },
    accessAzure () {
      this.closeDropdown();
      this.$emit('onAccess', 'azure');
    }
  }
};
</script>
