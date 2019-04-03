<template>
  <div class="u-width--100">
  <div class="u-width--100">
    <WizardSectionTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step4.summary`)" class="text is-body u-mb--64"></p>

    <WizardSectionTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step4.howto.instruction1`)" class="text is-caption u-mb--16"></p>
    <CodeBlock :code="codeBlock1"></CodeBlock>

    <WizardSectionTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step4.extras.resource1`)" class="text is-caption u-mb--16"></p>
    <div class="u-flex u-flex__justify--between u-mb--16 u-mb--64">
      <div>
        Card Voyager
      </div>
      <div>
        Card Positron
      </div>
      <div>
        Card Darkmatter
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import WizardSectionTitle from 'new-dashboard/components/Wizard/WizardSectionTitle.vue';

export default {
  name: 'Step4',
  components: {
    CodeBlock,
    WizardSectionTitle
  },
  data () {
    return {
      codeBlock1
    }
  }
}

const codeBlock1 = 
`<script>
  const map = new mapboxgl.Map({
    container: 'map',
    style: carto.basemaps.voyager,
    center: [-3.6908, 40.4297],
    zoom: 11
  })
<\/script>`
</script>
