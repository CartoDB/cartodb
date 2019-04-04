<template>
  <div class="u-width--100">
    <StepTitle :title="$t(`Wizards.cartovl.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step2.summary.text`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartovl.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartovl.step2.howto.instruction1`)" class="text is-caption u-mb--16 u-mt--24 u-inlineflex"></p>
      </li>
      <li>
        <p v-html="$t(`Wizards.cartovl.step2.howto.instruction2`)" class="text is-caption u-mb--16 u-inlineflex"></p>
        <CodeBlock :code="codeBlock1"></CodeBlock>
      </li>
    </ul>

    <StepTitle :title="$t(`Wizards.cartovl.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step2.extras.resource1`)" class="text is-caption u-mb--16"></p>
    <p v-html="$t(`Wizards.cartovl.step2.extras.resource2`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';

export default {
  name: 'Step2',
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
  `<!DOCTYPE html>
  <html>
    <head>
      <title>CARTO VL Example<\/title>
      <!-- Load CARTO VL JS -->
      <script src="https://libs.cartocdn.com/carto-vl/v1.0.0/carto-vl.min.js"><\/script>
      <!-- Load Mapbox GL -->
      <script src="https://api.tiles.mapbox.com/mapbox-gl-js/v0.50.0/mapbox-gl.js"><\/script>
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.50.0/mapbox-gl.css" rel="stylesheet" \/>
      <!-- Load CARTO VL Styles -->
      <link href="https://carto.com/developers/carto-vl/examples/maps/style.css" rel="stylesheet">
    <\/head>
    <body>
    <\/body>
  <\/html>`;
</script>
