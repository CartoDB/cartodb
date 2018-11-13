<template>
  <QuickActions
    v-if="!isShared"
    ref="quickActions"
    :actions="actions[actionMode]"
    v-on="getEventListeners()"
    @open="openQuickactions"
    @close="closeQuickactions"></QuickActions>
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
          { name: this.$t('QuickActions.editInfo'), event: 'editInfo' },
          { name: this.$t('QuickActions.manageTags'), event: 'manageTags' },
          { name: this.$t('QuickActions.changePrivacy'), event: 'changePrivacy' },
          { name: this.$t('QuickActions.share'), event: 'shareVisualization', shouldBeHidden: !this.isUserInsideOrganization },
          { name: this.$t('QuickActions.duplicate'), event: 'duplicateMap' },
          { name: this.$t('QuickActions.lock'), event: 'lockMap' },
          { name: this.$t('QuickActions.delete'), event: 'deleteMap', isDestructive: true }
        ],
        locked: [
          { name: this.$t('QuickActions.unlock'), event: 'unlockMap' }
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
    getActionHandlers () {
      return {
        updateVisualization: (model) => {
          this.$store.dispatch('maps/updateMap', { mapId: model.get('id'), mapAttributes: model.attributes });
        },
        fetchList: () => {
          this.$store.dispatch('maps/fetchMaps');
        }
      };
    },
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
    closeDropdown () {
      this.$refs.quickActions.closeDropdown();
    },
    editInfo () {
      DialogActions.editMapMetadata.apply(this, [this.map, this.getActionHandlers()]);
      this.closeDropdown();
    },
    changePrivacy () {
      DialogActions.changePrivacy.apply(this, [this.map, this.getActionHandlers()]);
      this.closeDropdown();
    },
    manageTags () {
      DialogActions.editMapMetadata.apply(this, [this.map]);
      this.closeDropdown();
    },
    duplicateMap () {
      DialogActions.duplicateVisualization.apply(this, [this.map]);
      this.closeDropdown();
    },
    unlockMap () {
      DialogActions.changeLockState.apply(this, [this.map, 'maps', this.getActionHandlers()]);
      this.closeDropdown();
    },
    lockMap () {
      DialogActions.changeLockState.apply(this, [this.map, 'maps', this.getActionHandlers()]);
      this.closeDropdown();
    },
    deleteMap () {
      DialogActions.deleteVisualization.apply(this, [this.map, 'maps', this.getActionHandlers()]);
      this.closeDropdown();
    },
    shareVisualization () {
      DialogActions.shareVisualization.apply(this, [this.map, this.getActionHandlers()]);
      this.closeDropdown();
    }
  }
};
</script>
