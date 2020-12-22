<template>
  <QuotaContainer :title="$t(`QuotaSection.dataServices`)" :perMonth="true">
    <StackedQuotaWidget :name="$t(`QuotaSection.geocoding`)" :usedQuota="geocodingUsed" :availableQuota="geocodingAvailable" :helpLink="geocodingHelpLink"></StackedQuotaWidget>
    <StackedQuotaWidget :name="$t(`QuotaSection.isolines`)" :usedQuota="isolinesUsed" :availableQuota="isolinesAvailable" :helpLink="isolinesHelpLink"></StackedQuotaWidget>
    <StackedQuotaWidget :name="$t(`QuotaSection.routing`)" :usedQuota="routingUsed" :availableQuota="routingAvailable" :helpLink="routingHelpLink"></StackedQuotaWidget>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import StackedQuotaWidget from './StackedQuotaWidget';
import QuotaContainer from './QuotaContainer';

export default {
  name: 'DataServicesQuota',
  components: {
    StackedQuotaWidget,
    QuotaContainer
  },
  computed: {
    ...mapState({
      geocodingUsed: state => state.user.geocoding.monthly_use,
      geocodingAvailable: state => state.user.geocoding.quota,
      routingUsed: state => state.user.mapzen_routing.monthly_use,
      routingAvailable: state => state.user.mapzen_routing.quota ? state.user.mapzen_routing.quota : 0,
      isolinesUsed: state => state.user.here_isolines.monthly_use,
      isolinesAvailable: state => state.user.here_isolines.quota
    }),
    geocodingHelpLink () {
      return 'https://carto.com/help/working-with-data/geocoding/';
    },
    isolinesHelpLink () {
      return 'https://carto.com/help/working-with-data/isolines/';
    },
    routingHelpLink () {
      return 'https://carto.com/help/working-with-data/routing/';
    }
  }
};
</script>
