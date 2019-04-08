<template>
  <div class="selector" tabindex="0">
    <h3 class="title is-body is-medium u-mb--8" :class="iconClass">{{ this.title }}</h3>
    <p class="is-caption">{{ this.text }}</p>
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
  max-width: 460px;
  padding: 1.5em;
  border: 1px solid $grey;
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

    &--map {
      &::before {
        content: '';
        height: 50px;
        background-image: url('../../assets/icons/wizard/locationmap.svg');
      }
    }

    &--notebook {
      &::before {
        content: '';
        background-image: url('../../assets/icons/wizard/notebook.svg');
      }
    }

    &--window {
      &::before {
        content: '';
        background-image: url('../../assets/icons/wizard/window.svg');
      }
    }
  }

  &__tags {
    margin-top: 66px;

    &-item {
      display: inline-block;
      margin-top: 8px;
      margin-right: 8px;
      padding: 6px 16px;
      border: 1px solid $onboarding-tags__border-color;
      border-radius: 3px;
      font-size: 10px;
      text-transform: uppercase;
    }
  }
}

</style>
