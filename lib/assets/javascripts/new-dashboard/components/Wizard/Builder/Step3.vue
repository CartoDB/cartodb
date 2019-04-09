<template>
  <div class="u-width--100">
    <StepTitle :title="$t(`Wizards.builder.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.builder.step3.summary.text`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.builder.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.builder.step3.howto.instruction1`)" class="text is-caption u-mt--24 u-inline"></p>
        <img class="u-width--100 u-mt--16" src="../../../assets/images/wizards/builder_step3@2x.png" alt="Screenshot dataset preview in builder">
      </li>
      <li>
        <p v-html="$t(`Wizards.builder.step3.howto.instruction2`)" class="text is-caption u-mb--16 u-mt--24 u-inlineflex"></p>
      </li>
    </ul>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';

export default {
  name: 'Step3',
  components: {
    StepTitle
  }
};
</script>
