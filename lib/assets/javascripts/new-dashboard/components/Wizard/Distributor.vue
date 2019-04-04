<template>
  <div>
    <button class="button" :class="[isFirstTimeViewingDashboard ? 'button--cta' : 'button--ghost']" @click="openModal()">Get started</button>
    <Modal :name="'distributor'" :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="distributor">
        <div class="header">
          <div class="container">
            Getting started
          </div>
        </div>
        <div class="container u-pt--36">
          <h1 class="title is-body is-semibold u-mb--40">What do you want to do?</h1>
          <div class="grid u-flex__justify--between">
            <WizardCARTOVL @closeModal="closeModal"></WizardCARTOVL>
            <WizardCARTOframes @closeModal="closeModal"></WizardCARTOframes>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import Modal from 'new-dashboard/components/Modal.vue';
import WizardCARTOVL from 'new-dashboard/components/Wizard/CARTOVL/Wizard.vue';
import WizardCARTOframes from 'new-dashboard/components/Wizard/CARTOframes/Wizard.vue';

export default {
  name: 'WizardDistributor',
  components: {
    WizardCARTOVL,
    WizardCARTOframes,
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
