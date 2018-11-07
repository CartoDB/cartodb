<template>
  <BulkActions :actions="actions[actionMode]" v-on="getEventListeners()"></BulkActions>
</template>

<script>
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';

export default {
  name: 'MapBulkActions',
  components: {
    BulkActions
  },
  props: {
    selectedMaps: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      actions: {
        single: [
          { name: this.$t('BulkActions.maps.selectAllMaps'), event: 'selectAll' },
          { name: this.$t('BulkActions.maps.changeMapPrivacy'), event: 'changePrivacy' },
          { name: this.$t('BulkActions.maps.duplicateMap'), event: 'duplicateMap' },
          { name: this.$t('BulkActions.maps.lockMap'), event: 'lockMap' },
          { name: this.$t('BulkActions.maps.deleteMap'), event: 'deleteMap', isDestructive: true }
        ],
        multiple: [
          { name: this.$t('BulkActions.maps.selectAllMaps'), event: 'selectAll' },
          { name: this.$t('BulkActions.maps.deselectAllMaps'), event: 'deselectAll' },
          { name: this.$t('BulkActions.maps.lockMaps'), event: 'lockMaps' },
          { name: this.$t('BulkActions.maps.deleteMaps'), event: 'deleteMaps', isDestructive: true }
        ],
        lock: [
          { name: this.$t('BulkActions.maps.unlockMap'), event: 'unlockMap' }
        ],
        multipleLock: [
          { name: this.$t('BulkActions.maps.unlockMaps'), event: 'unlockMaps' }
        ]
      }
    };
  },
  computed: {
    actionMode () {
      const isAnyMapLocked = this.selectedMaps.filter(map => map.locked);

      if (isAnyMapLocked.length) {
        return isAnyMapLocked.length > 1 ? 'multipleLock' : 'lock';
      }

      return this.selectedMaps.length > 1 ? 'multiple' : 'single';
    }
  },
  methods: {
    getActionHandlers () {
      return {
        deselectAll: () => {
          this.deselectAll();
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
    selectAll () {
      this.$emit('selectAll');
    },
    deselectAll () {
      this.$emit('deselectAll');
    },
    changePrivacy () {
      DialogActions.changePrivacy.apply(this, [this.selectedMaps[0]]);
    },
    duplicateMap () {
      DialogActions.duplicateMap.apply(this, [this.selectedMaps[0]]);
    },
    unlockMap () {
      const actionHandlers = this.getActionHandlers();
      DialogActions.changeLockState.apply(this, [this.selectedMaps[0], 'maps', actionHandlers]);
    },
    lockMap () {
      const actionHandlers = this.getActionHandlers();
      DialogActions.changeLockState.apply(this, [this.selectedMaps[0], 'maps', actionHandlers]);
    },
    deleteMap () {
      const actionHandlers = this.getActionHandlers();
      DialogActions.deleteVisualization.apply(this, [this.selectedMaps[0], 'maps', actionHandlers]);
    },
    unlockMaps () {
      const actionHandlers = this.getActionHandlers();
      DialogActions.changeVisualizationsLockState.apply(this, [this.selectedMaps, 'maps', actionHandlers]);
    },
    lockMaps () {
      const actionHandlers = this.getActionHandlers();
      DialogActions.changeVisualizationsLockState.apply(this, [this.selectedMaps, 'maps', actionHandlers]);
    },
    deleteMaps () {
      const actionHandlers = this.getActionHandlers();
      DialogActions.deleteVisualizations.apply(this, [this.selectedMaps, 'maps', actionHandlers]);
    }
  }
};
</script>
