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
      <Dialog v-on:close="$emit('close')">
        <ChangePrivacy :visualization="visualization" v-on:close="$emit('close')"/>
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
      <Dialog v-on:close="$emit('close')">
        <DuplicateMap :visualization="visualization" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization'],
      components: { Dialog, DuplicateMap }
    },
    { visualization }
  );
}

export function changeLockState (visualization, contentType) {
  const dialogProps = { visualization, contentType };

  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <LockMap :visualization="visualization" :contentType="contentType" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, LockMap }
    }, dialogProps
  );
}

export function changeVisualizationsLockState (visualizations, contentType) {
  const dialogProps = { visualizations, contentType };

  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <LockMap :visualizations="visualizations" :contentType="contentType" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, LockMap }
    }, dialogProps
  );
}

export function deleteVisualization (visualization, contentType) {
  const dialogProps = { visualization, contentType };

  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <DeleteDialog :visualization="visualization" :contentType="contentType" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualization', 'contentType'],
      components: { Dialog, DeleteDialog }
    }, dialogProps
  );
}

export function deleteVisualizations (visualizations, contentType) {
  const dialogProps = { visualizations, contentType };

  this.showModal(
    {
      template: `
      <Dialog v-on:close="$emit('close')">
        <DeleteDialog :visualizations="visualizations" :contentType="contentType" v-on:close="$emit('close')"/>
      </Dialog>`,
      props: ['visualizations', 'contentType'],
      components: { Dialog, DeleteDialog }
    }, dialogProps
  );
}
