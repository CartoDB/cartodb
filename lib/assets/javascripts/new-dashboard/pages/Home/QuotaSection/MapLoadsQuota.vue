<template>
  <QuotaContainer :title="$t(`QuotaSection.mapLoads`)" :perMonth="true">
    <StackedQuotaWidget
      :name="$t(`QuotaSection.quota`)"
      :usedQuota="mapViews"
      :availableQuota="mapViewsQuota"
      :formatToLocale="true"
      :helpLink="helpLink" qualitative/>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import QuotaContainer from './QuotaContainer';
import StackedQuotaWidget from './StackedQuotaWidget';

export default {
  name: 'MapLoadsQuota',
  components: {
    StackedQuotaWidget,
    QuotaContainer
  },
  data () {
    return {
    };
  },
  computed: {
    ...mapState({
      mapViewsQuota: state => state.user.map_views_quota,
      mapViews: state => state.user.map_views
    }),
    helpLink () {
      return 'https://carto.com/help/glossary/#mapload';
    }
  },
  methods: {
  }
};
</script>
