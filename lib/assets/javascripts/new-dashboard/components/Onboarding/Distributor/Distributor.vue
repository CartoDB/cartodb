<template>
  <section class="onboarding-welcome">
    <Modal name="onboarding-welcome" :isOpen="true" @closeModal="closeModal">
      <div class="distributor">
        <div class="header">
          <div class="container">
            {{ $t('Wizards.Distributor.headerTitle') }}
          </div>
        </div>

        <div class="container u-pt--36">
          <h1 class="u-pr--10 u-pl--10 u-mb--40 title is-body is-semibold">{{ $t('Wizards.Distributor.title') }}</h1>
          <div class="grid u-flex__justify--between">
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <Selector
                :title="$t('Wizards.cartovl.title')"
                :text="$t('Wizards.cartovl.subtitle')"
                :tags="$t('Wizards.cartovl.tags')"
                @click.native="openOnboarding('carto-vl')"
                iconModifier="map"></Selector>
            </div>
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <Selector
                :title="$t('Wizards.cartoframes.title')"
                :text="$t('Wizards.cartoframes.subtitle')"
                :tags="$t('Wizards.cartoframes.tags')"
                @click.native="openOnboarding('cartoframes')"
                iconModifier="notebook"></Selector>
            </div>
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <Selector
                :title="$t('Wizards.builder.title')"
                :text="$t('Wizards.builder.subtitle')"
                :tags="$t('Wizards.builder.tags')"
                @click.native="openOnboarding('builder')"
                iconModifier="window"></Selector>
            </div>
          </div>
          <p class="grid-cell u-mt--48 is-small">{{ $t('Wizards.Distributor.feedback.text') }}
            <a href="https://docs.google.com/forms/d/e/1FAIpQLScBQUWd-TP3Qy514DOCNg-KoLrViHijUR5giLAMS-3jmDnrPg/viewform" target="_blank">
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
import Modal from 'new-dashboard/components/Modal.vue';
import WizardCARTOVL from 'new-dashboard/components/Onboarding/tutorials/CARTOVL/Wizard.vue';
import WizardCARTOframes from 'new-dashboard/components/Onboarding/tutorials/CARTOframes/Wizard.vue';
import WizardBuilder from 'new-dashboard/components/Onboarding/tutorials/Builder/Wizard.vue';

export default {
  name: 'OnboardingWelcome',
  components: {
    Selector,
    WizardCARTOVL,
    WizardCARTOframes,
    WizardBuilder,
    Modal
  },
  methods: {
    openOnboarding (onboardingId) {
      this.$router.push({
        name: 'onboarding-open',
        params: { onboardingId }
      });
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
  color: $text-color;
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
