<template>
  <div class="u-width--100">
    <SectionTitle :title="'Summary'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartoframes.step6.summary`)" class="text is-body u-mb--64"></p>

    <SectionTitle :title="'How To'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/howto.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartoframes.step6.howto.instruction1`)" class="text is-caption u-mb--16 u-mt--24"></p>

    <SectionTitle :title="'Extras'" class="u-mt--64">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/extras.svg"/>
      </template>
    </SectionTitle>
    <p v-html="$t(`wizards.cartoframes.step6.extras.resource1`)" class="text is-caption u-mb--16 u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import SectionTitle from 'new-dashboard/components/Wizard/SectionTitle.vue';

export default {
  name: 'Step6',
  components: {
    CodeBlock,
    SectionTitle
  }
};
</script>