<template>
  <BulkActions :actions="actions[actionMode]" v-on="getEventListeners()"></BulkActions>
</template>

<script>
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';

// Dialogs
import ChangePrivacy from 'new-dashboard/components/Backbone/Dialogs/ChangePrivacy';
import DuplicateMap from 'new-dashboard/components/Backbone/Dialogs/DuplicateMap';
import LockMap from 'new-dashboard/components/Backbone/Dialogs/LockMap';
import DeleteDialog from 'new-dashboard/components/Backbone/Dialogs/DeleteDialog';

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
      this.showModal(
        {
          template: `
          <Dialog v-on:close="$emit('close')">
            <ChangePrivacy :visualization="visualization" v-on:close="$emit('close')"/>
          </Dialog>`,
          props: ['visualization'],
          components: { Dialog, ChangePrivacy }
        },
        { visualization: this.selectedMaps[0] }
      );
    },
    duplicateMap () {
      this.showModal(
        {
          template: `
          <Dialog v-on:close="$emit('close')">
            <DuplicateMap :visualization="visualization" v-on:close="$emit('close')"/>
          </Dialog>`,
          props: ['visualization'],
          components: { Dialog, DuplicateMap }
        },
        { visualization: this.selectedMaps[0] }
      );
    },
    lockMap () {
      this.showModal(
        {
          template: `
          <Dialog v-on:close="$emit('close')">
            <LockMap :visualization="visualization" :contentType="contentType" v-on:close="$emit('close')"/>
          </Dialog>`,
          props: ['visualization', 'contentType'],
          components: { Dialog, LockMap }
        },
        { visualization: this.selectedMaps[0], contentType: 'maps' }
      );
    },
    lockMaps () {
      this.showModal(
        {
          template: `
          <Dialog v-on:close="$emit('close')">
            <LockMap :visualizations="visualization" :contentType="contentType" v-on:close="$emit('close')"/>
          </Dialog>`,
          props: ['visualization', 'contentType'],
          components: { Dialog, LockMap }
        },
        { visualization: this.selectedMaps, contentType: 'maps' }
      );
    },
    deleteMap () {
      this.showModal(
        {
          template: `
          <Dialog v-on:close="$emit('close')">
            <DeleteDialog :visualization="visualization" :contentType="contentType" v-on:close="$emit('close')"/>
          </Dialog>`,
          props: ['visualization', 'contentType'],
          components: { Dialog, DeleteDialog }
        },
        {
          visualization: this.selectedMaps[0],
          contentType: 'maps'
        }
      );
    },
    deleteMaps () {
      this.showModal(
        {
          template: `
          <Dialog v-on:close="$emit('close')">
            <DeleteDialog :visualizations="visualizations" :contentType="contentType" v-on:close="$emit('close')"/>
          </Dialog>`,
          props: ['visualizations', 'contentType'],
          components: { Dialog, DeleteDialog }
        },
        {
          visualizations: this.selectedMaps,
          contentType: 'maps'
        }
      );
    }
  }
};
</script>
