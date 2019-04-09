<template>
  <div class="header">
    <div class="container">
      <ul class="breadcrumbs">
        <li class="breadcrumbs__item"
          :class="[isCurrentStep (currentStep, index) ? 'current' : '']"
          v-for="(stepName, index) in stepNames" :key="stepName">
          <a href="javascript:void 0" @click="goToStep(index)">
            <span class="breadcrumbs__checkpoint" :class="[isCurrentStep (currentStep, index) ? 'current' : '']">
              <span class="breadcrumbs__text">{{ stepName }}</span>
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
    },
    goToStep (stepNumber) {
      this.$emit('goToStep', stepNumber + 1);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

$timeline__border-width: 1px;
$timeline__border-color: #DDD;
$timeline__border-transition: 0.25s;
$bullet__transition: 0.12s;
$bullet__border-color: #D3E6FA;
$transition__timing-function: cubic-bezier(0.4, 0.01, 0.165, 0.99);

.header {
  display: block;
  padding-top: 2.375em;
  background: $white;
}

.container {
  width: 100%;
}

.breadcrumbs {
  display: flex;
  justify-content: space-between;
  max-width: 90%;
  margin: 0 auto 1.5em;

  &__item {
    position: relative;
    width: 100%;
    height: 36px;

    &:not(:last-child) {
      border-top: $timeline__border-width solid $primary-color;
    }

    &:last-child {
      width: 0;
      border-top: $timeline__border-width solid transparent;
    }

    &::after {
      content: '';
      display: block;
      position: absolute;
      top: -$timeline__border-width;
      right: 0;
      width: 0%;
      transition: width $timeline__border-transition $transition__timing-function;
      border-top: $timeline__border-width solid $timeline__border-color;
    }

    &.current {
      &::after {
        content: '';
        display: block;
        position: absolute;
        top: -$timeline__border-width;
        right: 0;
        width: 100%;
        transition: width $timeline__border-transition $transition__timing-function;
        border-top: $timeline__border-width solid $timeline__border-color;
      }

      &:last-child {
        border-color: transparent;
      }

      & ~ .breadcrumbs__item {
        border-color: $timeline__border-color;

        &::after {
          content: '';
          display: block;
          position: absolute;
          top: -$timeline__border-width;
          right: 0;
          width: 100%;
          transition: none;
          border-top: $timeline__border-width solid $timeline__border-color;
        }

        &:last-child {
          border-color: transparent;
        }
      }

      & ~ .breadcrumbs__item .breadcrumbs__checkpoint {
        top: -4px;
        left: -4px;
        width: 7px;
        height: 7px;
        background: $timeline__border-color;
      }

      & ~ .breadcrumbs__item .breadcrumbs__text {
        color: $text-secondary-color;
      }
    }
  }

  &__text {
    position: absolute;
    top: 24px;
    transform: translateX(-50%);
    color: $text-color;
    font-size: 0.75em;
    white-space: nowrap;
  }

  &__checkpoint {
    display: block;
    position: absolute;
    z-index: 1;
    top: -4px;
    left: -4px;
    width: 7px;
    height: 7px;
    transition: all $bullet__transition $transition__timing-function;
    border-radius: 50%;
    background: $primary-color;

    &.current {
      transition: all $bullet__transition $transition__timing-function;
      transition-delay: $timeline__border-transition;
      box-shadow: 0 0 0 6px $bullet__border-color;

      .breadcrumbs__text {
        transition: all $bullet__transition $transition__timing-function;
        color: $text-color;
        font-weight: 600;
      }
    }
  }
}
</style>
