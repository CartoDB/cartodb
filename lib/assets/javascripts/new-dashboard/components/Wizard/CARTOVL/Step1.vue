<template>
  <div class="u-width--100">
    <WizardSectionTitle :title="'Develop an interactive web map'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </WizardSectionTitle>
    <p v-html="$t(`wizards.cartovl.step1.text1`)" class="text is-caption u-mb--16 u-mt--24"></p>
    <p v-html="$t(`wizards.cartovl.step1.text2`)" class="text is-caption u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import WizardSectionTitle from 'new-dashboard/components/Wizard/WizardSectionTitle.vue';

export default {
  name: 'Step1',
  components: {
    CodeBlock,
    WizardSectionTitle
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
