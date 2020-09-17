<template>
  <li class="list-item">
    <div class="main-item">
      <div class="category title is-small grid grid--space">
        <div>
          <span class="country">{{ dataset.country_name }}</span>
          <span>·</span
          >{{ dataset.category_name ? dataset.category_name : 'Geography' }}
        </div>
        <div>
          {{ dataset.provider_name }}
        </div>
      </div>
      <div class="info u-mr--72">
        <h3 class="title is-body u-mb--8">
          <router-link
            :to="{
              name: 'catalog-dataset-summary',
              params: {
                datasetId: dataset.slug,
                type: dataset.is_geography ? 'geography' : 'dataset'
              }
            }"
            >{{ dataset.name }}</router-link
          >
        </h3>
        <p class="description text">{{ dataset.description }}</p>
      </div>
      <div
        class="extra text is-small grid u-mt--16"
        v-if="!dataset.is_geography"
      >
        <div
          class="grid-cell--col7 grid grid--align-end grid--no-wrap"
        >
          <div class="license">
            <p>License</p> {{ dataset.license_name }}
          </div>
          <div class="geography" :title="dataset.placetype_name">
            <p>Placetype</p> {{ dataset.placetype_name }}
          </div>
        </div>
        <div
          class="grid-cell--col5 grid grid--align-end grid--space grid--no-wrap"
        >
          <div class="aggregation">
            <p>Temporal aggr.</p> {{ temporalAggregation }}
          </div>
          <div class="provider">
            <img
              :src="providerLogo"
              :alt="dataset.provider_name"
              :title="dataset.provider_name"
            />
          </div>
        </div>
      </div>
      <div class="extra text is-small grid u-mt--16" v-else>
        <div
          class="grid-cell--col7 grid grid--align-end grid--no-wrap"
        >
          <div class="license">
            <p>License</p> {{ dataset.license_name }}
          </div>
          <div class="geography" :title="dataset.placetype_name">
            <p>Placetype</p> {{ dataset.placetype_name }}
          </div>
        </div>
        <div
          class="grid-cell--col5 grid grid--align-end grid--space grid--no-wrap"
        >
          <div class="aggregation">
            <p>Geometry type</p> {{ geometryType }}
          </div>
          <div class="provider">
            <img
              :src="providerLogo"
              :alt="dataset.provider_name"
              :title="dataset.provider_name"
            />
          </div>
        </div>
      </div>
    </div>
    <DatasetListItemExtra v-if="extra" :dataset="dataset"></DatasetListItemExtra>
  </li>
</template>

<script>
import { temporalAggregationName } from 'new-dashboard/utils/catalog/temporal-agregation-name';
import { geometryTypeName } from 'new-dashboard/utils/catalog/geometry-type-name';
import DatasetListItemExtra from 'new-dashboard/components/Subscriptions/DatasetListItemExtra';

export default {
  name: 'DatasetListItem',
  props: {
    dataset: {
      type: Object,
      required: true
    },
    extra: {
      type: Boolean,
      required: false
    }
  },
  components: {
    DatasetListItemExtra
  },
  computed: {
    temporalAggregation () {
      return temporalAggregationName(this.dataset.temporal_aggregation);
    },
    providerLogo () {
      return `https://libs.cartocdn.com/data-observatory/assets/providers/${this.dataset.provider_id}.png`;
    },
    geometryType () {
      return geometryTypeName(this.dataset.geom_type);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.list-item {
  display: flex;
  width: 100%;
  padding: 12px;
  border-bottom: 1px solid $neutral--300;
  color: $navy-blue;

  &:hover {
    background-color: $blue--100;
  }

  .main-item {
    width: 100%;
    padding: 12px;
  }

  .category {
    margin-bottom: 8px;

    span:not(.country) {
      margin: 0 8px;
      color: $neutral--600;
    }

    .country {
      text-transform: uppercase;
    }
  }

  h3 a {
    margin-bottom: 8px;
    color: inherit;
    font-size: 20px;
    line-height: 28px;

    &:hover {
      text-decoration: underline;
    }
  }

  .description {
    height: 60px;
    font-size: 14px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .extra {
    width: 100%;

    .nowrap > div {
      white-space: nowrap;

      &.geography {
        overflow-x: hidden;
        text-overflow: ellipsis;
      }
    }

    p {
      color: $neutral--600;
      display: block;
      margin-bottom: 4px;
    }

    .license {
      margin-right: 24px;
    }

    .grid--reverse {
      flex-direction: row-reverse;
    }

    .provider {
      flex: 0 0 auto;
      display: block;
      width: 36px;
      height: 36px;
      margin-left: 8px;

      img {
        max-width: 100%;
      }
    }
  }

  @media (max-width: $layout-tablet) {
    padding-left: 0;
    padding-right: 0;
    .info.u-mr--72 {
      margin-right: 0;
    }
  }
}
</style>
