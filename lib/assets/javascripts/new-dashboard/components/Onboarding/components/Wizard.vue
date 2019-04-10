<template>
  <component :is="componentName" @closeModal="closeModal"></component>
</template>

<script>
import CartoVLWizard from '../CARTOVL/Wizard';
import BuilderWizard from '../Builder/Wizard';
import CARTOframesWizard from '../CARTOframes/Wizard';

export default {
  name: 'Wizard',
  components: {
    builder: BuilderWizard,
    cartoframes: CARTOframesWizard,
    'carto-vl': CartoVLWizard
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
