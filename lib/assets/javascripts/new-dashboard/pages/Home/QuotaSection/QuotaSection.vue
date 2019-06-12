<template>
  <div class="section is-bgSoftBlue section--noBorder">
    <div class="container">
      <div class="full-width">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img svg-inline src="../../../assets/icons/section-title/quota.svg">
          </template>
        <template slot="title">{{ $t('QuotaSection.title') }}</template>
        </SectionTitle>
        <ul class="grid quota-list">
          <li class="grid-cell grid-cell--col12 quota-listitem">
            <AccountQuota></AccountQuota>
          </li>
          <li class="grid-cell grid-cell--col12 quota-listitem">
            <DataServicesQuota></DataServicesQuota>
          </li>
        </ul>
        <div class="quota-billing">
          <span class="quota-billingday text is-small is-txtSoftGrey">
            {{ $tc(`QuotaSection.credits`, remainingDaysUntilLDSRenewal, { remainingDays: remainingDaysUntilLDSRenewal, day: billingDay })}}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import AccountQuota from './AccountQuota';
import DataServicesQuota from './DataServicesQuota';
import format from 'date-fns/format';
import differenceInDays from 'date-fns/difference_in_days';

export default {
  name: 'QuotasModule',
  components: {
    SectionTitle,
    AccountQuota,
    DataServicesQuota
  },
  computed: {
    ...mapState({
      billingPeriod: state => state.user.next_billing_period
    }),
    billingDay () {
      return format(new Date(this.billingPeriod), 'Do');
    },
    remainingDaysUntilLDSRenewal () {
      return differenceInDays(new Date(this.billingPeriod), new Date());
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.quota-listitem {
  &:not(:first-of-type) {
    margin-top: 64px;
  }
}

.quota-billing {
  display: flex;
  justify-content: flex-end;
  padding: 0 10px;
}

.quota-billingday {
  margin-top: 16px;

  &::before {
    content: '*';
  }
}
</style>
