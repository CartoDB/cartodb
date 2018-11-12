// Dialogs
import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import ChangePrivacy from 'new-dashboard/components/Backbone/Dialogs/ChangePrivacy';
import DuplicateMap from 'new-dashboard/components/Backbone/Dialogs/DuplicateMap';
import LockMap from 'new-dashboard/components/Backbone/Dialogs/LockMap';
import DeleteDialog from 'new-dashboard/components/Backbone/Dialogs/DeleteDialog';

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
          @deselectAll="deselectAll" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, LockMap },
      methods: {
        deselectAll: function () {
          return actionHandlers.deselectAll();
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
          @deselectAll="deselectAll" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, LockMap },
      methods: {
        deselectAll: function () {
          return actionHandlers.deselectAll();
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
          @deselectAll="deselectAll" />
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, DeleteDialog },
      methods: {
        deselectAll: function () {
          return actionHandlers.deselectAll();
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
          @deselectAll="deselectAll" />
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, DeleteDialog },
      methods: {
        deselectAll: function () {
          return actionHandlers.deselectAll();
        }
      }
    }, dialogProps
  );
}
