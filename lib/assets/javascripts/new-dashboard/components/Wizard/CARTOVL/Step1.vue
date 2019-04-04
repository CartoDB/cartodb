<template>
  <div class="u-width--100">
    <SectionTitle :title="'Develop an interactive web map'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </SectionTitle>
    <InjectableIframe :content="map" width="940" height="416"></InjectableIframe>
    <p v-html="$t(`wizards.cartovl.step1.text1`)" class="text is-caption u-mb--16 u-mt--24"></p>
    <p v-html="$t(`wizards.cartovl.step1.text2`)" class="text is-caption u-mb--64"></p>
  </div>
</template>

<script>
import CodeBlock from 'new-dashboard/components/CodeBlock.vue';
import SectionTitle from 'new-dashboard/components/Wizard/SectionTitle.vue';
import InjectableIframe from 'new-dashboard/components/InjectableIframe';
import map from 'raw-loader!new-dashboard/assets/resources/wizards/cartovl.html';

export default {
  name: 'Step1',
  components: {
    CodeBlock,
    InjectableIframe,
    SectionTitle
  },
  data () {
    return {
      map
    };
  }
};
</script>
