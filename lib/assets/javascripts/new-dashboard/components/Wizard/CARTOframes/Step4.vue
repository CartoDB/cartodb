<template>
  <div class="u-width--100">
    <StepTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`wizards.cartoframes.step4.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`wizards.cartoframes.step4.howto.instruction1`)" class="text is-caption u-mb--16"></p>

    <div class="cartoframes">
      <div class="cartoframes-in u-flex u-flex__align--center">
        <span class="cartoframes-in__title">In:</span>
        <CodeBlock :code="codeBlock1" :language="'python'" :lineNumbers="false" :theme="'default'"></CodeBlock>
      </div>
      <div class="cartoframes-out">
        <span class="cartoframes-out__title">Out:</span>
        <CodeBlock :code="codeBlock2" :language="'python'" :lineNumbers="false" :theme="'default'"></CodeBlock>
      </div>
    </div>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';

export default {
  name: 'Step4',
  components: {
    CodeBlock,
    StepTitle
  },
  data () {
    return {
      codeBlock1,
      codeBlock2
    };
  }
};

const codeBlock1 = `[table.name for table in cc.tables]`;
const codeBlock2 = `'mcdonalds_nyc', 'nyc_census_tracts', 'brooklyn_poverty', 'taxi_50k', 'nat'`;
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.cartoframes {
  padding: 20px;
  background-color: $white;
}

.cartoframes-in__title {
  color: red;
}

.cartoframes-out__title {
  color: blue;
}
</style>
