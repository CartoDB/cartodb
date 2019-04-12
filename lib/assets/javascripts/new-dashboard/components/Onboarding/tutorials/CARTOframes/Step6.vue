<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.cartoframes.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step6.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartoframes.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
      </template>
    </StepTitle>
    <ol class="u-list__style--decimal u-list__position--inside u-mt--24">
      <li>
        <p v-html="$t(`Wizards.cartoframes.step6.howto.instruction1`)" class="text is-caption u-inline"></p>
        <Jupyter>
          <JupyterBlock :isInput="true">
            <CodeBlock :code="codeBlock1" language="python" :lineNumbers="false" :theme="'default'"></CodeBlock>
          </JupyterBlock>
          <JupyterBlock :isInput="false">
            <InjectableIframe :content="map" width="100%" height="416"></InjectableIframe>
          </JupyterBlock>
        </Jupyter>
      </li>
    </ol>


    <StepTitle :title="$t(`Wizards.cartoframes.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step6.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';
import Jupyter from 'new-dashboard/components/Code/Jupyter.vue';
import JupyterBlock from 'new-dashboard/components/Code/JupyterBlock.vue';
import InjectableIframe from 'new-dashboard/components/InjectableIframe';
import map from 'raw-loader!new-dashboard/assets/resources/onboarding/cartoframes_step5.html';

export default {
  name: 'Step6',
  stepName: 'Display map',
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
`from cartoframes.contrib import vector
vector.vmap([
  vector.Layer('world_ports', strokeWidth=0.5, strokeColor='black', size=3, color='#0ab96b')
], context=cc)`;
</script>
