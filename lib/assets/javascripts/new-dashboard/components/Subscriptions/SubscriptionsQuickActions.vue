<template>
  <QuickActions
    :actions="actions"
    v-on="getEventListeners()"
    ref="quickActions" />
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';
import { mapGetters } from 'vuex';

export default {
  name: 'SubscriptionsQuickActions',
  components: {
    QuickActions
  },
  props: {
  },
  computed: {
    ...mapGetters({
      hasBigqueryConnection: 'connectors/hasBigqueryConnection'
    }),
    actions () {
      return [
        {
          name: this.$t('QuickActions.accessInBigquery'),
          event: 'accessBigQuery',
          shouldBeDisabled: !this.hasBigqueryConnection,
          disableInfo: 'Please create a BigQuery connection to enable this option.'
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
<style scoped lang="scss">
.quick-actions {
  /deep/ .quick-actions-select {
    &:not(.is-active) {
      background: transparent
    }
  }
}
</style>
