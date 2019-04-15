<template>
  <component :is="componentName" @closeModal="closeModal"></component>
</template>

<script>
import { createWizard } from '../wizard/createWizard';

// Wizards
import CARTOVLWizard from '../tutorials/CARTOVL';
import CARTOframesWizard from '../tutorials/CARTOframes';
import BuilderWizard from '../tutorials/Builder';

export default {
  name: 'Wizard',
  components: {
    builder: createWizard(BuilderWizard.wizardName, BuilderWizard.steps),
    cartoframes: createWizard(CARTOframesWizard.wizardName, CARTOframesWizard.steps),
    'carto-vl': createWizard(CARTOVLWizard.wizardName, CARTOVLWizard.steps)
  },
  computed: {
    componentName () {
      return this.$route.params.onboardingId;
    }
  },
  methods: {
    closeModal () {
      this.$router.push({ name: 'home' });
    }
  }
};
</script>
