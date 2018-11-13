// Dialogs
import ChangePrivacy from 'new-dashboard/components/Backbone/Dialogs/ChangePrivacy';
import DeleteDialog from 'new-dashboard/components/Backbone/Dialogs/DeleteDialog';
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import DuplicateMap from 'new-dashboard/components/Backbone/Dialogs/DuplicateMap';
import LockVisualization from 'new-dashboard/components/Backbone/Dialogs/LockVisualization';
import MapMetadata from 'new-dashboard/components/Backbone/Dialogs/MapMetadata';
import DatasetMetadata from 'new-dashboard/components/Backbone/Dialogs/DatasetMetadata';
import Share from 'new-dashboard/components/Backbone/Dialogs/Share';

export function editMapMetadata (visualization) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <MapMetadata :visualization="visualization" @close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, MapMetadata }
    },
    { visualization }
  );
}

export function editDatasetMetadata (dataset, actionHandlers) {
  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <DatasetMetadata
          :dataset="dataset"
          @updateVisualization="updateVisualization"
          @close="$emit('close')"/>
      </Dialog>`,
      props: ['dataset'],
      components: { Dialog, DatasetMetadata },
      methods: actionHandlers
    },
    { dataset }
  );
}

export function changePrivacy (visualization, actionHandlers) {
  this.showModal(
    {
      template: `
      <Dialog @close="$emit('close')">
        <ChangePrivacy
          :visualization="visualization"
          @updateVisualization="updateVisualization"
          @close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, ChangePrivacy },
      methods: actionHandlers
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
          @updateVisualization="updateVisualization"
          @close="$emit('close')" />
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, Share },
      methods: actionHandlers
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
          @fetchList="fetchList"
          @deselectAll="deselectAll"
          @close="$emit('close')" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, LockVisualization },
      methods: actionHandlers
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
          @fetchList="fetchList"
          @deselectAll="deselectAll"
          @close="$emit('close')" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, LockVisualization },
      methods: actionHandlers
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
          @fetchList="fetchList"
          @close="$emit('close')"
          @deselectAll="deselectAll" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, DeleteDialog },
      methods: actionHandlers
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
          @fetchList="fetchList"
          @close="$emit('close')"
          @deselectAll="deselectAll" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, DeleteDialog },
      methods: actionHandlers
    }, dialogProps
  );
}
