<template>
  <QuickActions v-if="!isShared" :actions="actions[actionMode]" v-on="getEventListeners()" @openQuickactions="openQuickactions" @closeQuickactions="closeQuickactions"></QuickActions>
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';
import * as Visualization from 'new-dashboard/core/visualization';

export default {
  name: 'MapQuickActions',
  components: {
    QuickActions
  },
  props: {
    map: Object
  },
  data: function () {
    return {
      actions: {
        mine: [
          { name: this.$t('QuickActions.maps.editInfo'), event: 'editInfo' },
          { name: this.$t('QuickActions.maps.changePrivacy'), event: 'changePrivacy' },
          { name: this.$t('QuickActions.maps.manageTags'), event: 'manageTags' },
          { name: this.$t('QuickActions.maps.duplicate'), event: 'duplicateMap' },
          { name: this.$t('QuickActions.maps.lock'), event: 'lockMap' },
          { name: this.$t('QuickActions.maps.delete'), event: 'deleteMap', isDestructive: true }
        ],
        locked: [
          { name: this.$t('QuickActions.maps.unlock'), event: 'unlockMap' }
        ]
      }
    };
  },
  computed: {
    actionMode () {
      return this.map.locked ? 'locked' : 'mine';
    },
    isShared () {
      return Visualization.isShared(this.$props.map, this.$cartoModels);
    }
  },
  methods: {
    getEventListeners () {
      const events = this.actions[this.actionMode].map(action => action.event);

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
      this.$emit('openQuickactions');
    },
    closeQuickactions () {
      this.$emit('closeQuickactions');
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
