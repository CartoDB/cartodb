<template>
  <section class="onboarding-welcome">
    <Modal name="onboarding-welcome" :isOpen="true" @closeModal="closeModal">
      <div class="distributor gtm-onboarding">
        <div class="header">
          <div class="container">
            {{ $t('Wizards.Distributor.headerTitle') }}
          </div>
        </div>

        <div class="container u-pt--36">
          <h1 class="u-pr--10 u-pl--10 u-mb--40 title is-body is-semibold">
            {{ $t('Wizards.Distributor.title') }}
          </h1>

          <div class="grid u-flex__justify--between">
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <Selector
                :title="$t('Wizards.tilesets.title')"
                :text="$t('Wizards.tilesets.subtitle')"
                @click.native="openDocs('https://docs.carto.com/spatial-extension-bq/tiler/guides/')"
                iconModifier="tilesets"></Selector>
              <Warning v-if="!hasEngine"></Warning>
            </div>

            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <Selector
                :title="$t('Wizards.cartoframes.title')"
                :text="$t('Wizards.cartoframes.subtitle')"
                :tags="$t('Wizards.cartoframes.tags')"
                @click.native="openDocs('https://docs.carto.com/get-started/#spatial-analysis-with-cartoframes')"
                iconModifier="notebook"></Selector>
              <Warning v-if="!hasEngine"></Warning>
            </div>

            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <Selector
                :title="$t('Wizards.builder.title')"
                :text="$t('Wizards.builder.subtitle')"
                :tags="$t('Wizards.builder.tags')"
                @click.native="openDocs('https://docs.carto.com/get-started/#spatial-analysis-with-builder')"
                iconModifier="window"></Selector>
            </div>
          </div>
          <p class="grid-cell u-mt--48 is-small">{{ $t('Wizards.Distributor.feedback.text') }}
            <a href="https://docs.google.com/forms/d/e/1FAIpQLScBQUWd-TP3Qy514DOCNg-KoLrViHijUR5giLAMS-3jmDnrPg/viewform" target="_blank" rel="noopener noreferrer">
            {{ $t('Wizards.Distributor.feedback.link') }}</a>
          </p>
        </div>
      </div>
    </Modal>

    <router-view name="onboarding" />
  </section>
</template>

<script>
import Selector from 'new-dashboard/components/Onboarding/distributor/Selector';
import Warning from 'new-dashboard/components/Onboarding/distributor/Warning';
import Modal from 'new-dashboard/components/Modal.vue';

export default {
  name: 'OnboardingWelcome',
  components: {
    Selector,
    Warning,
    Modal
  },
  computed: {
    hasEngine () {
      return this.$store.getters['user/hasEngine'];
    }
  },
  methods: {
    openDocs (href) {
      window.open(href, '_blank');
    },
    closeModal () {
      this.$router.push({ name: 'home' });
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.distributor {
  height: 100%;
  background-color: $onboarding__bg-color;
  color: $text__color;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 98px;
  background: $white;
}

.button {
  &.button--ghost {
    margin-right: 36px;
    padding: 0;
  }
}
</style>
