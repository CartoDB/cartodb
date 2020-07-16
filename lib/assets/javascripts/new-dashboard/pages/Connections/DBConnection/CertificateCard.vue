<template>
  <article class="certificate-card">
    <div class="certificate__info">
      <div class="certificate__name">{{ certificate.name }}</div>
      <div class="certificate__actions">
        <button type="button" class="button button--ghost button--small button--revoke" @click="revoke">
          {{ $t('CertificateCard.revoke') }}
        </button>
      </div>
    </div>

    <div class="certificate__expiration" v-if="certificate.expiration">
      {{ $t('CertificateCard.expiration', { expirationDate }) }}
    </div>

    <ConfirmActionDialog
      ref="confirmActionDialog"
      :modalId="certificate.id"
      :title="$t('CertificateCard.revocation.title')"
      :description="$t('CertificateCard.revocation.description')"
      :confirmText="$t('CertificateCard.revocation.confirm')"
      :cancelText="$t('CertificateCard.revocation.cancel')"
      @confirm="onRevokeActionCalled">
    </ConfirmActionDialog>
  </article>
</template>

<script>
import { mapState } from 'vuex';
import format from 'date-fns/format';
import ConfirmActionDialog from 'new-dashboard/components/Dialogs/ConfirmActionDialog';

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

  computed: {
    expirationDate () {
      return format(this.$props.certificate.expiration, 'MMMM DD, YYYY, HH:mm a');
    },
    ...mapState({
      client: state => state.client
    })
  },

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
@import 'new-dashboard/styles/variables';

.certificate-card {
  border-bottom: 1px solid $settings_border-color;
  padding: 24px 0;
}

.certificate__info {
  display: flex;
  align-items: center;
  font-family: 'Open Sans', sans-serif;
}

.certificate__name {
  flex: 1 0 auto;
}

.certificate__name,
.certificate__expiration {
  font-size: 12px;
}

.certificate__name {
  font-weight: 600;
}

.certificate__expiration {
  margin-top: 8px;
  color: $neutral--600;
}

.button--revoke {
  padding: 0;
  font-size: 12px;
  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
  text-transform: initial;
  color: $red--700;
}
</style>
