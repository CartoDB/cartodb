<template>
  <div class="u-width--100">
    <SectionTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartovl.step2.summary`)" class="text is-body u-mb--64"></p>

    <SectionTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </SectionTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`wizards.cartoframes.step2.howto.instruction1`)" class="text is-caption u-mb--16 u-mt--24 u-inlineflex"></p>
        <CodeBlock :code="codeBlock1"></CodeBlock>
      </li>
      <li>
        <p v-html="$t(`wizards.cartoframes.step2.howto.instruction2`)" class="text is-caption u-mb--16 u-inlineflex"></p>
        <CodeBlock :code="codeBlock2"></CodeBlock>
      </li>
      <li>
        <p v-html="$t(`wizards.cartoframes.step2.howto.instruction3`)" class="text is-caption u-mb--16 u-inlineflex"></p>
        <CodeBlock :code="codeBlock3"></CodeBlock>
      </li>
    </ul>

    <SectionTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartoframes.step2.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import SectionTitle from 'new-dashboard/components/Wizard/SectionTitle.vue';

export default {
  name: 'Step2',
  components: {
    CodeBlock,
    SectionTitle
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
