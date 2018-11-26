<template>
  <BulkActions :actions="actions[actionMode]" v-on="getEventListeners()"></BulkActions>
</template>

<script>
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';
import * as Table from 'new-dashboard/core/table';

export default {
  name: 'DatasetBulkActions',
  inject: ['backboneViews'],
  components: {
    BulkActions
  },
  props: {
    areAllDatasetsSelected: {
      type: Boolean,
      default: false
    },
    selectedDatasets: {
      type: Array,
      required: true
    }
  },
  computed: {
    actions () {
      return {
        single: [
          { name: this.$t('BulkActions.datasets.selectAllDatasets'), event: 'selectAll' },
          { name: this.$t('BulkActions.datasets.createMap'), event: 'createMap' },
          { name: this.$t('BulkActions.datasets.changeDatasetPrivacy'), event: 'changePrivacy' },
          { name: this.$t('BulkActions.datasets.duplicateDataset'), event: 'duplicateDataset' },
          { name: this.$t('BulkActions.datasets.lockDataset'), event: 'lockDataset' },
          { name: this.$t('BulkActions.datasets.deleteDataset'), event: 'deleteDataset', isDestructive: true }
        ],
        multiple: [
          { name: this.$t('BulkActions.datasets.createMap'), event: 'createMap' },
          { name: this.$t('BulkActions.datasets.selectAllDatasets'), event: 'selectAll', shouldBeHidden: this.areAllDatasetsSelected },
          { name: this.$t('BulkActions.datasets.deselectAllDatasets'), event: 'deselectAll' },
          { name: this.$t('BulkActions.datasets.lockDatasets'), event: 'lockDatasets' },
          { name: this.$t('BulkActions.datasets.deleteDatasets'), event: 'deleteDatasets', isDestructive: true }
        ],
        lock: [
          { name: this.$t('BulkActions.datasets.unlockDataset'), event: 'unlockDataset' }
        ],
        multipleLock: [
          { name: this.$t('BulkActions.datasets.unlockDatasets'), event: 'unlockDatasets' }
        ]
      };
    },
    actionMode () {
      const isAnyDatasetLocked = this.selectedDatasets.filter(dataset => dataset.locked);

      if (isAnyDatasetLocked.length) {
        return isAnyDatasetLocked.length > 1 ? 'multipleLock' : 'lock';
      }

      return this.selectedDatasets.length > 1 ? 'multiple' : 'single';
    }
  },
  methods: {
    getActionHandlers () {
      return {
        deselectAll: () => {
          this.deselectAll();
        },
        fetchList: () => {
          this.$store.dispatch('datasets/fetchDatasets');
        },
        updateVisualization: (model) => {
          this.$store.dispatch('datasets/updateDataset', { datasetId: model.get('id'), datasetAttributes: model.attributes });
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
    createMap () {
      DialogActions.createMap.apply(this, [
        this.selectedDatasets,
        this.backboneViews.backgroundPollingView.getBackgroundPollingView(),
        this.backboneViews.mamufasImportView.getView()
      ]);
    },
    changePrivacy () {
      DialogActions.changePrivacy.apply(this, [this.selectedDatasets[0], this.getActionHandlers()]);
    },
    duplicateDataset () {
      const selectedDataset = this.selectedDatasets[0];
      const bgPollingView = this.backboneViews.backgroundPollingView.getBackgroundPollingView();

      bgPollingView._addDataset({
        type: 'duplication',
        table_name: `${Table.getUnqualifiedName(selectedDataset.name)}_copy`,
        value: selectedDataset.name,
        create_vis: false
      });
      this.deselectAll();
    },
    unlockDataset () {
      DialogActions.changeLockState.apply(this, [
        this.selectedDatasets[0],
        'datasets',
        this.getActionHandlers()
      ]);
    },
    lockDataset () {
      DialogActions.changeLockState.apply(this, [
        this.selectedDatasets[0],
        'datasets',
        this.getActionHandlers()
      ]);
    },
    deleteDataset () {
      DialogActions.deleteVisualization.apply(this, [
        this.selectedDatasets[0],
        'datasets',
        this.getActionHandlers()
      ]);
    },
    unlockDatasets () {
      DialogActions.changeVisualizationsLockState.apply(this, [
        this.selectedDatasets,
        'datasets',
        this.getActionHandlers()
      ]);
    },
    lockDatasets () {
      DialogActions.changeVisualizationsLockState.apply(this, [
        this.selectedDatasets,
        'datasets',
        this.getActionHandlers()
      ]);
    },
    deleteDatasets () {
      DialogActions.deleteVisualizations.apply(this, [
        this.selectedDatasets,
        'datasets',
        this.getActionHandlers()
      ]);
    }
  }
};
</script>
