<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.cartoframes.sections.summary`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step3.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="$t(`Wizards.cartoframes.sections.howto`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
      </template>
    </StepTitle>
    <ol class="u-list__style--decimal u-list__position--inside">
      <li>
        <p v-html="$t(`Wizards.cartoframes.step3.howto.instruction1`)" class="text is-caption u-inline"></p>
        <Jupyter>
          <JupyterBlock :isInput="true">
          <CodeBlock :code="codeBlock1" language="python" :lineNumbers="false" :theme="'default'"></CodeBlock>
          </JupyterBlock>
        </Jupyter>
      </li>
    </ol>



    <StepTitle :title="$t(`Wizards.cartoframes.sections.extras`)" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/extras.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step3.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>

  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';
import Jupyter from 'new-dashboard/components/Code/Jupyter.vue';
import JupyterBlock from 'new-dashboard/components/Code/JupyterBlock.vue';

export default {
  name: 'Step3',
  components: {
    CodeBlock,
    StepTitle,
    Jupyter,
    JupyterBlock
  },
  data () {
    return {
      codeBlock1
    };
  }
};

const codeBlock1 =
`import cartoframes
from cartoframes import Credentials

creds = Credentials(username='public',
                    key='default_public')
cc = cartoframes.CartoContext(creds=creds)`;
</script>
