<template>
  <ul class="grid">
    <li class="vertical-space grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
      <QuotaContainer>
        <QuotaWidget :name="$t(`Limits.storage`)" :quotaType="$t(`Limits.quota`)" :usedQuota="divideBaseTwo(usedStorage, getBaseTwo)" :availableQuota="divideBaseTwo(availableStorage, getBaseTwo)" :unit="getUnitFromBaseTwo(getBaseTwo)"></QuotaWidget>
      </QuotaContainer>
    </li>
    <li class="vertical-space grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
      <QuotaContainer>
        <QuotaWidget :name="$t(`Limits.geocoding`)" :quotaType="$t(`Limits.credits`)" :usedQuota="geocodingUsed" :availableQuota="geocodingAvailable"></QuotaWidget>
      </QuotaContainer>
    </li>
    <li class="vertical-space grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
      <QuotaContainer>
        <QuotaWidget :name="$t(`Limits.isolines`)" :quotaType="$t(`Limits.credits`)" :usedQuota="isolinesUsed" :availableQuota="isolinesAvailable" mode="compact"></QuotaWidget>
        <QuotaWidget :name="$t(`Limits.routing`)" :quotaType="$t(`Limits.credits`)" :usedQuota="routingUsed" :availableQuota="routingAvailable" mode="compact"></QuotaWidget>
      </QuotaContainer>
    </li>
  </ul>
</template>

<script>
import { mapState } from 'vuex';
import QuotaWidget from 'new-dashboard/components/Quotas/QuotaWidget';
import QuotaContainer from 'new-dashboard/components/Quotas/QuotaContainer';

export default {
  name: 'QuotasModule',
  components: {
    QuotaWidget,
    QuotaContainer
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
      isolinesAvailable: state => state.user.here_isolines.quota
    }),
    usedStorage () {
      return this.availableStorage - this.remainingStorage;
    },
    getBaseTwo () {
      return this.baseTwoRepresentation(this.availableStorage);
    }
  },
  methods: {
    baseTwoRepresentation (initialByte) {
      let i = 0;
      let value = initialByte;
      while (value > 1024) {
        value = value / 1024;
        i = i + 1;
      }
      return (i * 10);
    },
    getUnitFromBaseTwo (baseTwo) {
      if (baseTwo < 10) {
        return 'B';
      } else if (baseTwo < 20) {
        return 'Kb';
      } else if (baseTwo < 30) {
        return 'MB';
      } else if (baseTwo < 40) {
        return 'GB';
      } else if (baseTwo < 50) {
        return 'TB';
      } else if (baseTwo < 60) {
        return 'PB';
      } else if (baseTwo < 70) {
        return 'EB';
      } else {
        return '?';
      }
    },
    divideBaseTwo (number, baseTwo) {
      return number / Math.pow(2, baseTwo);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.vertical-space {
  margin-bottom: 10px;
}

</style>
