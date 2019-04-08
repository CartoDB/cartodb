<template>
  <div class="u-width--100">
    <StepTitle :title="$t(`Wizards.cartovl.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step4.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartovl.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartovl.step4.howto.instruction1`)" class="text is-caption u-inlineflex"></p>
        <CodeBlock :code="codeBlock1"></CodeBlock>
      </li>
    </ul>

    <StepTitle :title="$t(`Wizards.cartovl.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step4.extras.resource1`)" class="text is-caption u-mb--16"></p>
    <div class="u-flex u-flex__justify--between u-mb--16 u-mb--64">
      <img src="../../../assets/images/wizards/voyager@2x.png" width="306" height="140" alt="Voyager basemap sample"/>
      <img src="../../../assets/images/wizards/positron@2x.png" width="306" height="140" alt="Positron basemap sample"/>
      <img src="../../../assets/images/wizards/darkmatter@2x.png" width="306" height="140" alt="Dark Matter basemap sample"/>
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
