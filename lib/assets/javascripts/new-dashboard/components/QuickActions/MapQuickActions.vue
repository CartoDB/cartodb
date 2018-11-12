<template>
  <QuickActions v-if="!isShared" :actions="actions[actionMode]" v-on="getEventListeners()" @open="openQuickactions" @close="closeQuickactions"></QuickActions>
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
  computed: {
    actions () {
      return {
        mine: [
          { name: this.$t('QuickActions.maps.editInfo'), event: 'editInfo', shouldShow: true },
          { name: this.$t('QuickActions.maps.manageTags'), event: 'manageTags', shouldShow: true },
          { name: this.$t('QuickActions.maps.changePrivacy'), event: 'changePrivacy', shouldShow: true },
          { name: this.$t('QuickActions.maps.share'), event: 'shareVisualization', shouldShow: this.isUserInsideOrganization },
          { name: this.$t('QuickActions.maps.duplicate'), event: 'duplicateMap', shouldShow: true },
          { name: this.$t('QuickActions.maps.lock'), event: 'lockMap', shouldShow: true },
          { name: this.$t('QuickActions.maps.delete'), event: 'deleteMap', isDestructive: true, shouldShow: true }
        ],
        locked: [
          { name: this.$t('QuickActions.maps.unlock'), event: 'unlockMap', shouldShow: true }
        ]
      };
    },
    actionMode () {
      return this.map.locked ? 'locked' : 'mine';
    },
    isShared () {
      return Visualization.isShared(this.$props.map, this.$cartoModels);
    },
    isUserInsideOrganization () {
      const userOrganization = this.$store.state.user.organization;
      return userOrganization && userOrganization.id;
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
      this.$emit('open');
    },
    closeQuickactions () {
      this.$emit('close');
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
    },
    shareVisualization () {
      DialogActions.shareVisualization.apply(this, [this.map]);
    }
  }
};
</script>
