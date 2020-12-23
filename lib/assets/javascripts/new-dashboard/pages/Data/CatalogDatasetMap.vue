<template>
  <div v-if="hasSample">
    <div class="catalog-dataset-info" v-if="defaultSource">
      <span class="is-small is-txtMainTextColor">
        (*) Map preview not available: this one is for&nbsp;
        <i class="is-semibold is-italic">{{ defaultSource }}</i>
      </span>
    </div>
    <div class="catalog-dataset-map">
      <div class="header">
        <h1 class="is-txtMainTextColor">{{ title }}</h1>
        <img src="../../assets/icons/catalog/button-question.svg" alt="question" @click="infoVisible = !infoVisible">
      </div>
      <CatalogMap class="base-map" :showInfo="infoVisible" :legend="true" :recenter="true" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CatalogMap from 'new-dashboard/components/Catalog/CatalogMap';

export default {
  name: 'CatalogDatasetMap',
  components: {
    CatalogMap
  },
  data () {
    return {
      infoVisible: false
    };
  },
  created () {
    if (!this.hasSample) {
      this.$router.replace({ name: 'catalog-dataset-summary' });
    }
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset
    }),
    title () {
      return this.dataset.name;
    },
    defaultSource () {
      return this.dataset.sample_info && this.dataset.sample_info.default_source;
    },
    hasSample () {
      return this.dataset.sample_info && !!this.dataset.sample_info.id;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.catalog-dataset-map {
  margin: 12px 12px 24px;
  padding: 12px;
  border-radius: 4px;
  background: $color-primary--soft;
  font-family: $base__font-family;

  .header {
    display: flex;
    justify-content: space-between;

    h1 {
      font-weight: 600;
    }

    img {
      width: 30px;
      height: 30px;
      cursor: pointer;
    }
  }

  .base-map {
    margin-top: 6px;
  }
}

.catalog-dataset-info {
  display: flex;
  justify-content: flex-end;
  margin: 28px 20px 20px;
  font-family: $base__font-family;

  span {
    display: flex;
    align-items: center;
    white-space: pre-wrap;

    &:after {
      content: url('../../assets/icons/catalog/interface-alert-triangle.svg');
      margin-left: 12px;
    }
  }
}
</style>
