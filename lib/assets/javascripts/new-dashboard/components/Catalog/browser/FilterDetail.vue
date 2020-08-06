<template>
  <div class="filter-detail">
    <div class="label text is-small is-txtMidGrey u-mt--8 u-ml--12">
      {{ filterName }}
    </div>
    <ul class="filter-container">
      <li v-for="filter in filters" :key="filter.id">
        <div class="filter-tag title is-small is-txtNavyBlue u-ml--12 u-mb--12">
          {{ filter.name }}
          <button class="u-ml--8" @click="deleteFilter(filter)">
            <img :src="icon_by_environment('close-tag.svg')" alt="Delete" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { filtersMetadata } from 'new-dashboard/utils/catalog/constants';
import icon_by_environment from 'new-dashboard/mixins/catalog/icon_by_environment';

export default {
  name: 'FilterDetail',
  mixins: [icon_by_environment],
  props: {
    filterId: String,
    filters: Array
  },
  computed: {
    ...mapState({
      filterMetadata (state) {
        return state.catalog.filtersAvailable[this.filterId];
      }
    }),
    filterName () {
      return filtersMetadata[this.filterId].label;
    }
  },
  methods: {
    deleteFilter (filterValue) {
      this.$store.commit('catalog/removeFilter', {
        id: this.filterId,
        value: filterValue
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.label {
  flex-shrink: 0;
  width: 82px;
}

.filter-detail {
  display: flex;
  flex-direction: row;
  padding-top: 12px;
  border-top: 1px solid $neutral--300;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
}

.filter-tag {
  display: flex;
  align-items: center;
  padding: 4px 4px 4px 12px;
  border-radius: 4px;
  background-color: $color-primary--soft;
  white-space: nowrap;

  button {
    padding: 0;
    cursor: pointer;

    img {
      display: block;
    }
  }
}
</style>
