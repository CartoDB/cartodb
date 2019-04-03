<template>
  <div class="u-width--100">
    <WizardSectionTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step5.summary`)" class="text is-body u-mb--64"></p>

    <WizardSectionTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step5.howto.instruction1`)" class="text is-caption u-mb--16"></p>
    <p v-html="$t(`wizards.cartovl.step5.howto.instruction2`)" class="text is-caption u-mb--16 u-mt--36"></p>
    <CodeBlock :code="codeBlock1"></CodeBlock>

    <WizardSectionTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step5.extras.resource1`)" class="text is-caption u-mt--16 u-mb--64"></p>
  </div>
</template>
<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import WizardSectionTitle from 'new-dashboard/components/Wizard/WizardSectionTitle.vue';

export default {
  name: 'Step5',
  components: {
    CodeBlock,
    WizardSectionTitle,
  },
  data () {
    return {
      codeBlock1,
      codeBlock2
    };
  }
};

// Code Blocks to be rendered in steps
const codeBlock1 =
`carto.setDefaultAuth({
  username: 'cartovl',
  apiKey: 'default_public'
})`;

const codeBlock2 =
`const viz= new carto.Viz();
const source = new carto.source.Dataset('madrid_listings')
const layer = new carto.Layer('layer', source, viz);
layer.addTo(map);`;
</script>
