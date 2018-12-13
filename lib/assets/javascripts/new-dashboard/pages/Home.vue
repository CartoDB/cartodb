<template>
  <section class="page">
    <Welcome></Welcome>
    <div class="section is-bgSoftBlue">
      <div class="container">
        <div class="full-width">
          <SectionTitle class="grid-cell" :title="$t(`Limits.usage-quotas`)">
            <template slot="icon">
              <img src="../assets/icons/section-title/quota.svg">
            </template>
        </SectionTitle>

          <ul class="grid">
            <li class="vertical-space grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <QuotaContainer>
                <QuotaWidget :name="$t(`Limits.storage`)" :amount="$t(`Limits.quota`)" :usedCapacity="divideBaseTwo(usedStorage, getBaseTwo)" :availableCapacity="divideBaseTwo(availableStorage, getBaseTwo)" :unit="getUnitFromBaseTwo(getBaseTwo)"></QuotaWidget>
              </QuotaContainer>
            </li>
            <li class="vertical-space grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <QuotaContainer>
                <QuotaWidget :name="$t(`Limits.geocoding`)" :amount="$t(`Limits.credits`)" :usedCapacity="geocodingUsed" :availableCapacity="geocodingAvailable"></QuotaWidget>
              </QuotaContainer>
            </li>
            <li class="vertical-space grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <QuotaContainer>
                <QuotaWidget :name="$t(`Limits.isolines`)" :amount="$t(`Limits.credits`)" :usedCapacity="isolinesUsed" :availableCapacity="isolinesAvailable" type="compact"></QuotaWidget>
                <QuotaWidget :name="$t(`Limits.routing`)" :amount="$t(`Limits.credits`)" :usedCapacity="routingUsed" :availableCapacity="routingAvailable" type="compact"></QuotaWidget>
              </QuotaContainer>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
// import { mapState } from 'vuex';
import Welcome from '../components/Home/Welcome';
import QuotaWidget from '../components/Quotas/QuotaWidget';
import QuotaContainer from '../components/Quotas/QuotaContainer';
import SectionTitle from '../components/SectionTitle';

export default {
  name: 'Home',
  components: {
    Welcome,
    QuotaWidget,
    QuotaContainer,
    SectionTitle
  },
  data () {
    return {
      msg: "Welcome to CARTO\'s new dashboard"
    };
  },
  computed: {
    availableStorage () {
      return this.$store.state.user.quota_in_bytes;
    },
    usedStorage () {
      return this.availableStorage - this.$store.state.user.remaining_byte_quota;
    },
    getBaseTwo () {
      return this.baseTwoRepresentation(this.availableStorage);
    },
    geocodingUsed () {
      return this.$store.state.user.geocoding.monthly_use;
    },
    geocodingAvailable () {
      return this.$store.state.user.geocoding.quota;
    },
    routingUsed () {
      return this.$store.state.user.mapzen_routing.monthly_use;
    },
    routingAvailable () {
      return this.$store.state.user.mapzen_routing.quota ? this.$store.state.user.mapzen_routing.quota : 0;
    },
    isolinesUsed () {
      return this.$store.state.user.here_isolines.monthly_use;
    },
    isolinesAvailable () {
      return this.$store.state.user.here_isolines.quota;
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
