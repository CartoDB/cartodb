<template>
  <div class="u-width--100">
    <StepTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </StepTitle>
    <p v-html="$t(`Wizards.cartoframes.step5.summary`)" class="text is-body u-mb--64"></p>

    <StepTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </StepTitle>
    <ul class="u-list__style--decimal u-list__position--inside u-mb--16">
      <li>
        <p v-html="$t(`Wizards.cartoframes.step5.howto.instruction1`)" class="text is-caption u-inlineflex"></p>
      </li>
    </ul>

    <Jupyter>
      <JupyterBlock :isInput="true">
        <CodeBlock :code="codeBlock1" language="python" :lineNumbers="false" :theme="'default'"></CodeBlock>
      </JupyterBlock>
      <JupyterBlock :isInput="false">
        <Table1></Table1>
      </JupyterBlock>
    </Jupyter>
  </div>
</template>
<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';
import Jupyter from 'new-dashboard/components/Wizard/Jupyter.vue';
import JupyterBlock from 'new-dashboard/components/Wizard/JupyterBlock.vue';
import Table1 from 'new-dashboard/components/Wizard/CARTOframes/Table5_1.vue';

export default {
  name: 'Step5',
  components: {
    CodeBlock,
    StepTitle,
    Jupyter,
    JupyterBlock,
    Table1
  },
  data () {
    return {
      codeBlock1
    };
  }
};

const codeBlock1 =
`df = cc.read('brooklyn_poverty')
df.head()`;
</script>
