<template>
  <Page class="page--data" :class="{ 'website-page': publicWebsite }">
    <SecondaryNavigation v-if="!publicWebsite">
      <router-link
        class="catalogDetail__catalog title is-small"
        :class="{ 'disabled': loading }"
        :to="{ name: 'spatial-data-catalog' }"
      >
        <img class="catalogDetail__catalog--icon" svg-inline src="../../assets/icons/common/back.svg"/>
        <span>{{ $t('Catalog.name') }}</span>
      </router-link>
    </SecondaryNavigation>

    <section v-if="loading" class="catalogDetail container grid">
      <div class="grid-cell grid-cell--col12">
        <div class="u-flex u-flex__align--center u-flex__direction--column u-mt--120">
          <span class="loading u-mr--12">
            <svg viewBox="0 0 38 38">
              <g transform="translate(1 1)" fill="none" fill-rule="evenodd">
                <circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
                <path d="M36 18c0-9.94-8.06-18-18-18">
                  <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
                </path>
              </g>
            </svg>
          </span>
          <span class="text is-txtSoftGrey is-caption u-mt--12">
            Loading {{ entity_type }} details...
          </span>
        </div>
      </div>
    </section>

    <section v-if="!loading" :style="{ display: isCartoWorkspace ? 'none' : ''}" class="catalogDetail" :class="{ 'container grid': !publicWebsite, 'u-flex u-flex__justify--center website-header': publicWebsite }">
      <div class="grid-cell" :class="{ 'grid-cell--col12': !publicWebsite || responsive, 'grid-cell--col10': publicWebsite && !responsive }">
        <transition name="fade">
          <div>
            <div v-if="publicWebsite" class="catalogDetail__catalog">
              <router-link
                class="title is-small back-link"
                :class="{ 'disabled': loading }"
                :to="{ name: 'spatial-data-catalog' }"
              >
                <img class="catalogDetail__catalog--icon" svg-inline src="../../assets/icons/common/back-long.svg"/>
                {{ $t('Catalog.name') }}
              </router-link>
            </div>
            <DatasetActionsBar
              v-if="subscription"
              :subscription="subscription"
              :slug="dataset.slug"
              class="u-mt--12"
            ></DatasetActionsBar>
            <DatasetHeader :publicWebsite="publicWebsite"></DatasetHeader>
          </div>
        </transition>
      </div>
    </section>

    <section v-if="!loading" class="catalogDetail" :class="{ 'container grid': !publicWebsite, 'u-flex u-flex__justify--center': publicWebsite }">
      <div class="grid-cell" :class="{ 'grid-cell--col12': !publicWebsite || responsive || isCartoWorkspace, 'grid-cell--col10': publicWebsite && !responsive && !isCartoWorkspace }">
        <transition name="fade">
          <div :class="{ 'u-pb--120': responsive }">
            <div class="grid grid-cell u-flex__justify--center">
              <NavigationTabs class="grid-cell--col12">
                <router-link :to="{ name: 'catalog-dataset-summary' }" replace>Summary</router-link>
                <router-link :to="{ name: 'catalog-dataset-data' }" replace>Data</router-link>
                <router-link :to="{ name: 'catalog-dataset-map' }" replace v-if="hasSample">Map</router-link>
              </NavigationTabs>
            </div>
            <router-view></router-view>
            <GoUpButton></GoUpButton>
          </div>
        </transition>
      </div>
    </section>

    <script v-if="publicWebsite" v-html="jsonld" type="application/ld+json"/>
    <SubscriptionAccess v-if="subscription && showAccessModal"></SubscriptionAccess>
  </Page>
</template>

<script>
import { mapState } from 'vuex';
import Page from 'new-dashboard/components/Page';
import SecondaryNavigation from 'new-dashboard/components/SecondaryNavigation';
import DatasetActionsBar from 'new-dashboard/components/Catalog/DatasetActionsBar';
import DatasetHeader from 'new-dashboard/components/Catalog/DatasetHeader';
import NavigationTabs from 'new-dashboard/components/Catalog/NavigationTabs';
import GoUpButton from 'new-dashboard/components/Catalog/GoUpButton';
import SubscriptionAccess from 'new-dashboard/components/Subscriptions/SubscriptionAccess.vue';

export default {
  name: 'CatalogDataset',
  props: {
    publicWebsite: Boolean,
    isCartoWorkspace: Boolean
  },
  components: {
    Page,
    SecondaryNavigation,
    DatasetActionsBar,
    DatasetHeader,
    NavigationTabs,
    GoUpButton,
    SubscriptionAccess
  },
  data () {
    return {
      loading: false,
      id_interval: null
    };
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      keyVariables: state => state.catalog.keyVariables,
      currentSubscription: state => state.catalog.currentSubscription,
      entity_type () {
        return this.$route.params.entity_type;
      }
    }),
    showAccessModal () {
      return !!this.currentSubscription;
    },
    subscription () {
      const { slug, ...copyDataset } = this.dataset;
      const subscriptionByDataset = this.$store.getters['catalog/getSubscriptionByDataset'](
        this.dataset.id
      );

      let subscription;

      if (subscriptionByDataset) {
        subscription = {
          ...copyDataset,
          ...subscriptionByDataset
        };
      }

      return subscription;
    },
    isGeography () {
      return this.$route.params.entity_type === 'geography';
    },
    isSubscriptionSyncing () {
      return this.subscription && this.subscription.sync_status === 'syncing';
    },
    hasSample () {
      return this.dataset.sample_info && !!this.dataset.sample_info.id;
    },
    responsive () {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    jsonld () {
      // The JSON-LD is used for SEO purposes and to index the site on Google Dataset Search
      if (!this.dataset) {
        return '';
      }
      const keyVariables = this.keyVariables && Array.isArray(this.keyVariables) ? this.keyVariables.map(elem => elem.name) : [];
      const keywords = [...keyVariables];
      keywords.push('Spatial data');
      if (this.dataset.category_name) {
        keywords.push(this.dataset.category_name);
      }
      if (this.dataset.data_source_name) {
        keywords.push(this.dataset.data_source_name);
      }
      return {
        '@context': 'https://schema.org/',
        '@type': 'Dataset',
        'name': this.dataset.name,
        'description': this.dataset.description,
        'keywords': keywords,
        'license': this.dataset.licenses_link,
        'creator': {
          '@type': 'Organization',
          'name': this.dataset.provider_name
        },
        'spatialCoverage': this.dataset.country_name,
        'variableMeasured': keyVariables,
        'version': this.dataset.version,
        'url': `https://carto.com${this.$router.resolve({ name: 'catalog-dataset-summary', params: {...this.$route.params} }).href}`
      };
    }
  },
  methods: {
    initializeDataset () {
      if (!this.dataset || this.dataset.slug !== this.$route.params.entity_id) {
        this.loading = true;
        Promise.all([
          this.$store.dispatch('catalog/fetchSubscriptionsList'),
          this.$store.dispatch('catalog/fetchDataset', {
            id: this.$route.params.entity_id,
            type: this.$route.params.entity_type
          }),
          this.$store.dispatch('catalog/fetchVariables', {
            id: this.$route.params.entity_id,
            type: this.$route.params.entity_type
          })
        ]).then(() => {
          this.loading = false;
          if (this.dataset.slug) {
            if (this.$route.params.entity_id !== this.dataset.slug) {
              this.$router.replace({ params: { entity_id: this.dataset.slug } });
            }
          } else {
            this.$router.replace({ name: 'spatial-data-catalog' });
          }
        });
      }
    },
    updateTitle () {
      const title = this.dataset && this.dataset.name ? this.dataset.name : 'Spatial Data Catalog';
      document.title = this.$route.meta.title(title);
    }
  },
  watch: {
    isSubscriptionSyncing: {
      immediate: true,
      handler () {
        clearInterval(this.id_interval);
        if (this.isSubscriptionSyncing) {
          this.id_interval = setInterval(() => {
            this.$store.dispatch('catalog/fetchSubscriptionsList');
          }, 1000);
        }
      }
    },
    entity_type: {
      immediate: true,
      handler () {
        this.initializeDataset();
      }
    },
    dataset: function () {
      this.updateTitle();
    },
    $route: function (to, from) {
      this.updateTitle();
    }
  },
  mounted () {
    if (!this.publicWebsite) {
      this.$store.dispatch('connectors/fetchConnectionsList');
    }
  },
  destroyed () {
    if (this.dataset.slug !== this.$route.params.entity_id) {
      this.$store.commit('catalog/resetDataset');
    }
    clearInterval(this.id_interval);
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.catalogDetail {

  &__catalog {
    display: flex;
    align-items: center;
    padding: 24px 0;

    a.disabled {
      cursor: default;
      pointer-events: none;
      text-decoration: none;
    }

    &--icon {
      width: 7px;
      height: 12px;
      margin-right: 8px;
    }
  }

  &__description {
    margin-bottom: 64px;
  }

  &__label {
    margin-bottom: 24px;
  }

  &__list {
    list-style-position: inside;
    list-style-type: disc;

    &--item {
      margin-bottom: 16px;
    }
  }
}

.catalog__icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  background-size: contain;
}

.loading {
  svg {
    width: 40px;
    stroke: $blue--500;
    g {
      stroke-width: 2px;
      circle {
        stroke-opacity: 0.25;
      }
    }
  }
}

.go-up-button {
  position: fixed;
  z-index: 1;
  right: 24px;
  bottom: 64px;
}

input::-ms-clear {
  display: none;
}
.fade-enter-active {
  transition: opacity .5s;
}
.fade-enter {
  opacity: 0;
}

.website-page {
  padding: 0;
  border-bottom: none !important;

  .website-header {
    padding-bottom: 24px;
    margin-bottom: 24px;
    background-color: $color-primary;

    .back-link {
      display: flex;
      align-items: center;
      & > svg {
        width: 20px;
        height: 10px;
        fill: currentColor;
        outline: none;
      }
    }

    a {
      color: white;
    }
  }
}

.back-link > svg {
  margin-right: 12px;
}
</style>
