<template>
  <div class="quota-widget">
    <div class="info-container">
      <h4 class="title is-caption is-txtGrey card-title">{{name}} <span class="is-regular">{{amount}}</span></h4>
      <p class="text is-subheader is-txtGrey" :class="{'is-subheader': !isCompact, 'is-caption': isCompact}">{{roundOneDecimal(usedCapacity)}} / {{roundOneDecimal(availableCapacity)}} {{unit}}</p>
    </div>
    <div class="progressbar">
        <div :class="`progressbar progressbar--${getStatusBar}`"  :style="{width: `${getUsedPercent}%`}">
        </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuotaCard',
  props: {
    name: String,
    amount: String,
    availableCapacity: Number,
    usedCapacity: Number,
    unit: String,
    type: String
  },
  computed: {
    getUsedPercent () {
      if (this.availableCapacity === 0) {
        return 100;
      }
      const width = (this.usedCapacity / this.availableCapacity) * 100;
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
    },
    isCompact () {
      return this.type === 'compact';
    }
  },
  methods: {
    roundOneDecimal (number) {
      return Math.round(number * 10) / 10;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.card-title {
  margin-bottom: 8px;
}

.progressbar {
  width: 100%;
  max-width: 100%;
  height: 8px;
  margin-top: 24px;
  border-radius: 4px;
  background-color: $light-grey;

  &.progressbar--good {
    background-color: $good-state;
  }

  &.progressbar--warning {
    background-color: $warning-state;
  }

  .progressbar--problem {
    background-color: $error-state;
  }
}

.quota-widget:not(:only-child) {
  height: auto;
  margin-bottom: 28px;
  padding: 0;
  border: none;
  box-shadow: none;

  &:last-of-type {
    margin-bottom: 0;
  }

  .info-container {
    display: flex;
    justify-content: space-between;
  }

  .card-title {
    margin-bottom: 0;
  }

  .progressbar {
    margin-top: 16px;
  }
}
</style>
