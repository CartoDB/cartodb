<template>
  <div class="quota-widget">
    <div class="quota-main">
      <div class="cell--title">
        <h4 class="text is-caption is-semibold is-txtGrey">{{name}}</h4>
      </div>
      <div class="quota-cell cell--large">
        <div class="progressbar">
            <div :class="`progressbar progressbar--${getStatusBar}`"  :style="{width: `${getUsedPercent}%`}">
            </div>
        </div>
      </div>
    </div>

    <div class="quota-info">
      <div class="quota-cell cell--medium">
        <span class="text is-small is-txtSoftGrey">{{roundOneDecimal(remainingQuota)}} {{unit}}</span>
      </div>
      <div class="quota-cell cell--medium">
        <span class="text is-small is-txtSoftGrey">{{roundOneDecimal(usedQuota)}} {{unit}}</span>
      </div>
      <div class="quota-cell cell--medium">
        <span class="text is-small is-txtSoftGrey">{{roundOneDecimal(availableQuota)}} {{unit}}</span>
        <!-- <p class="text is-subheader is-txtGrey" :class="{'is-subheader': !isCompact, 'is-caption': isCompact}">{{roundOneDecimal(usedQuota)}} / {{roundOneDecimal(availableQuota)}} {{unit}}</p> -->
      </div>
      <div class="quota-cell cell--small quota-help">
        <img svg-inline src="../../assets/icons/common/question-mark.svg"/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuotaCard',
  props: {
    name: String,
    availableQuota: Number,
    usedQuota: Number,
    unit: String,
    mode: String
  },
  computed: {
    remainingQuota () {
      return this.availableQuota - this.usedQuota;
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
    },
    isCompact () {
      return this.mode === 'compact';
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

.quota-main {
  display: flex;
  width: 100%;
}

.quota-info {
  display: flex;
}

.quota-cell {
  display: flex;
  position: relative;
  flex-grow: 0;
  flex-shrink: 0;
  align-items: center;
  padding: 0 10px;
  text-overflow: ellipsis;
  white-space: nowrap;

  // &:first-of-type {
  //   padding-left: 0;
  // }

  // &:last-of-type {
  //   padding-right: 0;
  // }
}

.cell--title {
  width: 110px;
  margin-left: 36px;
}

.cell--large {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 200px;
}

.cell--medium {
  width: 120px;
}

.cell--small {
  width: 58px;
}

.progressbar {
  width: 100%;
  max-width: 240px;
  height: 8px;
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

.quota-widget {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.quota-help {
  justify-content: flex-end;
  padding-right: 16px;
}

// .quota-widget:not(:only-child) {
//   height: auto;
//   margin-bottom: 28px;
//   padding: 0;
//   border: none;
//   box-shadow: none;

//   &:last-of-type {
//     margin-bottom: 0;
//   }
//   // .info-container {
//   //   display: flex;
//   //   justify-content: space-between;
//   // }


//   .progressbar {
//     margin-top: 16px;
//   }
// }

</style>
