<template>
  <section>
    <div class="container warning-container">
      <div class="warning-icon">
        <img src="../../assets/icons/common/warning-icon.svg" />
      </div>
      <h2 class="warning-title title is-title is-txtDarkBlue is-bold">
        {{ $t('TrialExpired.ExpirationMessage.title') }}
      </h2>
      <p class="text is-body is-txtDarkBlue">
         {{ this.trialExpiredMessage }}
      </p>
      <p class="warning-description text is-body is-txtDarkBlue"
         v-html="$t('TrialExpired.ExpirationMessage.description.phrase2', { expirationDays: this.expirationDays } )">
      </p>
      <div class="buttons-container">
        <a :href="addPaymentsURL" class="button upgrade-button is-caption">
          {{ $t('TrialExpired.ExpirationMessage.actions.addPayments') }}
        </a>
        <a @click="deleteAccount" class="button button--ghost is-txtDarkBlue is-caption">
          {{ $t('TrialExpired.ExpirationMessage.actions.deleteAccount') }}
        </a>
      </div>
    </div>
  </section>
</template>

<script>
import Dialog from 'new-dashboard/components/Backbone/Dialog';
import DeleteAccount from 'new-dashboard/components/Backbone/Dialogs/DeleteAccount.vue';
import format from 'date-fns/format';

export default {
  name: 'ExpirationMessage',
  props: {
    addPaymentsURL: String,
    expirationDays: {
      default: null
    }
  },
  computed: {
    trialExpiredMessage () {
      return (this.hasTrialExpirationDate
        ? this.$t('TrialExpired.ExpirationMessage.description.phrase1.withDate', { expirationDate: this.humanReadableExpirationDate })
        : this.$t('TrialExpired.ExpirationMessage.description.phrase1.noDate'));
    },
    hasTrialExpirationDate () {
      return this.$store.state.user.trial_ends_at;
    },
    humanReadableExpirationDate () {
      return format(this.$store.state.user.trial_ends_at, 'MMMM DD, YYYY');
    }
  },
  methods: {
    deleteAccount () {
      this.$modal.show({
        template: `
        <Dialog @close="$emit('close')">
          <DeleteAccount @close="$emit('close')"/>
        </Dialog>`,
        components: { Dialog, DeleteAccount }
      }, {}, { width: '100%', height: '100%' });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.upgrade-button {
  margin-right: 64px;
  background-color: $button-lockout__bg-color;
}

.link {
  text-decoration: underline;
}

.warning-container {
  text-align: center;
}

.warning-icon {
  margin-bottom: 48px;
}

.warning-title {
  margin-bottom: 16px;
}

.warning-description {
  margin-bottom: 16px;
}

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36px;
}
</style>
