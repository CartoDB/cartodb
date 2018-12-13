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
          <QuotasModule></QuotasModule>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
// import { mapState } from 'vuex';
import Welcome from '../components/Home/Welcome';
import QuotasModule from '../components/Quotas/QuotasModule';
import SectionTitle from '../components/SectionTitle';

export default {
  name: 'Home',
  components: {
    Welcome,
    QuotasModule,
    SectionTitle
  },
  data () {
    return {
      msg: "Welcome to CARTO\'s new dashboard"
    };
  }
};
</script>
