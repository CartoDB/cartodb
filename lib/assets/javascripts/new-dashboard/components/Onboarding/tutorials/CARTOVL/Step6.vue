<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.cartovl.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step6.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartovl.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
      </template>
    </StepTitle>
    <ol class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartovl.step6.howto.instruction1`)" class="text is-caption u-inline"></p>
        <CodeBlock :code="codeBlock1"></CodeBlock>
      </li>
    </ol>
  </div>
</template>
<script>
import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';

export default {
  name: 'Step6',
  components: {
    CodeBlock,
    StepTitle
  },
  data () {
    return {
      codeBlock1
    };
  }
};

// Code Blocks to be rendered in steps
const codeBlock1 =
`const viz= new carto.Viz(\`
  width: 4
  strokeWidth: 0.5
  strokeColor: black
  color: rgb(10,185,107)
\`);`;
</script>
