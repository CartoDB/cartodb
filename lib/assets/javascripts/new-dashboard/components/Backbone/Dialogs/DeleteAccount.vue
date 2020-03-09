<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';
import DeleteAccount from 'dashboard/components/delete-account/delete-account-view';

export default {
  name: 'DeleteAccount',
  mounted () {
    this.dialog = this.renderDialog();
  },
  beforeDestroy () {
    this.dialog.clean();
  },
  methods: {
    renderDialog () {
      const userModel = this.$cartoModels.user;
      const modalModel = ModalModel({
        destroy: () => {
          this.$emit('close');
        }
      });

      const deleteAccountView = new DeleteAccount({
        modalModel,
        userModel,
        client: this.$store.state.client,
        el: this.$refs.injectionHTMLElement,
        clean_on_hide: true
      });

      deleteAccountView.render();

      return deleteAccountView;
    }
  }
};
</script>
