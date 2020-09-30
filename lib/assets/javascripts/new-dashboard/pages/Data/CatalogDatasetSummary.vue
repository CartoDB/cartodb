<template>
  <div class="grid grid-cell u-flex__justify--center wrap-reverse--tablet">
    <div class="grid-cell grid-cell--col9 grid-cell--col12--tablet main-column">
      <p
        class="text is-caption is-txtMainTextColor u-mt--32 u-mt--12--tablet"
        v-html="dataset.description || 'No description available.'"
      >
      </p>
      <transition name="fade">
        <div class="key-variables u-mt--32" v-if="keyVariables.length">
          <h5 class="title is-caption is-txtMainTextColor">
            Key variables
            <router-link :to="{ name: 'catalog-dataset-data' }" class="is-small"
              >(View all)</router-link
            >
          </h5>
          <ul class="text is-caption column-list u-mt--24">
            <li v-for="variable in keyVariables" :key="variable.id">
              <span>{{ variable.name }}</span>
            </li>
          </ul>
        </div>
      </transition>
    </div>
    <div class="grid-cell--col1 grid-cell--col0--tablet"></div>
    <div class="grid-cell grid-cell--col2 grid-cell--col12--tablet sidebar">
      <ul class="side-characteristics">
        <li class="u-mb--32 u-mb--12--tablet">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">License</h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ dataset.license_name }}
          </p>
        </li>
        <li class="u-mb--32 u-mb--12--tablet">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">Country</h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ dataset.country_name }}
          </p>
        </li>
        <li class="u-mb--32 u-mb--12--tablet">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">Source</h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ dataset.provider_name }}
          </p>
        </li>
        <li class="u-mb--32 u-mb--12--tablet">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">Placetype</h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ dataset.placetype_name }}
          </p>
        </li>
        <li class="u-mb--32 u-mb--12--tablet" v-if="isGeography">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">Geometry type</h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ geometryType }}
          </p>
        </li>
        <li class="u-mb--32 u-mb--12--tablet" v-if="!isGeography">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">
            Temporal aggregation
          </h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ temporalAggregation }}
          </p>
        </li>
        <li class="u-mb--32 u-mb--12--tablet">
          <h4 class="text is-small is-txtSoftGrey u-mb--10">
            Update Frequency
          </h4>
          <p class="text is-caption is-txtMainTextColor">
            {{ updateFrequency }}
          </p>
        </li>
        <li
          class="u-mb--32 u-mb--12--tablet"
          v-if="!isGeography && dataset.geography_is_product && (dataset.geography_slug || dataset.geography_id)"
        >
          <h4 class="text is-small is-txtSoftGrey u-mb--10">
            Associated Geography
          </h4>
          <p class="text is-caption">
            <router-link
              :to="{
                name: 'catalog-dataset-summary',
                params: {
                  datasetId: (dataset.geography_slug || dataset.geography_id),
                  type: 'geography'
                }
              }"
            >
              {{ dataset.geography_name }}
            </router-link>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { temporalAggregationName } from 'new-dashboard/utils/catalog/temporal-agregation-name';
import { geometryTypeName } from 'new-dashboard/utils/catalog/geometry-type-name';
import { updateFrequencyName } from 'new-dashboard/utils/catalog/update-frequency-name';
import { sendCustomDimensions } from 'new-dashboard/utils/catalog/custom-dimensions-ga';

export default {
  name: 'CatalogDatasetSummary',
  watch: {
    dataset: {
      handler (value) {
        if (value && value.category_name) {
          sendCustomDimensions(
            value.category_name,
            value.country_name,
            value.is_public_data,
            value.provider_name
          );
        }
      },
      immediate: true
    }
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      keyVariables: state => state.catalog.keyVariables
    }),
    temporalAggregation () {
      return temporalAggregationName(this.dataset.temporal_aggregation);
    },
    updateFrequency () {
      return updateFrequencyName(this.dataset.update_frequency);
    },
    isGeography () {
      return this.$route.params.type === 'geography';
    },
    geometryType () {
      return geometryTypeName(this.dataset.geom_type);
    }
  },
  methods: {
    fetchKeyVariables () {
      this.$store.dispatch('catalog/fetchKeyVariables', {
        id: this.$route.params.datasetId,
        type: this.$route.params.type
      });
    }
  },
  mounted () {
    this.fetchKeyVariables();
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.map-header {
  overflow: hidden;
  border-radius: 4px;

  img {
    max-width: 100%;
  }
}

.column-list {
  padding-left: 32px;
  column-gap: 48px;
  column-count: 2;
  column-width: 50%;

  li {
    margin-bottom: 12px;
    list-style: disc;

    span {
      display: inline-block;
      vertical-align: text-top;
    }
  }
}

@media (max-width: $layout-tablet) {
  .wrap-reverse--tablet {
    flex-wrap: wrap-reverse;
  }

  .side-characteristics {
    display: flex;
    overflow: scroll;
    -webkit-overflow-scrolling: touch;

    li {
      flex-shrink: 0;
      padding-right: 24px;
      white-space: nowrap;

      &:last-of-type {
        padding-right: 72px;
      }
    }
  }

  .sidebar {
    position: relative;
    border-bottom: 1px solid $neutral--300;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 72px;
      height: 100%;
      background-image: linear-gradient(
        90deg,
        rgba($white, 0) 0,
        $white 70%,
        $white 100%
      );
      pointer-events: none;
    }
  }

  .column-list {
    column-count: unset;
  }
}
</style>
