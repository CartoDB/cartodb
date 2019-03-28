<template>
  <div class="header">
    <div class="container">
      <ul class="breadcrumbs">
        <li class="breadcrumbs__item"
          :class="[isCurrentStep (currentStep, index) ? 'current' : '']"
          v-for="(stepName, index) in stepNames" :key="stepName">
          <a href="">
            <span class="breadcrumbs__checkpoint" :class="[isCurrentStep (currentStep, index) ? 'current' : '']">
              <span class="breadcrumbs__text">{{ index + 1 }} - {{ stepName }}</span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Header',
  props: {
    stepNames: Array,
    currentStep: Number
  },
  methods: {
    isCurrentStep (stepNum, index) {
      return index + 1 === stepNum;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

$timeline__border-width: 4px;

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4em 0 2em;
  border-bottom: 1px solid $grey;
  background: $white;
}

.container {
  width: 100%;
}

.breadcrumbs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1em;

  &__item {
    position: relative;
    width: 100%;
    height: 50px;

    &:not(:last-child) {
      border-top: $timeline__border-width solid $primary-color--soft;
    }

    &:last-child {
      width: 0;
      border-top: $timeline__border-width solid transparent;
    }

    &.current {
      border-color: $grey;

      &:last-child {
        border-color: transparent;
      }

      & ~ .breadcrumbs__item {
        border-color: $grey;

        &:last-child {
          border-color: transparent;
        }
      }

      & ~ .breadcrumbs__item .breadcrumbs__checkpoint {
        top: -10px;
        left: -10px;
        width: 16px;
        height: 16px;
        border: $timeline__border-width solid $grey;
        background: $white;
      }
    }
  }

  &__text {
    position: absolute;
    top: 30px;
    transform: translateX(-50%);
    color: $text-secondary-color;
    font-size: 0.75em;
    white-space: nowrap;
  }

  &__checkpoint {
    display: block;
    position: absolute;
    top: -9px;
    left: -9px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: $primary-color--soft;

    &.current {
      top: -6px;
      left: -6px;
      width: 8px;
      height: 8px;
      background: $primary-color;
      box-shadow: 0 0 0 12px rgba($primary-color, 0.2);

      .breadcrumbs__text {
        color: $primary-color;
      }
    }
  }
}
</style>
