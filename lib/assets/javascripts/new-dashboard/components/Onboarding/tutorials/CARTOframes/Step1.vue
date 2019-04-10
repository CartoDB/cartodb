<template>
  <div class="u-width--100">
    <StepTitle :title="'Add spatial data to your data science workflow'">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <iframe src="https://nbviewer.jupyter.org/github/CartoDB/cartoframes/blob/master/examples/Basic%20Usage.ipynb" frameborder="0" width="100%" height="416"></iframe>
    <p v-html="$t(`Wizards.cartoframes.step1.text1`)" class="text is-caption u-mb--16 u-mt--24"></p>
    <p v-html="$t(`Wizards.cartoframes.step1.text2`)" class="text is-caption u-mb--64"></p>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';

export default {
  name: 'Step1',
  components: {
    StepTitle
  }
};
</script>
