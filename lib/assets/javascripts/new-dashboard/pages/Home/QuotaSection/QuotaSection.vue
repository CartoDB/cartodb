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
            <MemoryQuota></MemoryQuota>
          </li>
          <li class="grid-cell grid-cell--col12 quota-listitem" v-if="showMapLoadsMetrics">
            <MapLoadsQuota></MapLoadsQuota>
            <div class="quota-billing">
              <span class="quota-billingday text is-small is-txtSoftGrey">
                {{ $t(`QuotaSection.credits`, { day: billingDay })}}
              </span>
            </div>
          </li>
          <li class="grid-cell grid-cell--col12 quota-listitem">
            <DataServicesQuota></DataServicesQuota>
          </li>
        </ul>
        <div class="quota-billing">
          <span class="quota-billingday text is-small is-txtSoftGrey">
            {{ $t(`QuotaSection.credits`, { day: billingDay })}}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { hasFeatureEnabled } from 'new-dashboard/core/models/user';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import MemoryQuota from './MemoryQuota';
import MapLoadsQuota from './MapLoadsQuota';
import DataServicesQuota from './DataServicesQuota';
import format from 'date-fns/format';

export default {
  name: 'QuotasModule',
  components: {
    SectionTitle,
    MemoryQuota,
    MapLoadsQuota,
    DataServicesQuota
  },
  computed: {
    ...mapState({
      billingPeriod: state => state.user.next_billing_period,
      showMapLoadsMetrics: state => hasFeatureEnabled(state.user, 'map_loads_metric_enabled')
    }),
    billingDay () {
      return format(new Date(this.billingPeriod), 'Do');
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
