<template>
  <div class="section is-bgSoftBlue section--noBorder">
    <div class="container">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title="$t(`QuotaSection.title`)">
          <template slot="icon">
            <img svg-inline src="../../../assets/icons/section-title/quota.svg">
          </template>
        </SectionTitle>
        <ul class="grid quota-list">
          <li class="grid-cell grid-cell--col12 quota-listitem">
            <QuotaContainer :title="$t(`QuotaSection.disk`)" :perMonth="false">
              <QuotaWidget :name="$t(`QuotaSection.storage`)" :usedQuota="getAmountInUnit(usedStorage, amountExponent)" :availableQuota="getAmountInUnit(availableStorage, amountExponent)" :unit="getUnit(amountExponent)"></QuotaWidget>
            </QuotaContainer>
          </li>
          <li class="grid-cell grid-cell--col12 quota-listitem">
            <QuotaContainer :title="$t(`QuotaSection.dataServices`)" :perMonth="true">
              <QuotaWidget :name="$t(`QuotaSection.geocoding`)" :usedQuota="geocodingUsed" :availableQuota="geocodingAvailable"></QuotaWidget>
              <QuotaWidget :name="$t(`QuotaSection.isolines`)" :usedQuota="isolinesUsed" :availableQuota="isolinesAvailable"></QuotaWidget>
              <QuotaWidget :name="$t(`QuotaSection.routing`)" :usedQuota="routingUsed" :availableQuota="routingAvailable"></QuotaWidget>
            </QuotaContainer>
          </li>
        </ul>
        <div class="quota-billing">
          <span class="quota-billingday text is-small is-txtSoftGrey">{{ $t(`QuotaSection.credits`, { day: billingDay })}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import QuotaWidget from './QuotaWidget';
import QuotaContainer from './QuotaContainer';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import format from 'date-fns/format';

export default {
  name: 'QuotasModule',
  components: {
    QuotaWidget,
    QuotaContainer,
    SectionTitle
  },
  computed: {
    ...mapState({
      availableStorage: state => state.user.quota_in_bytes,
      remainingStorage: state => state.user.remaining_byte_quota,
      geocodingUsed: state => state.user.geocoding.monthly_use,
      geocodingAvailable: state => state.user.geocoding.quota,
      routingUsed: state => state.user.mapzen_routing.monthly_use,
      routingAvailable: state => state.user.mapzen_routing.quota ? state.user.mapzen_routing.quota : 0,
      isolinesUsed: state => state.user.here_isolines.monthly_use,
      isolinesAvailable: state => state.user.here_isolines.quota,
      billingPeriod: state => state.user.next_billing_period
    }),
    usedStorage () {
      return this.availableStorage - this.remainingStorage;
    },
    amountExponent () {
      return this.getExpBaseTwo(this.availableStorage) - 10;
    },
    billingDay () {
      return format(new Date(this.billingPeriod), 'Do');
    }
  },
  methods: {
    getExpBaseTwo (sizeInBytes) {
      if (sizeInBytes === 0) {
        return 0;
      }

      let exponent = 0;
      if (Math.log2) {
        exponent = Math.log2(sizeInBytes);
      } else {
        exponent = Math.log(sizeInBytes) * Math.LOG2E;
      }
      return Math.floor(exponent);
    },
    getUnit (exponent) {
      if (exponent < 10) {
        return 'B';
      } else if (exponent < 20) {
        return 'KB';
      } else if (exponent < 30) {
        return 'MB';
      } else if (exponent < 40) {
        return 'GB';
      } else if (exponent < 50) {
        return 'TB';
      } else if (exponent < 60) {
        return 'PB';
      } else if (exponent < 70) {
        return 'EB';
      } else {
        return '?';
      }
    },
    getAmountInUnit (number, exponent) {
      return number / Math.pow(2, exponent);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

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
