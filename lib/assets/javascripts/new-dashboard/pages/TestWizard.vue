<template>
  <section class="page">
    <Wizard :step="2"></Wizard>
  </section>
</template>

<script>

import Wizard from 'new-dashboard/components/Wizard.vue';
import WizardStep from 'new-dashboard/components/WizardStep.vue';

export default {
  name: 'TestWizard',
  components: {
    Wizard,
    WizardStep
  }
};
</script>
