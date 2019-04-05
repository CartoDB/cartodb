<template>
  <div class="u-width--100">
    <StepTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step6.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step6.howto.instruction1`)" class="text is-caption u-mb--16 u-mt--24"></p>
    <Jupyter>
      <JupyterBlock :isInput="true">
        <CodeBlock :code="codeBlock1" language="python" :lineNumbers="false" :theme="'default'"></CodeBlock>
      </JupyterBlock>
      <JupyterBlock :isInput="false">
        <InjectableIframe :content="map" width="940" height="416"></InjectableIframe>
      </JupyterBlock>
    </Jupyter>

    <StepTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step6.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';
import Jupyter from 'new-dashboard/components/Wizard/Jupyter.vue';
import JupyterBlock from 'new-dashboard/components/Wizard/JupyterBlock.vue';
import InjectableIframe from 'new-dashboard/components/InjectableIframe';
import map from 'raw-loader!new-dashboard/assets/resources/wizards/cartoframes_step5.html';

export default {
  name: 'Step6',
  components: {
    CodeBlock,
    StepTitle,
    Jupyter,
    JupyterBlock,
    InjectableIframe
  },
  data () {
    return {
      codeBlock1,
      map
    };
  }
};

const codeBlock1 =
  `from cartoframes import Layer
   cc.map(Layer('brooklyn_poverty', color='poverty_per_pop'))`
</script>