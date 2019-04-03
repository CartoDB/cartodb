<template>
  <div class="u-width--100">
    <WizardSectionTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step3.summary`)" class="text is-body u-mb--64"></p>

    <WizardSectionTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step3.howto.instruction1`)" class="text is-caption u-mb--16"></p>
    <CodeBlock :code="codeBlock1"></CodeBlock>
    <p v-html="$t(`wizards.cartovl.step3.howto.instruction2`)" class="text is-caption u-mb--16 u-mt--36"></p>
    <CodeBlock :code="codeBlock2"></CodeBlock>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import WizardSectionTitle from 'new-dashboard/components/Wizard/WizardSectionTitle.vue';

export default {
  name: 'Step3',
  components: {
    CodeBlock,
    WizardSectionTitle
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
<\/style>`
</script>
