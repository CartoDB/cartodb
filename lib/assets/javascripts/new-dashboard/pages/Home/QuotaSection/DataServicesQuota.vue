<template>
  <QuotaContainer :title="$t(`QuotaSection.dataServices`)" :perMonth="true">
    <QuotaWidget :name="$t(`QuotaSection.geocoding`)" :usedQuota="geocodingUsed" :availableQuota="geocodingAvailable" :helpLink="geocodingHelpLink"></QuotaWidget>
    <QuotaWidget :name="$t(`QuotaSection.isolines`)" :usedQuota="isolinesUsed" :availableQuota="isolinesAvailable" :helpLink="isolinesHelpLink"></QuotaWidget>
    <QuotaWidget :name="$t(`QuotaSection.routing`)" :usedQuota="routingUsed" :availableQuota="routingAvailable" :helpLink="routingHelpLink"></QuotaWidget>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import QuotaWidget from './QuotaWidget';
import QuotaContainer from './QuotaContainer';

export default {
  name: 'DataServicesQuota',
  components: {
    QuotaWidget,
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
