<template>
  <QuickActions
    v-if="!isSharedWithMe"
    ref="quickActions"
    :actions="actions[actionMode]"
    :upgradeUrl="upgradeUrl"
    v-on="getEventListeners()"
    @open="openQuickactions"
    @close="closeQuickactions"></QuickActions>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';
import * as Visualization from 'new-dashboard/core/models/visualization';

export default {
  name: 'MapQuickActions',
  components: {
    QuickActions
  },
  props: {
    map: Object,
    storeActionType: {
      type: String,
      default: 'maps'
    }
  },
  computed: {
    ...mapGetters({
      isOutOfPublicMapsQuota: 'user/isOutOfPublicMapsQuota',
      isOutOfPrivateMapsQuota: 'user/isOutOfPrivateMapsQuota'
    }),
    ...mapState({
      upgradeUrl: state => state.config.upgrade_url
    }),
    actions () {
      return {
        mine: [
          { name: this.$t('QuickActions.editInfo'), event: 'editInfo', shouldBeHidden: this.isKeplergl },
          { name: this.$t('QuickActions.manageTags'), event: 'manageTags', shouldBeHidden: this.isKeplergl },
          { name: this.$t('QuickActions.changePrivacy'), event: 'changePrivacy', shouldBeDisabled: !this.canChangePrivacy, shouldBeHidden: this.isKeplergl },
          { name: this.$t('QuickActions.share'), event: 'shareVisualization', shouldBeHidden: !this.isUserInsideOrganization || this.isKeplergl },
          { name: this.$t('QuickActions.shareViaURL'), event: 'shareViaUrl', shouldBeHidden: !this.isKuviz },
          { name: this.$t('QuickActions.duplicate'), event: 'duplicateMap', shouldBeDisabled: !this.canDuplicate, shouldBeHidden: this.isKuviz || this.isKeplergl },
          { name: this.$t('QuickActions.lock'), event: 'lockMap', shouldBeHidden: this.isKeplergl },
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
    isSharedWithMe () {
      return Visualization.isSharedWithMe(this.$props.map, this.$cartoModels);
    },
    isUserInsideOrganization () {
      const userOrganization = this.$store.state.user.organization;
      return userOrganization && userOrganization.id;
    },
    isSelectedMapPrivate () {
      return this.map.privacy === 'PRIVATE';
    },
    canChangePrivacy () {
      return (this.isSelectedMapPrivate && !this.isOutOfPublicMapsQuota) ||
      !this.isSelectedMapPrivate;
    },
    canDuplicate () {
      return (!this.isOutOfPrivateMapsQuota && this.isSelectedMapPrivate) ||
        (!this.isOutOfPublicMapsQuota && !this.isSelectedMapPrivate);
    },
    isKuviz () {
      return this.map.type === 'kuviz';
    },
    isKeplergl () {
      return this.map.type === 'keplergl';
    }
  },
  methods: {
    getActionHandlers () {
      return {
        deselectAll: () => {},
        updateVisualization: (model) => {
          this.$store.dispatch(`${this.storeActionType}/updateVisualization`, { visualizationId: model.get('id'), visualizationAttributes: model.attributes });
        },
        fetchList: () => {
          this.$store.dispatch(`${this.storeActionType}/fetch`);
          this.$emit('contentChanged', 'maps');
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
      DialogActions.editMapMetadata.apply(this, [this.map, this.getActionHandlers()]);
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
      if (!this.isKeplergl) {
        DialogActions.deleteVisualization.apply(this, [this.map, 'maps', this.getActionHandlers()]);
      } else {
        DialogActions.deleteExternalVisualizations.apply(this, [[this.map]]);
      }
      this.closeDropdown();
    },
    shareVisualization () {
      DialogActions.shareVisualization.apply(this, [this.map, this.getActionHandlers()]);
      this.closeDropdown();
    },
    shareViaUrl () {
      DialogActions.shareViaUrl.apply(this, [this.map, this.getActionHandlers()]);
      this.closeDropdown();
    }
  }
};
</script>
