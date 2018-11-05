<template>
  <QuickActions :actions="actions" v-on="getEventListeners()"></QuickActions>
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';

export default {
  name: 'MapQuickActions',
  components: {
    QuickActions
  },
  props: {
    map: Object
  },
  data () {
    return {
      actions: [
        { name: this.$t('QuickActions.maps.editInfo'), event: 'editInfo' },
        { name: this.$t('QuickActions.maps.changePrivacy'), event: 'changePrivacy' },
        { name: this.$t('QuickActions.maps.manageTags'), event: 'manageTags' },
        { name: this.$t('QuickActions.maps.duplicate'), event: 'duplicateMap' },
        { name: this.$t('QuickActions.maps.lock'), event: 'lockMap' },
        { name: this.$t('QuickActions.maps.delete'), event: 'deleteMap', isDestructive: true }
      ]
    };
  },
  methods: {
    getEventListeners () {
      const events = this.actions.map(action => action.event);

      console.log(events);
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
    editInfo () {
      DialogActions.editMapMetadata.apply(this, [this.map]);
    },
    changePrivacy () {
      DialogActions.changePrivacy.apply(this, [this.map]);
    },
    manageTags () {
      DialogActions.editMapMetadata.apply(this, [this.map]);
    },
    duplicateMap () {
      DialogActions.duplicateMap.apply(this, [this.map]);
    },
    unlockMap () {
      DialogActions.changeLockState.apply(this, [this.map, 'maps']);
    },
    lockMap () {
      DialogActions.changeLockState.apply(this, [this.map, 'maps']);
    },
    deleteMap () {
      DialogActions.deleteVisualization.apply(this, [this.map, 'maps']);
    }
  }
};
</script>
