<template>
  <div class="u-width--100">
    <StepTitle :title="$t(`Wizards.builder.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.builder.step5.summary.text`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.builder.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.builder.step5.howto.instruction1`)" class="text is-caption u-mb--16 u-inlineflex"></p>
      </li>
      <li>
        <p v-html="$t(`Wizards.builder.step5.howto.instruction2`)" class="text is-caption u-mb--16 u-inlineflex"></p>
      </li>
      <li>
        <p v-html="$t(`Wizards.builder.step5.howto.instruction3`)" class="text is-caption u-mb--16 u-inlineflex"></p>
      </li>
      <li>
        <p v-html="$t(`Wizards.builder.step5.howto.instruction4`)" class="text is-caption u-inlineflex"></p>
      </li>
    </ul>

    <StepTitle :title="$t(`Wizards.builder.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.builder.step5.extras.resource1`)" class="text is-caption"></p>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';

export default {
  name: 'Step5',
  stepName: 'Publish your map',
  components: {
    StepTitle
  }
};
</script>
