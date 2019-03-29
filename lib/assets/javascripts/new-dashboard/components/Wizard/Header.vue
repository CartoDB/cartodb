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

$timeline__border-width: 1px;
$timeline__border-color: #DDD;
$timeline__border-transition: 0.25s;
$bullet__transition: 0.25s;
$bullet__border-color: #D3E6FA;


.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5em 0 0.5em;
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
      transition: width $timeline__border-transition ease;
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
        transition: width $timeline__border-transition ease;
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
    z-index: 1;
    top: -4px;
    left: -4px;
    width: 7px;
    height: 7px;
    transition: all $bullet__transition ease;
    border-radius: 50%;
    background: $primary-color;

    &.current {
      transition: all $bullet__transition ease;
      transition-delay: $timeline__border-transition;
      box-shadow: 0 0 0 6px $bullet__border-color;

      .breadcrumbs__text {
        transition: all $bullet__transition ease;
        color: $text-color;
        font-weight: 600;
      }
    }
  }
}
</style>
