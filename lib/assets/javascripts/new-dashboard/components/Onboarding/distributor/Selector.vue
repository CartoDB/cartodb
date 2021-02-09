<template>
  <div class="selector" tabindex="0">
    <div>
      <h3 class="selector__title title is-body is-medium u-mb--8" :class="iconClass">
        {{ this.title }}
      </h3>

      <p class="text is-caption">{{ this.text }}</p>
    </div>

    <ul class="selector__tags">
      <li class="selector__tags-item title" v-for="tag in tags" :key="tag">{{ tag }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'Selector',
  props: {
    title: String,
    text: String,
    tags: {
      type: Array,
      default () {
        return [];
      }
    },
    iconModifier: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconClass () {
      return (this.iconModifier ? `selector__title-icon selector__title-icon--${this.iconModifier}` : '');
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.selector {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 460px;
  height: 340px;
  padding: 1.5em;
  border: 1px solid $border-color--dark;
  border-radius: 2px;
  background-color: $white;
  cursor: pointer;

  &__title-icon {
    &::before {
      content: '';
      display: block;
      position: relative;
      top: -16px;
      width: 48px;
      height: 48px;
      margin-top: 16px;
      background-repeat: no-repeat;
      background-position: center;
    }

    &--tilesets {
      &::before {
        content: '';
        height: 50px;
        background-image: url('../../../assets/icons/onboarding/tilesets-big.svg');
      }
    }

    &--map {
      &::before {
        content: '';
        height: 50px;
        background-image: url('../../../assets/icons/onboarding/locationmap.svg');
      }
    }

    &--notebook {
      &::before {
        content: '';
        background-image: url('../../../assets/icons/onboarding/notebook.svg');
      }
    }

    &--window {
      &::before {
        content: '';
        background-image: url('../../../assets/icons/onboarding/window.svg');
      }
    }
  }

  &__tags {
    &-item {
      display: inline-block;
      margin-top: 8px;
      margin-right: 8px;
      padding: 6px 16px;
      border: 1px solid $onboarding-tags__border-color;
      border-radius: 18px;
      font-size: 10px;
      text-transform: uppercase;
    }
  }

  &:hover,
  &:focus {
    outline: none;
    box-shadow: $card__shadow;

    .selector__title {
      color: $primary-color;
      text-decoration: underline;
    }
  }
}
</style>
