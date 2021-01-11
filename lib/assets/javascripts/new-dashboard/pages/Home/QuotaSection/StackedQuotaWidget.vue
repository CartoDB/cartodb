<template>
  <div class="quota-widget-wrapper">
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
            <Tooltip :text="tooltipText" position="bottom-right" hide-delay="0s" show-delay="1s">
              <template v-if="Array.isArray(usedQuota)">
                <div v-for="section in usedQuota"
                  :key="section.label"
                  :class="`progressbar ${qualitative ? `progressbar--${getStatusBar}` : 'progressbar--filled'}`"
                  :style="{backgroundColor: section.color, width: `${getUsedPercent(section.value)}%`}">
                </div>
              </template>
              <template v-else>
                <div
                  :class="`progressbar ${qualitative ? `progressbar--${getStatusBar}` : 'progressbar--filled'}`"
                  :style="{width: `${getUsedPercent(usedQuota)}%`}">
                </div>
              </template>
            </Tooltip>
          </div>
        </div>
      </div>

      <div class="quota-data">
        <div class="quota-cell cell--medium">
          <span class="text is-small is-txtSoftGrey" v-if="!unlimited">
            {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(remainingQuota)) : roundOneDecimal(remainingQuota) }} {{unit}}
          </span>
        </div>
        <div class="quota-cell cell--medium cell--mobile">
          <span class="text is-small is-txtSoftGrey" v-if="!unlimited">
            {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(totalUsedQuota)) : roundOneDecimal(totalUsedQuota) }} {{unit}}
          </span>
        </div>
        <div class="quota-cell cell--medium">
          <span class="text is-small is-txtSoftGrey" v-if="!unlimited">
            {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(totalQuota)) : roundOneDecimal(totalQuota) }} {{unit}}
          </span>
          <span class="text is-small is-txtSoftGrey" v-else>
            {{ formatToLocale ? getNumberInLocaleFormat(roundOneDecimal(totalUsedQuota)) : roundOneDecimal(totalUsedQuota) }} {{unit}}
          </span>
        </div>
        <div class="quota-help cell--small">
          <Tooltip :text="helpText" position="bottom-left" hide-delay="0s" show-delay="1s">
            <a :href="helpLink" v-if="helpLink" target= "_blank"><img svg-inline class="quota-image" :class="{'is-active': active}" src="../../../assets/icons/common/question-mark.svg"/></a>
          </Tooltip>
        </div>
      </div>
    </div>
    <div class="quota-legend" v-if="Array.isArray(usedQuota)">
      <div v-for="item in usedQuota"
        :key="item.label"
        class="legend-item text is-small is-semibold">
          <span class="legend-icon" :style="{backgroundColor: item.color}"></span>
          {{item.label}}
      </div>
    </div>
    <div class="quota-warning" v-if="showWarning">
      <p class="is-small is-bold">
        <img src="../../../assets/icons/apps/warning.svg" />
        {{$t('QuotaSection.quotaExceeded')}}
      </p>
    </div>
  </div>
</template>

<script>
import NotificationBadge from 'new-dashboard/components/NotificationBadge';
import Tooltip from 'new-dashboard/components/Tooltip/Tooltip';
import { mapState } from 'vuex';

const THRESHOLDS = {
  WARNING: 60,
  PROBLEM: 90
};

export default {
  name: 'StackedQuotaCard',
  props: {
    name: String,
    availableQuota: Number,
    unit: String,
    usedQuota: [Array, Number],
    billingPeriod: String,
    formatToLocale: {
      type: Boolean,
      default: true
    },
    helpText: String,
    helpLink: String,
    isDisabled: {
      type: Boolean,
      default: false
    },
    unlimited: {
      type: Boolean,
      default: false
    },
    qualitative: {
      type: Boolean,
      default: false
    }
  },
  components: {
    NotificationBadge,
    Tooltip
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
    showWarning () {
      return this.remainingQuota <= 0;
    },
    tooltipText () {
      let tooltip = Array.isArray(this.usedQuota) ? `${this.usedQuota.map(quotaEntry => {
        return `${quotaEntry.label} ${this.getNumberInLocaleFormat(this.roundOneDecimal(quotaEntry.value))} ${this.unit}`;
      }).join('<br>')}` : null;

      return tooltip;
    },
    totalUsedQuota () {
      return !Array.isArray(this.usedQuota) ? this.usedQuota : this.usedQuota.reduce((acum, current) => {
        return acum + current.value;
      }, 0);
    },
    totalQuota () {
      return this.availableQuota;
    },
    remainingQuota () {
      return this.totalQuota - this.totalUsedQuota;
    },
    getStatusBar () {
      const usedPercent = this.getUsedPercent(this.totalUsedQuota);
      if (usedPercent > THRESHOLDS.PROBLEM) {
        return 'problem';
      } else if (usedPercent > THRESHOLDS.WARNING) {
        return 'warning';
      } else {
        return 'good';
      }
    }
  },
  methods: {
    getUsedPercent (used) {
      if (this.totalQuota === 0) {
        return 100;
      }
      const width = (used / this.totalQuota) * 100;

      return width;
    },
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

.quota-widget-wrapper {
  width: 100%;
  padding: 28px 0;
  min-height: 80px;

  &:not(:last-of-type) {
    border-bottom: 1px solid $border-color;
  }

  .quota-warning {
    display: flex;
    padding-top: 20px;
    margin-left: 36px;

    p {
      display: flex;
      align-items: center;
      border-radius: 18px;
      padding: 8px 16px 8px 10px;
      background-color: $warning__bg-color-light;

      img {
        margin-right: 8px;
      }
    }

  }

  .quota-legend {
    display: flex;
    padding-top: 20px;
    margin-left: 206px;

    .legend-item {
      display: flex;
      align-items: center;

      &:not(:last-child) {
        margin-right: 14px;
      }

      .legend-icon {
        display: block;
        height: 8px;
        width: 8px;
        margin-right: 6px;
        border-radius: 50%;
      }
    }

  }
}

.quota-widget {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.is-disabled {
    background-color: rgba($color-primary--soft, 0.3);

    .cell--title,
    .quota-data {
      opacity: 0.3;
    }
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
  padding-right: 24px;
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
  display: flex;
  overflow: hidden;
  flex: 0 0 auto;
  width: 100%;
  max-width: 260px;
  height: 8px;
  border-radius: 4px;
  background-color: $progressbar__bg-color;

  .tooltip-container {
    width: 100%;
  }

  &:not(:last-child) {
    border-radius: 4px 0 0 4px;
    border-right: 1px solid $progressbar__bg-color;
  }
  &:not(:first-child) {
    // border-radius: 0 4px 4px 0;
    border-radius: 0;
  }

  &.progressbar--filled {
    background-color: $color-primary--dark;
  }

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
