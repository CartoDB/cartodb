<template>
  <div>
    <h2 class="title is-body u-mb--24">Summary</h2>
    <WizardStepTitle :title="'Summary'">
      <template slot="icon">
          <img src="../../assets/icons/wizards/summary.svg" width="18" height="20" />
      </template>
    </WizardStepTitle>
    <p class="text is-body u-mb--64">{{summary}}</p>

    <h2 class="title is-body u-mb--24">How to</h2>
    <ul v-if="howToSteps">
      <li v-for="(step, index) in howToSteps" :key="step.instruction">
        <p class="text is-caption u-mb--16"
          v-html="step.instruction"
          :class="{'u-mb--64': index == howToSteps.length - 1}"></p>
      </li>
    </ul>

    <h2 class="title is-body u-mb--24 u-mt--64">Extras</h2>
    <p class="text is-caption u-mb--16"
      :class="{'u-mb--64': index == extras.length - 1}"
      v-for="(extra, index) in extras"
      :key="extra.text"
      v-html="extra.text"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import WizardStepTitle from 'new-dashboard/components/Wizard/WizardStepTitle.vue';

export default {
  name: 'WizardConent',
  components: {
    CodeBlock,
    WizardStepTitle
  },
  props: {
    stepName: {
      type: String
    }
  },
  computed: {
    summary () {
      return this.$t(`wizards.${this.stepName}.steps.summary`);
    },
    howToSteps () {
      return this.$t(`wizards.${this.stepName}.steps.howto`);
    },
    extras () {
      return this.$t(`wizards.${this.stepName}.steps.extras`);
    }
  }
}
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

</style>