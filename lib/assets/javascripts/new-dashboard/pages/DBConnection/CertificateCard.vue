<template>
  <article class="card-certificate">
    <div class="certificate__info">
      <div class="certificate__icon">icon</div>
      <div class="certificate__name">{{ certificate.id }} · {{ certificate.name }}</div>
      <div class="certificate__actions">
        <!-- Cambiar estas clases -->
        <button type="button" class="button button--outline button--delete u-mr--48" @click="revoke">
          Revoke
        </button>
      </div>
    </div>
    <!-- Cuidado con el null -->
    <div class="certificate__expiration">Expiring {{ certificate.expiration }}</div>

    <ConfirmActionDialog
      ref="confirmActionDialog"
      :title="`Quieres borrar ${certificate.id}?`"
      :modalId="certificate.id"
      description="Lorem ipsum"
      confirmText="Ok, boomer"
      cancelText="Cancel"
      @confirm="onRevokeActionCalled">
    </ConfirmActionDialog>
  </article>
</template>

<script>
import { mapState } from 'vuex';
import ConfirmActionDialog from 'new-dashboard/components/Dialogs/DestructiveActionDialog.vue';

export default {
  name: 'CertificateCard',
  components: { ConfirmActionDialog },

  props: {
    certificate: {
      type: Object,
      default: () => ({
        id: '',
        name: '',
        expiration: ''
      })
    }
  },

  computed: mapState({
    client: state => state.client
  }),

  methods: {
    revoke () {
      this.$refs.confirmActionDialog.open();
    },

    onRevokeActionCalled () {
      this.$store.dispatch('directDBConnection/certificates/revoke', this.certificate.id)
        .then(() => this.$emit('revoke'));
    }
  }
};
</script>

<style lang="scss" scoped>
.certificate__info {
  display: flex;
}

.certificate__name {
  flex: 1 0 auto;
}
</style>
