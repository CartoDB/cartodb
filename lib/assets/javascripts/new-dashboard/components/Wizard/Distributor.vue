<template>
  <div>
    <button class="button" :class="[isFirstTimeViewingDashboard ? 'button--cta' : 'button--ghost']" @click="openModal()">
      {{ $t('Wizards.Distributor.cta') }}
    </button>

    <Modal name="distributor" :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="distributor gtm-onboarding">
        <div class="header">
          <div class="container">
            {{ $t('Wizards.Distributor.headerTitle') }}
          </div>
        </div>
        <div class="container u-pt--36">
          <h1 class="u-pr--10 u-pl--10 u-mb--40 title is-body is-semibold">{{ $t('Wizards.Distributor.title') }}</h1>
          <div class="grid u-flex__justify--between">
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <WizardCARTOVL @closeModal="closeModal"></WizardCARTOVL>
            </div>
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <WizardCARTOframes @closeModal="closeModal"></WizardCARTOframes>
            </div>
            <div class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
              <WizardBuilder @closeModal="closeModal"></WizardBuilder>
            </div>
          </div>
          <p class="grid-cell u-mt--48 is-small">{{ $t('Wizards.Distributor.feedback.text') }}
            <a href="https://docs.google.com/forms/d/e/1FAIpQLScBQUWd-TP3Qy514DOCNg-KoLrViHijUR5giLAMS-3jmDnrPg/viewform" target="_blank">
            {{ $t('Wizards.Distributor.feedback.link') }}</a>
          </p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import Modal from 'new-dashboard/components/Modal.vue';
import WizardCARTOVL from 'new-dashboard/components/Wizard/CARTOVL/Wizard.vue';
import WizardCARTOframes from 'new-dashboard/components/Wizard/CARTOframes/Wizard.vue';
import WizardBuilder from 'new-dashboard/components/Wizard/Builder/Wizard.vue';

export default {
  name: 'WizardDistributor',
  components: {
    WizardCARTOVL,
    WizardCARTOframes,
    WizardBuilder,
    Modal
  },
  props: {
    isFirstTimeViewingDashboard: Boolean
  },
  data () {
    return {
      isModalOpen: false
    };
  },
  methods: {
    openModal () {
      this.isModalOpen = true;
    },
    closeModal () {
      this.isModalOpen = false;
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
