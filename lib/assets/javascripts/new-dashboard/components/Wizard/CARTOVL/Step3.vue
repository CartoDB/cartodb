<template>
  <div class="u-width--100">
    <StepTitle :title="$t(`Wizards.cartovl.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step3.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartovl.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartovl.step3.howto.instruction1`)" class="text is-caption u-inline"></p>
        <CodeBlock :code="codeBlock1" class="u-mt--16"></CodeBlock>
      </li>
      <li class="u-mt--36">
        <p v-html="$t(`Wizards.cartovl.step3.howto.instruction2`)" class="text is-caption u-inlineflex"></p>
        <CodeBlock :code="codeBlock2"></CodeBlock>
      </li>
    </ul>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';

export default {
  name: 'Step3',
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

const codeBlock1 = `<div id="map"><\/div>`;

const codeBlock2 =
`<style>
  #map {
    position: absolute;
    width: 100%;
    height: 100%
  }
<\/style>`;
</script>
