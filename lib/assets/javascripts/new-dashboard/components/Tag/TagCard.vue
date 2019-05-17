<template>
  <router-link :to="{ name: 'tagSearch', params: { tag: tag.tag } }" class="link">
    <article class="card tag" :class="{ 'condensed': condensed }">
      <h3 class="tag__title is-txtGrey" :class="[condensed ? 'text is-caption' : 'title is-medium is-semibold']">{{ tag.tag }}</h3>
      <ul>
        <li class="tag__count tag__count--maps text" :class="[condensed ? 'is-small is-txtSoftGrey' : 'is-caption is-txtGrey']">
          {{ $tc('TagCard.maps', tag.maps, { maps: tag.maps }) }}
        </li>
        <li class="tag__count tag__count--datasets text" :class="[condensed ? 'is-small is-txtSoftGrey' : 'is-caption is-txtGrey']">
          {{ $tc('TagCard.datasets', tag.datasets, { datasets: tag.datasets }) }}
        </li>
      </ul>
    </article>
  </router-link>
</template>

<script>
export default {
  name: 'TagCard',
  props: {
    tag: Object,
    condensed: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.card {
  position: relative;
  height: 100%;
  padding: 16px;
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid $border-color;
  background-color: $white;

  &:hover {
    border-color: transparent;
    box-shadow: $card__shadow;
    cursor: pointer;

    .tag__title {
      color: $primary-color;
      text-decoration: underline;
    }
  }

  &.condensed:hover {
    background-color: $softblue;
    box-shadow: none;
  }
}

.tag__title {
  overflow: hidden;
  transition: color 300ms cubic-bezier(0.4, 0, 0.2, 1);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag__title,
.tag__count {
  position: relative;
  margin-bottom: 8px;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 12px;
    height: 100%;
    transform: translate3d(0, -50%, 0);
    background-repeat: no-repeat;
    background-position: center left;
    background-size: contain;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.tag__count {
  padding-left: 24px;
}

.link:hover {
  text-decoration: none;
}

.tag__count--maps {
  &::before {
    width: 15px;
    background-image: url('../../assets/icons/sections/tags/map.svg');
  }
}

.tag__count--datasets {
  &::before {
    width: 14px;
    background-image: url('../../assets/icons/sections/tags/datasets.svg');
  }
}
</style>
