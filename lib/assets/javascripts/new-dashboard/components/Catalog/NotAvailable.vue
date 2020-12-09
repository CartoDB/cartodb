<template>
  <div class="empty-container grid u-flex__justify--center u-mt--24">
    <div class="grid-cell--col5 grid-cell--col8--tablet">
      <h4 class="title is-body is-txtMidGrey">{{ title }}</h4>
      <p class="text is-caption is-txtMidGrey u-mt--8">
        <span>{{ description }}</span>
      </p>
      <div>
        <Button
          v-if="mode === 'contact' && contactUrl"
          class="u-mt--24"
          :url="contactUrl"
          :isOutline="true"
          :blank="true"
        >
          Contact us for a demo
        </Button>
        <template v-else-if="mode === 'login'">
          <Button
            class="u-mt--24"
            url="https://carto.com/login"
            :isOutline="false"
            :reverseColors="true"
          >
            Login
          </Button>
          <span class="u-ml--12 u-mr--12 text is-small">or</span>
          <Button
            class="u-mt--24"
            url="https://carto.com/signup"
            :isOutline="true"
          >
            Try for free
          </Button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import Button from '../Button.vue';

export default {
  name: 'NotAvailable',
  components: {
    Button
  },
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    contactUrl: {
      type: String,
      required: false
    },
    mode: {
      type: String,
      required: true,
      validator: value => {
        return ['contact', 'login'].indexOf(value) !== -1;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';
.empty-container {
  padding: 36px 0 48px;
  border-radius: 6px;
  background-color: $blue--100;
  text-align: center;
}
</style>
