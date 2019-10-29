<template>
  <QuickActions
    ref="quickActions"
    :actions="actions"
    v-on="getEventListeners()"
    @open="openQuickactions"
    @close="closeQuickactions"></QuickActions>
</template>

<script>
import { mapGetters } from 'vuex';
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';
import * as Visualization from 'new-dashboard/core/models/visualization';

export default {
  name: 'KuvizQuickActions',
  components: {
    QuickActions
  },
  props: {
    kuviz: Object,
    storeActionType: {
      type: String,
      default: 'kuvizs'
    }
  },
  computed: {
    actions () {
      return [ { name: this.$t('QuickActions.delete'), event: 'deleteKuviz', isDestructive: true } ];
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
    showModal (componentDefinition, componentPropsData) {
      this.$modal.show(
        componentDefinition,
        componentPropsData,
        { width: '100%', height: '100%' }
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
    deleteKuviz () {
      this.$emit('deleteKuviz', this.kuviz)
      this.closeDropdown();
    }
  }
};
</script>
