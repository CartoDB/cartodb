<template>
  <div class="u-flex u-pl--24 u-pb--24 u-pt--24">
    <div class="colum_1 u-flex__grow--1">
      <h4 class="is-small is-semibold is-txtGrey"><span class="uppercase">United States</span> · Demographics</h4>
      <h3 class="is-body is-semibold u-mt--8">5-yr ACS data at Counties level (2006 - 2010)</h3>
      <p class="u-mt--8">The American Community Survey (ACS) is an ongoing survey that provides vital information on a yearly basis about the USA and its people. More info: https://www.census.gov/programs-surveys/acs/about.html</p>
      <div class="u-flex u-mt--28 data-info">
        <div class="is-small"><span class="is-txtSoftGrey">Licence</span> Public</div>
        <div class="is-small ellipsis"><span class="is-txtSoftGrey">Geography</span> <span>Counties (2015) - shoreline c lakwdad awk aom akd mawodi maoma a adawda dad ad ad awd awd ad awd aw </span></div>
        <div class="is-small"><span class="is-txtSoftGrey">Temporal aggr.</span> <span>Yearly</span></div>
      </div>
    </div>
    <div class="colum_2 u-flex u-flex__align--end">
      <img width="36" height="36" src="../../assets/icons/subscriptions/uscensusbureau.svg">
    </div>
    <div class="colum_3">
      <SubscriptionStatus></SubscriptionStatus>
      <div class="u-mt--36 u-ml--16 u-flex u-flex__direction--column">
        <h5 class="is-txtSoftGrey is-small uppercase">{{$t('QuickActions.title')}}</h5>
        <a class="u-mt--8 is-caption" href="#">Create map  |  View dataset</a>
        <a class="u-mt--8 is-caption" href="#">Build App</a>
        <a class="u-mt--8 is-caption" href="#">Explore Notebook</a>
      </div>
    </div>
  </div>
</template>

<script>

import SubscriptionStatus from './SubscriptionStatus';

export default {
  name: 'SubscriptionCard',
  components: {
    SubscriptionStatus
  },
  props: {},
  data: function () {
    return {};
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.colum_1 {
  min-width: 0;
  p {
    font-size: 14px;
    line-height: 1.43;
  }
  .data-info {
    div {
      white-space: nowrap;
      &.ellipsis {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      & + div {
        margin-left: 24px;
      }
    }
  }
}
.colum_2 {
  flex: 0 0 36px;
  margin: 0 48px;
}
.colum_3 {
  flex: 0 0 282px;
}
.uppercase {
  text-transform: uppercase;
}
</style>
