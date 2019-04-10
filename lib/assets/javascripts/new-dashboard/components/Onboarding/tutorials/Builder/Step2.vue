<template>
  <div class="u-width--100">
    <StepTitle :title="$t(`Wizards.builder.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.builder.step2.summary.text`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.builder.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.builder.step2.howto.instruction1`)" class="text is-caption u-mb--16 u-inlineflex"></p>
        <DatasetCard :content="$t(`Wizards.builder.step2.cards.dataset1`)"></DatasetCard>
      </li>
      <li>
        <p v-html="$t(`Wizards.builder.step2.howto.instruction2`)" class="text is-caption u-mt--16 u-mb--16 u-inlineflex"></p>
      </li>
      <li>
        <p v-html="$t(`Wizards.builder.step2.howto.instruction3`)" class="text is-caption u-mb--16 u-inlineflex"></p>
        <img class="u-width--100" src="../../../assets/images/wizards/builder_step2@2x.png" alt="Screenshot connect dataset modal in builder">
      </li>
    </ul>

    <StepTitle :title="$t(`Wizards.builder.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.builder.step2.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';
import DatasetCard from './DatasetCard_21.vue';

export default {
  name: 'Step2',
  components: {
    StepTitle,
    DatasetCard
  }
};
</script>
