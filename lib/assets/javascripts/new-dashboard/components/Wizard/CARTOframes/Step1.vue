<template>
  <div class="u-width--100">
    <SectionTitle :title="'Add spatial data to your data science workflow'">
      <template slot="icon">
          <img svg-inline src="../../../assets/icons/wizards/summary.svg"/>
      </template>
    </SectionTitle>
    <iframe src="https://nbviewer.jupyter.org/github/CartoDB/cartoframes/blob/master/examples/Basic%20Usage.ipynb" frameborder="0" width="940" height="416"></iframe>
    <p v-html="$t(`wizards.cartoframes.step1.text1`)" class="text is-caption u-mb--16 u-mt--24"></p>
    <p v-html="$t(`wizards.cartoframes.step1.text2`)" class="text is-caption u-mb--64"></p>
  </div>
</template>

<script>
import SectionTitle from 'new-dashboard/components/Wizard/SectionTitle.vue';

export default {
  name: 'Step1',
  components: {
    SectionTitle
  }
};
</script>
