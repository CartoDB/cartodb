<template>
  <BulkActions :actions="actions[actionMode]" v-on="getEventListeners()"></BulkActions>
</template>

<script>
import { mapGetters } from 'vuex';
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';
import * as DialogActions from 'new-dashboard/core/dialog-actions';

export default {
  name: 'ExternalMapBulkActions',
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
    ...mapGetters({
      isOutOfPublicMapsQuota: 'user/isOutOfPublicMapsQuota'
    }),
    actions () {
      return {
        single: [
          {
            name: this.$t('BulkActions.maps.selectAll'),
            event: 'selectAll',
            shouldBeHidden: this.areAllMapsSelected
          },
          {
            name: this.$t('BulkActions.maps.delete'),
            event: 'deleteMaps',
            isDestructive: true
          }
        ],
        multiple: [
          {
            name: this.$t('BulkActions.maps.selectAll'),
            event: 'selectAll',
            shouldBeHidden: this.areAllMapsSelected
          },
          {
            name: this.$t('BulkActions.maps.deselectAll'),
            event: 'deselectAll'
          },
          {
            name: this.$t('BulkActions.maps.delete'),
            event: 'deleteMaps',
            isDestructive: true
          }
        ]
      };
    },
    actionMode () {
      return this.selectedMaps.length > 1 ? 'multiple' : 'single';
    },
    isSelectedMapPrivate () {
      return this.selectedMaps.some(map => ['PRIVATE'].includes(map.privacy));
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
    deleteMaps () {
      DialogActions.deleteExternalVisualizations.apply(this, [this.selectedMaps]);
    }
  }
};
</script>
