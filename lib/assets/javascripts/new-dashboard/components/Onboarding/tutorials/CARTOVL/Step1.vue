<template>
  <div class="u-width--100 u-pr--10 u-pl--10">
    <StepTitle :title="$t(`Wizards.cartovl.step1.title`)">
      <template slot="icon">
          <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
      </template>
    </StepTitle>

    <InjectableIframe :content="map" width="940" height="416"></InjectableIframe>

    <p v-html="$t(`Wizards.cartovl.step1.text1`)" class="text is-body u-mb--16 u-mt--24"></p>
    <p v-html="$t(`Wizards.cartovl.step1.text2`)" class="text is-body u-mb--16 u-mt--24"></p>
    <p v-html="$t(`Wizards.cartovl.step1.text3`)" class="text is-body u-mb--64"></p>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';
import InjectableIframe from 'new-dashboard/components/InjectableIframe';
import map from 'raw-loader!new-dashboard/assets/resources/onboarding/cartovl.html';

export default {
  name: 'Step1',
  components: {
    InjectableIframe,
    StepTitle
  },
  data () {
    return {
      map
    };
  }
};
</script>
