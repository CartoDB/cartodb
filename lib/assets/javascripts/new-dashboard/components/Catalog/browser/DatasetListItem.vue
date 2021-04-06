<template>
  <li class="list-item">
    <div class="main-item">
      <div class="category title is-small grid grid--space u-flex__align--center">
        <div>
          <span class="country">{{ dataset.country_name }}</span>
          <span>·</span
          >{{ dataset.category_name ? dataset.category_name : 'Geography' }}
        </div>
        <div class="u-flex u-flex__align--center">
          {{ dataset.provider_name }}
          <div class="provider" v-if="minimal">
            <img
              :src="providerLogo"
              :alt="dataset.provider_name"
              :title="dataset.provider_name"
            />
          </div>
        </div>
      </div>
      <div class="info u-mr--72">
        <h3 class="title is-body u-mb--8">
          <router-link
            :to="{
              name: 'catalog-dataset-summary',
              params: {
                entity_id: dataset.slug,
                entity_type: dataset.is_geography ? 'geography' : 'dataset'
              }
            }"
            >{{ dataset.name }}</router-link
          >
        </h3>
        <p v-if="!minimal" class="description text">{{ dataset.description }}</p>
      </div>
      <div
        class="extra text is-small grid u-mt--16"
        v-if="!dataset.is_geography && !minimal"
      >
        <div
          class="grid-cell--col9 grid grid--align-end grid--no-wrap"
        >
          <div class="license">
            <p>License</p> {{ dataset.license_name }}
          </div>
          <div class="geography" :title="dataset.placetype_name">
            <p>Placetype</p> {{ dataset.placetype_name }}
          </div>
          <div v-if="extra" class="aggregation">
            <p>Temporal aggr.</p> {{ temporalAggregation }}
          </div>
        </div>
        <div
          class="grid-cell--col3 grid grid--align-end grid--space grid--no-wrap"
        >
          <div v-if="extra" class="version">
            <p>Version</p> {{ dataset.version }}
          </div>
          <div v-else class="aggregation">
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
      <div class="extra text is-small grid u-mt--16" v-else-if="!minimal">
        <div
          class="grid-cell--col9 grid grid--align-end grid--no-wrap"
        >
          <div class="license">
            <p>License</p> {{ dataset.license_name }}
          </div>
          <div class="geography" :title="dataset.placetype_name">
            <p>Placetype</p> {{ dataset.placetype_name }}
          </div>
          <div v-if="extra" class="aggregation">
            <p>Geometry type</p> {{ geometryType }}
          </div>
        </div>
        <div
          class="grid-cell--col3 grid grid--align-end grid--space grid--no-wrap"
        >
          <div v-if="extra" class="version">
            <p>Version</p> {{ dataset.version }}
          </div>
          <div v-else class="aggregation">
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
      <div v-else-if="warning" class="warning">
        <span v-html="warning"></span>
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
    },
    minimal: {
      type: Boolean,
      required: false
    },
    warning: {
      type: String,
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

    .license, .geography {
      margin-right: 24px;
    }

    .grid--reverse {
      flex-direction: row-reverse;
    }
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

  @media (max-width: $layout-tablet) {
    padding-left: 0;
    padding-right: 0;
    .info.u-mr--72 {
      margin-right: 0;
    }
  }
}

.warning {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  line-height: 16px;
  margin-top: 20px;

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &:after {
    content: url(//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/1.0.0-assets.206/images/interface-alert-triangle.svg);
    margin-left: 12px;
  }
}
</style>
