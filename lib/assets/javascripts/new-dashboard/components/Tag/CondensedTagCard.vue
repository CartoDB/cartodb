<template>
  <a href=""
      class="tag__item">
      <div class="viz-column--main-info">
        <div class="cell cell--start cell--first">
          <div class="tag__thumbnail">
              <div class="tag__icon"></div>
          </div>
        </div>
        <div class="cell cell--main">
            <h3 class="tag__title text is-caption is-txtGrey u-ellipsis row-title">
              {{ tag.tag }}
            </h3>
        </div>
      </div>
      <div class="viz-column--extra-info">
        <div class="viz-column--status">
          <div class="cell cell--large u-txt-right">
          </div>
          <div class="tag__text cell cell--xsmall u-txt-right">
            <span class="text is-small is-txtSoftGrey"> {{ tag.maps }}</span>
          </div>
          <div class="tag__text cell cell--small u-txt-right">
            <span class="text is-small is-txtSoftGrey"> {{ tag.datasets }}</span>
          </div>
        </div>
      </div>
  </a>
</template>

<script>
export default {
  name: 'CondensedTagCard',
  props: {
    tag: Object
  }
}
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.tag {
  &__item {
    display: flex;
    align-items: center;
    width: 100%;
    height: 80px;
    padding: 0 14px;
    background-color: $white;

    &:hover {
      background-color: $softblue;
      text-decoration: none;

      .tag__title {
        color: $primary-color;
        text-decoration: underline;
      }

    }
  }

  &__thumbnail {
    width: 36px;
    height: 36px;
    margin-right: 6px;
    margin-left: 6px;
    padding: 9px;
    border-radius: 2px;
    background-color: $light-grey;
  }

  &__icon {
    width: 100%;
    height: 100%;
    background-image: url("../../assets/icons/section-title/tags.svg");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 18px;
  }
}


</style>
