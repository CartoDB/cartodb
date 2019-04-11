<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.builder.step1.title`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <img class="u-width--100" src="../../../../assets/images/onboarding/builder_step1.png"/>
    <p v-html="$t(`Wizards.builder.step1.text1`)" class="text is-body u-mb--16 u-mt--24"></p>
    <p v-html="$t(`Wizards.builder.step1.text2`)" class="text is-body u-mb--64"></p>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';

export default {
  name: 'Step1',
  stepName: 'Intro',
  components: {
    StepTitle
  }
};
</script>
