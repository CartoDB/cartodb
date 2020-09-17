<template>
  <div class="grid grid-cell">
    <div class="dataset-actions-bar grid grid-cell grid-cell--col12 u-flex__justify--between">
      <div class="u-flex u-flex__align--center">
        <div class="subscription-actions">
          <SubscriptionActions v-if="subscriptionWithSlug.slug" :dataset="subscriptionWithSlug" :mode="'row'"></SubscriptionActions>
        </div>
        <div class="white-separator u-ml--12 u-mr--12"></div>
        <SlugCopy v-if="subscription.status === 'active' && slug" :slug="slug" class="slug-copy"></SlugCopy>
      </div>
      <SubscriptionStatus :status="subscription.status" :expiresDate="subscription.expires_at" class="u-flex__align--center"></SubscriptionStatus>
    </div>
  </div>
</template>
<script>

import SubscriptionStatus from '../Subscriptions/SubscriptionStatus';
import SubscriptionActions from '../Subscriptions/SubscriptionActions';
import SlugCopy from '../Subscriptions/SlugCopy';

export default {
  name: 'DatasetActionsBar',
  components: {
    SubscriptionStatus,
    SubscriptionActions,
    SlugCopy
  },
  props: {
    subscription: Object,
    slug: String
  },
  computed: {
    subscriptionWithSlug () {
      return { ...this.subscription, slug: this.slug };
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables.scss';

.dataset-actions-bar {
  background-color: $blue--100;
  border-radius: 4px;

  &.grid-cell {
    padding: 0 14px;
  }

  .white-separator {
    width: 2px;
    height: 40px;
    background-color: $white;
  }

  .subscription-status-container {
    padding: 0;
  }

  &::v-deep {
    button .tooltip {
      top: 100%;
      transform: translate(-50%, 0);
      &:before {
        bottom: initial;
        top: -6px;
      }
    }
    button:hover .tooltip {
      transform: translate(-50%, 12px);
    }
  }
  .subscription-actions {
    &::v-deep {
      button .tooltip {
        transform: translate(0, 0);
        &:before {
          left: 14px;
        }
      }
      button:hover .tooltip {
        left: 0px;
        transform: translate(0, 12px);
      }
    }
  }

  .slug-copy {
    width: 200px;
    height: 28px;
  }
}
</style>
