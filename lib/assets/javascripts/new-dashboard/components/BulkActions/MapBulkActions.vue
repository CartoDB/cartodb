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
          { name: this.$t('BulkActions.maps.deleteMap'), event: 'deleteMap' }
        ],
        multiple: [
          { name: this.$t('BulkActions.maps.selectAllMaps'), event: 'selectAll' },
          { name: this.$t('BulkActions.maps.deselectAllMaps'), event: 'deselectAll' },
          { name: this.$t('BulkActions.maps.lockMaps'), event: 'lockMaps' },
          { name: this.$t('BulkActions.maps.deleteMaps'), event: 'deleteMaps' }
        ],
        lock: [
          { name: this.$t('BulkActions.maps.unlockMap'), event: 'unlockMap' }
        ]
      }
    };
  },
  computed: {
    actionMode () {
      const isAnyMapLocked = this.selectedMaps.some(map => map.locked);

      if (isAnyMapLocked) {
        return 'lock';
      }

      return this.selectedMaps.length > 1 ? 'multiple' : 'single';
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
    lockMap () {
      DialogActions.lockVisualization.apply(this, [this.selectedMaps[0], 'maps']);
    },
    deleteMap () {
      DialogActions.deleteVisualization.apply(this, [this.selectedMaps[0], 'maps']);
    },
    lockMaps () {
      DialogActions.lockVisualizations.apply(this, [this.selectedMaps, 'maps']);
    },
    deleteMaps () {
      DialogActions.deleteVisualizations.apply(this, [this.selectedMaps, 'maps']);
    }
  }
};
</script>
