// Dialogs
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import CreateDialog from 'new-dashboard/components/Backbone/Dialogs/CreateDialog';
import ChangePrivacy from 'new-dashboard/components/Backbone/Dialogs/ChangePrivacy';
import DeleteDialog from 'new-dashboard/components/Backbone/Dialogs/DeleteDialog';
import DuplicateMap from 'new-dashboard/components/Backbone/Dialogs/DuplicateMap';
import LockMap from 'new-dashboard/components/Backbone/Dialogs/LockMap';
import MapMetadata from 'new-dashboard/components/Backbone/Dialogs/MapMetadata';
import Share from 'new-dashboard/components/Backbone/Dialogs/Share';

export function editMapMetadata (visualization) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <MapMetadata :visualization="visualization" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, MapMetadata }
    },
    { visualization }
  );
}

export function createMap (selectedDataset, backgroundPollingView) {
  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <CreateDialog :selectedItems="selectedItems" :backgroundPollingView="backgroundPollingView" @close="$emit('close')"/>
      </Dialog>`,
      props: ['selectedItems', 'backgroundPollingView'],
      components: { Dialog, CreateDialog }
    },
    {
      selectedItems: [selectedDataset],
      backgroundPollingView
    }
  );
}

export function changePrivacy (visualization) {
  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <ChangePrivacy :visualization="visualization" @close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, ChangePrivacy }
    },
    { visualization }
  );
}

export function shareVisualization (visualization) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <Share :visualization="visualization" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, Share }
    },
    { visualization }
  );
}

export function duplicateMap (visualization) {
  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <DuplicateMap :visualization="visualization" @close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, DuplicateMap }
    },
    { visualization }
  );
}

export function changeLockState (visualization, contentType, actionHandlers) {
  const dialogProps = { visualization, contentType };

  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <LockMap
          :visualization="visualization"
          :contentType="contentType"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, LockMap },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    }, dialogProps
  );
}

export function changeVisualizationsLockState (visualizations, contentType, actionHandlers) {
  const dialogProps = { visualizations, contentType };

  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <LockMap
          :visualizations="visualizations"
          :contentType="contentType"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, LockMap },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    }, dialogProps
  );
}

export function deleteVisualization (visualization, contentType, actionHandlers) {
  const dialogProps = { visualization, contentType };

  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <DeleteDialog
          :visualization="visualization"
          :contentType="contentType"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, DeleteDialog },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    }, dialogProps
  );
}

export function deleteVisualizations (visualizations, contentType, actionHandlers) {
  const dialogProps = { visualizations, contentType };

  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <DeleteDialog
          :visualizations="visualizations"
          :contentType="contentType"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, DeleteDialog },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    }, dialogProps
  );
}
