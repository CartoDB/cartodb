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
    areAllMapsSelected: {
      type: Boolean,
      default: false
    },
    selectedMaps: {
      type: Array,
      required: true
    }
  },
  computed: {
    actions () {
      return {
        single: [
          { name: this.$t('BulkActions.maps.selectAllMaps'), event: 'selectAll' },
          { name: this.$t('BulkActions.maps.changeMapPrivacy'), event: 'changePrivacy' },
          { name: this.$t('BulkActions.maps.duplicateMap'), event: 'duplicateMap' },
          { name: this.$t('BulkActions.maps.lockMap'), event: 'lockMap' },
          { name: this.$t('BulkActions.maps.deleteMap'), event: 'deleteMap', isDestructive: true }
        ],
        multiple: [
          { name: this.$t('BulkActions.maps.selectAllMaps'), event: 'selectAll', shouldBeHidden: this.areAllMapsSelected },
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
      };
    },
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
      DialogActions.duplicateVisualization.apply(this, [this.selectedMaps[0]]);
    },
    unlockMap () {
      DialogActions.changeLockState.apply(this, [
        this.selectedMaps[0],
        'maps',
        this.getActionHandlers()
      ]);
    },
    lockMap () {
      DialogActions.changeLockState.apply(this, [
        this.selectedMaps[0],
        'maps',
        this.getActionHandlers()
      ]);
    },
    deleteMap () {
      DialogActions.deleteVisualization.apply(this, [
        this.selectedMaps[0],
        'maps',
        this.getActionHandlers()
      ]);
    },
    unlockMaps () {
      DialogActions.changeVisualizationsLockState.apply(this, [
        this.selectedMaps,
        'maps',
        this.getActionHandlers()
      ]);
    },
    lockMaps () {
      DialogActions.changeVisualizationsLockState.apply(this, [
        this.selectedMaps,
        'maps',
        this.getActionHandlers()
      ]);
    },
    deleteMaps () {
      DialogActions.deleteVisualizations.apply(this, [
        this.selectedMaps,
        'maps',
        this.getActionHandlers()
      ]);
    }
  }
};
</script>
