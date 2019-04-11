<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.cartoframes.step1.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <img class="u-width--100" src="../../../../assets/images/onboarding/cartoframes_step1.png"/>
    <p v-html="$t(`Wizards.cartoframes.step1.text1`)" class="text is-body u-mb--16 u-mt--24"></p>
    <p v-html="$t(`Wizards.cartoframes.step1.text2`)" class="text is-body u-mb--16 u-mt--24"></p>
    <p v-html="$t(`Wizards.cartoframes.step1.text3`)" class="text is-body u-mb--64"></p>
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
