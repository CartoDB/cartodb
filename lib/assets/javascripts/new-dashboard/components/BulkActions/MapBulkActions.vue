<template>
  <BulkActions :actions="actions[actionMode]" v-on="getEventListeners()"></BulkActions>
</template>

<script>
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';
import * as Visualization from 'new-dashboard/core/models/visualization';

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
          {
            name: this.$t('BulkActions.maps.selectAllMaps'),
            event: 'selectAll',
            shouldBeHidden: this.areAllMapsSelected
          },
          {
            name: this.$t('BulkActions.maps.changeMapPrivacy'),
            event: 'changePrivacy',
            shouldBeHidden: this.isAnyShared || this.isAnyLocked
          },
          {
            name: this.$t('BulkActions.maps.duplicateMap'),
            event: 'duplicateMap'
          },
          {
            name: this.$t('BulkActions.maps.lockMap'),
            event: 'lockMap',
            shouldBeDisabled: this.isAnyShared && !this.areAllLocked,
            shouldBeHidden: this.isAnyLocked
          },
          {
            name: this.$t('BulkActions.maps.unlockMap'),
            event: 'unlockMap',
            shouldBeDisabled: this.isAnyShared && this.areAllLocked,
            shouldBeHidden: !this.areAllLocked
          },
          {
            name: this.$t('BulkActions.maps.deleteMap'),
            event: 'deleteMap',
            isDestructive: true,
            shouldBeDisabled: this.isAnyShared && !this.isAnyLocked,
            shouldBeHidden: this.isAnyLocked
          }
        ],
        multiple: [
          {
            name: this.$t('BulkActions.maps.selectAllMaps'),
            event: 'selectAll',
            shouldBeHidden: this.areAllMapsSelected
          },
          {
            name: this.$t('BulkActions.maps.deselectAllMaps'),
            event: 'deselectAll'
          },
          {
            name: this.$t('BulkActions.maps.lockMaps'),
            event: 'lockMaps',
            shouldBeDisabled: this.isAnyShared && !this.areAllLocked,
            shouldBeHidden: this.isAnyLocked
          },
          {
            name: this.$t('BulkActions.maps.unlockMaps'),
            event: 'unlockMaps',
            shouldBeDisabled: this.isAnyShared && this.areAllLocked,
            shouldBeHidden: !this.areAllLocked
          },
          {
            name: this.$t('BulkActions.maps.deleteMaps'),
            event: 'deleteMaps',
            isDestructive: true,
            shouldBeDisabled: this.isAnyShared && !this.isAnyLocked,
            shouldBeHidden: this.isAnyLocked
          }
        ]
      };
    },
    actionMode () {
      return this.selectedMaps.length > 1 ? 'multiple' : 'single';
    },
    isAnyShared () {
      return this.selectedMaps.some(map => Visualization.isSharedWithMe(map, this.$cartoModels));
    },
    isAnyLocked () {
      return this.selectedMaps.some(map => map.locked);
    },
    areAllLocked () {
      return this.selectedMaps.every(map => map.locked);
    }
  },
  methods: {
    getActionHandlers () {
      return {
        deselectAll: () => {
          this.deselectAll();
        },
        fetchList: () => {
          this.$store.dispatch('maps/fetch');
        },
        updateVisualization: (model) => {
          this.$store.dispatch('maps/updateVisualization', { visualizationId: model.get('id'), visualizationAttributes: model.attributes });
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
      DialogActions.changePrivacy.apply(this, [this.selectedMaps[0], this.getActionHandlers()]);
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
