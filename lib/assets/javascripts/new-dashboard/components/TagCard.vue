<template>
  <router-link :to="{ name: 'tagSearch', params: { tag: tag.tag } }" class="link">
    <article class="card tag">
      <h3 class="tag__title title is-medium is-semibold">{{ tag.tag }}</h3>
      <ul>
        <li class="tag__count text is-caption">
          {{ $tc('TagCard.maps', tag.maps, { maps: tag.maps }) }}
        </li>
        <li class="tag__count text is-caption">
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
    tag: Object
  }
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.card {
  position: relative;
  height: 100%;
  padding: 16px;
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid $light-grey;
  background-color: $white;
}

.tag__title,
.tag__count {
  margin-bottom: 8px;
  color: $text-color;
}

.link:hover {
  text-decoration: none;
}
</style>
