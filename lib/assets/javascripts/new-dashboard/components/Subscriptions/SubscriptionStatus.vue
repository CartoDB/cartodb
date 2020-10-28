<template>
  <div class="subscription-status-container u-flex u-flex__justify--between">
    <span class="text is-small u-mr--12">{{subscriptionExpirationLabel}}</span>
    <span class="text is-small is-semibold u-flex u-flex__align--center status" :class="status">{{subscriptionStatusLabel}}</span>
  </div>
</template>

<script>

import { format } from 'date-fns';

export default {
  name: 'SubscriptionStatus',
  components: {},
  props: {
    status: {
      type: String
    },
    expiresDate: {
      type: String
    }
  },
  data () {
    return {};
  },
  computed: {
    subscriptionStatusLabel () {
      switch (this.status) {
        case 'requested':
          return 'In progress';
        case 'active':
          return 'Active';
        case 'expired':
          return 'Expired';
        default:
          return 'Unknown';
      }
    },
    subscriptionExpirationLabel () {
      if (this.status === 'requested') {
        return '';
      }
      if (this.expiresDate && this.expiresDate !== '') {
        // Format to a safer date format (Safari, IE)
        const expiresDateSafe = this.expiresDate.replace(/-/g, '/');
        return `Expires at ${format(new Date(expiresDateSafe), 'MMM DD, YYYY')}`;
      }
      return 'Doesn’t expire';
    }
  },
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
      color: $green--400;
      &:after {
        background-color: $green--400;
      }
    }
    &.requested {
      color: $yellow--800;
      &::after {
        background-color: $yellow--800;
      }
    }
    &.expired {
      color: $red--600;
      &::after {
        background-color: $red--600;
      }
    }
  }
}
</style>
