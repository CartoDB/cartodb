<template>
  <div class="u-width--100">
    <StepTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step2.summary.text`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartoframes.step2.howto.instruction1`)" class="text is-caption u-inlineflex"></p>
        <CodeBlock :code="codeBlock1" language="shell" :lineNumbers="false"></CodeBlock>
      </li>
      <li class="u-mt--36">
        <p v-html="$t(`Wizards.cartoframes.step2.howto.instruction2`)" class="text is-caption u-inlineflex"></p>
        <CodeBlock :code="codeBlock2" language="shell" :lineNumbers="false"></CodeBlock>
      </li>
      <li class="u-mt--36">
        <p v-html="$t(`Wizards.cartoframes.step2.howto.instruction3`)" class="text is-caption u-inlineflex"></p>
        <CodeBlock :code="codeBlock3" language="shell" :lineNumbers="false"></CodeBlock>
      </li>
    </ul>

    <StepTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step2.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';

export default {
  name: 'Step2',
  components: {
    CodeBlock,
    StepTitle
  },
  data () {
    return {
      codeBlock1,
      codeBlock2,
      codeBlock3
    };
  }
};

const codeBlock1 = `$ pip install cartoframes`;
const codeBlock2 = `$ pip install jupyter`;
const codeBlock3 = `$ jupyter notebook`;
</script>
