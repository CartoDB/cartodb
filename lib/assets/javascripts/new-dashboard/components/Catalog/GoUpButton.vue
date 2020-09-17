<template>
  <button
    class="go-up-button u-flex u-flex__align--center u-flex__justify--center"
    :class="{active: active}"
    type="button"
    name="button"
    @click="scrollUp"
  >
    <img src="../../assets/icons/catalog/arrow-top.svg" alt="top">
  </button>
</template>

<script>
export default {
  name: 'GoUpButton',
  data () {
    return {
      active: false
    };
  },
  mounted () {
    window.addEventListener('scroll', this.handleScroll);
  },
  methods: {
    scrollUp () {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    },
    handleScroll () {
      this.active = window.pageYOffset > 100;
    }
  },
  destroyed () {
    window.removeEventListener('scroll', this.handleScroll);
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';
  .go-up-button {
    cursor: pointer;
    outline: none;
    width: 56px;
    height: 56px;
    border-radius: 100%;
    box-shadow: 0 4px 16px 0 rgba(44, 44, 44, 0.16);
    background-color: $white;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: transform .25s ease, opacity .25s ease;
    &.active {
      pointer-events: all;
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
