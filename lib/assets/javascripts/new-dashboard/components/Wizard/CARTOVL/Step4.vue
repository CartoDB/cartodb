<template>
  <div class="u-width--100">
  <div class="u-width--100">
    <SectionTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartovl.step4.summary`)" class="text is-body u-mb--64"></p>

    <SectionTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartovl.step4.howto.instruction1`)" class="text is-caption u-mb--16"></p>
    <CodeBlock :code="codeBlock1"></CodeBlock>

    <SectionTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartovl.step4.extras.resource1`)" class="text is-caption u-mb--16"></p>
    <div class="u-flex u-flex__justify--between u-mb--16 u-mb--64">
      <img src="../../../assets/images/wizards/voyager@2x.png" width="306" height="140" alt="Voyager basemap sample"/>
      <img src="../../../assets/images/wizards/positron@2x.png" width="306" height="140" alt="Positron basemap sample"/>
      <img src="../../../assets/images/wizards/darkmatter@2x.png" width="306" height="140" alt="Darkmatter basemap sample"/>
    </div>
  </div>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import SectionTitle from 'new-dashboard/components/Wizard/SectionTitle.vue';

export default {
  name: 'Step4',
  components: {
    CodeBlock,
    SectionTitle
  },
  data () {
    return {
      codeBlock1
    };
  }
};

const codeBlock1 =
`<script>
  const map = new mapboxgl.Map({
    container: 'map',
    style: carto.basemaps.voyager,
    center: [-3.6908, 40.4297],
    zoom: 11
  })
<\/script>`;
</script>
