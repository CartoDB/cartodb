// Dialogs
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import CreateDialog from 'new-dashboard/components/Backbone/Dialogs/CreateDialog';
import ChangePrivacy from 'new-dashboard/components/Backbone/Dialogs/ChangePrivacy';
import DeleteDialog from 'new-dashboard/components/Backbone/Dialogs/DeleteDialog';
import DeleteExternalMapsDialog from 'new-dashboard/components/Dialogs/DeleteExternalMapsDialog';
import DuplicateMap from 'new-dashboard/components/Backbone/Dialogs/DuplicateMap';
import LockVisualization from 'new-dashboard/components/Backbone/Dialogs/LockVisualization';
import MapMetadata from 'new-dashboard/components/Backbone/Dialogs/MapMetadata';
import DatasetMetadata from 'new-dashboard/components/Backbone/Dialogs/DatasetMetadata';
import Share from 'new-dashboard/components/Backbone/Dialogs/Share';
import ShareViaUrl from 'new-dashboard/components/Backbone/Dialogs/ShareViaUrl';

export function editMapMetadata (visualization, actionHandlers) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <MapMetadata
          :visualization="visualization"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, MapMetadata },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    },
    { visualization }
  );
}

export function editDatasetMetadata (dataset, actionHandlers) {
  this.showModal(
    {
      template: `
        <DatasetMetadata
          :dataset="dataset"
          @close="$emit('close')"
          v-on="getEventListeners()" />`,
      props: ['dataset'],
      components: { Dialog, DatasetMetadata },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    },
    { dataset }
  );
}

export function createMap (selectedDatasets, backgroundPollingView, mamufasImportView) {
  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <CreateDialog :selectedItems="selectedItems" :backgroundPollingView="backgroundPollingView" :mamufasImportView="mamufasImportView" @close="$emit('close')"/>
      </Dialog>`,
      props: ['selectedItems', 'backgroundPollingView', 'mamufasImportView'],
      components: { Dialog, CreateDialog }
    },
    {
      selectedItems: selectedDatasets,
      backgroundPollingView,
      mamufasImportView
    }
  );
}

export function changePrivacy (visualization, actionHandlers) {
  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <ChangePrivacy
          :visualization="visualization"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, ChangePrivacy },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    },
    { visualization }
  );
}

export function shareVisualization (visualization, actionHandlers) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <Share
          :visualization="visualization"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, Share },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    },
    { visualization }
  );
}

export function duplicateVisualization (visualization) {
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
        <LockVisualization
          :visualization="visualization"
          :contentType="contentType"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, LockVisualization },
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
        <LockVisualization
          :visualizations="visualizations"
          :contentType="contentType"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, LockVisualization },
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

export function deleteExternalVisualizations (visualizations) {
  const dialogProps = { visualizations };
  this.showModal(
    {
      template: `
        <Dialog v-on:close="$emit('close')">
          <DeleteExternalMapsDialog
            :visualizations="visualizations"
            @close="$emit('close')"/>
        </Dialog>
      `,
      props: ['visualizations'],
      components: { Dialog, DeleteExternalMapsDialog },
      methods: {}
    }, dialogProps
  );
}

export function shareViaUrl (visualization, actionHandlers) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <ShareViaUrl
          :visualization="visualization"
          @close="$emit('close')"
          v-on="getEventListeners()" />
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, ShareViaUrl },
      methods: {
        getEventListeners: function () {
          return actionHandlers || {};
        }
      }
    },
    { visualization }
  );
}
