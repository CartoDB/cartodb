<template>
  <section class="kuviz">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../../assets/icons/section-title/map.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('KuvizPage.header') }}</span>
          </template>
          <template slot="actionButton">
            <router-link
              class="button is-primary"
              :to="{ name: 'onboarding-open', params: { onboardingId: 'cartoframes'} , hash: '#step-1'}"
              target= "_blank">
              {{ $t('KuvizPage.new') }}
           </router-link>
          </template>
        </SectionTitle>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import Page from 'new-dashboard/components/Page';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'KuvizPage',
  components: {
    Page,
    SectionTitle,
    CreateButton
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.kuviz {
  margin-top: 64px;
}

</style>
