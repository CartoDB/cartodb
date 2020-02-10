<template>
  <div class="quota-widget" :class="{'is-disabled': isDisabled }" @mouseover="onMouseOver" @mouseleave="onMouseLeave">
    <div class="quota-main">
      <div class="quota-cell cell--title">
        <h4 class="text is-caption is-semibold is-txtGrey">{{name}}</h4>
      </div>
      <div class="quota-cell cell--large">
        <NotificationBadge  v-if="isDisabled">
          <div class="text is-small" v-html="$t('QuotaSection.upgrade', { path: upgradeUrl })"></div>
        </NotificationBadge>
        <div v-else class="progressbar">
            <div :class="`progressbar progressbar--${getStatusBar}`"  :style="{width: `${getUsedPercent}%`}">
            </div>
        </div>
      </div>
    </div>

    <div class="quota-data">
      <div class="quota-cell cell--medium">
        <span class="text is-small is-txtSoftGrey">
          {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(remainingQuota)) : roundOneDecimal(remainingQuota) }} {{unit}}
        </span>
      </div>
      <div class="quota-cell cell--medium cell--mobile">
        <span class="text is-small is-txtSoftGrey">
          {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(usedQuota)) : roundOneDecimal(usedQuota) }} {{unit}}
        </span>
      </div>
      <div class="quota-cell cell--medium">
        <span class="text is-small is-txtSoftGrey">
          {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(availableQuota)) : roundOneDecimal(availableQuota) }} {{unit}}
        </span>
      </div>
      <div class="quota-help cell--small">
        <a :href="helpLink" v-if="helpLink" target= "_blank"><img svg-inline class="quota-image" :class="{'is-active': active}" src="../../../assets/icons/common/question-mark.svg"/></a>
      </div>
    </div>
  </div>
</template>

<script>
import NotificationBadge from 'new-dashboard/components/NotificationBadge';
import { mapState } from 'vuex';

export default {
  name: 'QuotaCard',
  props: {
    name: String,
    availableQuota: Number,
    usedQuota: Number,
    unit: String,
    billingPeriod: String,
    formatToLocale: {
      type: Boolean,
      default: true
    },
    helpLink: String,
    isDisabled: {
      type: Boolean,
      default: false
    }
  },
  components: {
    NotificationBadge
  },
  data: function () {
    return {
      active: false
    };
  },
  computed: {
    ...mapState({
      upgradeUrl: state => state.config.upgrade_url
    }),
    remainingQuota () {
      const remainingQuota = this.availableQuota - this.usedQuota;
      return Math.max(0, remainingQuota);
    },
    getUsedPercent () {
      if (this.availableQuota === 0) {
        return 100;
      }
      const width = (this.usedQuota / this.availableQuota) * 100;
      return width;
    },
    getStatusBar () {
      const usedPercent = this.getUsedPercent;
      if (usedPercent > 90) {
        return 'problem';
      } else if (usedPercent > 60) {
        return 'warning';
      } else {
        return 'good';
      }
    }
  },
  methods: {
    roundOneDecimal (number) {
      return Math.round(number * 10) / 10;
    },
    getNumberInLocaleFormat (number) {
      return number.toLocaleString();
    },
    onMouseOver () {
      this.active = true;
    },
    onMouseLeave () {
      this.active = false;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.quota-widget {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 80px;

  &.is-disabled {
    background-color: rgba($color-primary--soft, 0.3);

    .cell--title,
    .quota-data {
      opacity: 0.3;
    }
  }

  &:not(:last-of-type) {
    border-bottom: 1px solid $softblue;
  }
}

.quota-main {
  display: flex;
  width: 100%;
}

.quota-data {
  display: flex;
}

.quota-cell {
  display: flex;
  align-items: center;
  padding: 0 10px;
  white-space: nowrap;

  &:first-of-type {
    padding-left: 0;
  }

  &:last-of-type {
    padding-right: 0;
  }
}

.cell--mobile {
  @media (max-width: $layout-mobile) {
    display: none;
  }
}

.quota-help {
  display: flex;
  justify-content: flex-end;
  padding-right: 16px;
  cursor: pointer;
}

.quota-image {
  display: none;

  &.is-active {
    display: flex;
  }
}

.cell--title {
  width: 160px;
  margin-left: 36px;
}

.cell--large {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 120px;
  margin-right: 40px;

  @media (max-width: $layout-mobile) {
    display: none;
  }
}

.cell--medium {
  width: 110px;
}

.cell--small {
  width: 58px;

  @media (max-width: $layout-tablet) {
    display: none;
  }
}

.progressbar {
  width: 100%;
  max-width: 260px;
  height: 8px;
  border-radius: 4px;
  background-color: $progressbar__bg-color;

  &.progressbar--good {
    background-color: $success__bg-color;
  }

  &.progressbar--warning {
    background-color: $warning__bg-color;
  }

  .progressbar--problem {
    background-color: $danger__bg-color;
  }
}

.warning-icon {
  margin-right: 5px;
}

</style>
