<template>
  <div class="subscription-status-container u-width--100 u-flex u-flex__justify--between">
    <span class="is-small">Doesn’t expire</span>
    <span class="is-small is-semibold u-flex u-flex__align--center status active">Active</span>
  </div>
</template>

<script>

export default {
  name: 'SubscriptionStatus',
  components: {},
  props: {},
  data: function () {
    return {};
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.subscription-status-container {
  background-color: $blue--100;
  border-radius: 4px;
  padding: 12px 24px 12px 16px;
  .status {
    &:after {
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      margin-left: 4px;
      border-radius: 100%;
    }
    &.active {
      color: #2aac02;
      &:after {
        background-color: #2aac02;
      }
    }
    &.progress  {
      color: #fb7b23;
      &:after {
        background-color: #fb7b23;
      }
    }
  }
}
</style>
