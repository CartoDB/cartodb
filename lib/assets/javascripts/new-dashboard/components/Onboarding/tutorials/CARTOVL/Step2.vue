<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.cartovl.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step2.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartovl.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
      </template>
    </StepTitle>
    <ol class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartovl.step2.howto.instruction1`)" class="text is-caption u-inlineflex"></p>
        <CodeBlock :code="codeBlock1" language="htmlmixed"></CodeBlock>
      </li>
    </ol>

    <StepTitle :title="$t(`Wizards.cartovl.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartovl.step2.extras.resource1`)" class="text is-caption u-mb--24"></p>
    <p v-html="$t(`Wizards.cartovl.step2.extras.resource2`)" class="text is-caption u-mb--64"></p>
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
      codeBlock1
    };
  }
};

const codeBlock1 =
`<html>
  <head>
    <title>CARTO VL Example</title>
    <!-- Load CARTO VL JS -->
    <script src="https://libs.cartocdn.com/carto-vl/v1.2.4/carto-vl.min.js"><\/script>
    <!-- Load Mapbox GL -->
    <script src="https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.js"><\/script>
    <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.css" rel="stylesheet">

    <style>
      #map {
        position: absolute;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
  </body>
</html>`;
</script>
