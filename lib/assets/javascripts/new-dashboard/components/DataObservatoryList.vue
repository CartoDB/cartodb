<template>
  <div class="container grid">
    <div class="grid-cell grid-cell--col8 grid-cell--col12--tablet">
      <SectionTitle class="head-section--small" :title="this.$t('dataObservatory.title')" ref="headerContainer">
        <template slot="icon">
          <img src="../assets/icons/section-title/dataobservatory.svg" width="24" height="24" />
        </template>
      </SectionTitle>
      <p class="text is-body">{{$t("dataObservatory.description")}}</p>
    </div>
    <div class="grid-cell grid-cell--col12 u-mt--36">
      <input class="dataobservatory-search text is-caption" name="dataobservatory-search" :placeholder="this.$t('dataObservatory.searchPlaceholder')" v-model="textFilter"/>
      <div class="grid u-ml--16 u-mt--24">
        <div class="grid-cell--col6">
          <h3 class="title is-caption is-txtSoftGrey">{{this.$t('dataObservatory.dataType')}}</h3>
          <ul class="grid">
            <li class="checkbox grid grid--align-center u-mt--16 grid-cell--col5" v-for="category in categories" :key="category">
              <input :id="`${category.toLowerCase()}Filter`" class="checkbox-input" :value="category" type="checkbox" v-model="datatypeFilter">
              <span class="checkbox-decoration">
                <img svg-inline src="../assets/icons/common/checkbox.svg">
              </span>
              <label class="u-ml--16 text is-small" :for="`${category.toLowerCase()}Filter`">{{category}}</label>
            </li>
          </ul>
        </div>

        <div class="grid-cell--col6">
          <h3 class="title is-caption is-txtSoftGrey">{{this.$t('dataObservatory.geographies')}}</h3>
          <ul class="grid">
            <li class="checkbox grid grid--align-center u-mt--16 grid-cell--col5" v-for="country in countries" :key="country">
              <input :id="`${country.toLowerCase()}Filter`" class="checkbox-input" :value="country" type="checkbox" v-model="geographyFilter">
              <span class="checkbox-decoration">
                <img svg-inline src="../assets/icons/common/checkbox.svg">
              </span>
              <label class="u-ml--16 text is-small" :for="`${country.toLowerCase()}Filter`">{{country}}</label>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <ul class="grid-cell u-mt--64 grid-cell--col12">
      <li v-for="dataset in filteredDatasets" :key="dataset.title">
        <DataObservatoryCard class="u-mb--16" :dataset="dataset"></DataObservatoryCard>
      </li>
    </ul>
  </div>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import DataObservatoryCard from 'new-dashboard/components/Dataset/DataObservatoryCard.vue';

export default {
  name: 'DatasetsList',
  data: function () {
    return {
      datatypeFilter: [],
      geographyFilter: [],
      textFilter: '',
      openModal: false
    };
  },
  components: {
    SectionTitle,
    DataObservatoryCard
  },
  computed: {
    categories () {
      let categories = [];
      for (let i = 0; i < this.datasets.length; i++) {
        let category = this.datasets[i].category;
        if (!categories.includes(category)) {
          categories.push(category);
        }
      }
      return categories;
    },
    countries () {
      let countries = [];
      for (let i = 0; i < this.datasets.length; i++) {
        for (let j = 0; j < this.datasets[i].geographies.length; j++) {
          let country = this.datasets[i].geographies[j];
          if (!countries.includes(country)) {
            countries.push(country);
          }
        }
      }
      return countries;
    },
    filteredDatasets () {
      let resultDataset = this.filterByCategory(this.datasets);
      resultDataset = this.filterByCountry(resultDataset);
      resultDataset = this.filterByText(resultDataset);
      return resultDataset;
    },
    datasets () {
      return this.$t('dataObservatory.datasets');
    }
  },
  methods: {
    filterByCategory (dataset) {
      const datatypeFilter = this.$data.datatypeFilter;
      if (datatypeFilter.length === 0) {
        return dataset;
      }
      let datasetsAfterFiltering = [];
      for (let i = 0; i < dataset.length; i++) {
        if (datatypeFilter.includes(dataset[i].category)) {
          datasetsAfterFiltering.push(dataset[i]);
        }
      }
      return datasetsAfterFiltering;
    },
    filterByCountry (dataset) {
      const countryFilter = this.$data.geographyFilter;
      if (countryFilter.length === 0) {
        return dataset;
      }
      var datasetsAfterFiltering = [];
      for (let i = 0; i < dataset.length; i++) {
        let hasDataset = dataset[i].geographies.some(country => countryFilter.includes(country));
        if (hasDataset) {
          datasetsAfterFiltering.push(dataset[i]);
        }
      }
      return datasetsAfterFiltering;
    },
    filterByText (dataset) {
      const textFilter = this.$data.textFilter;
      if (textFilter === '') {
        return dataset;
      }
      let datasetsAfterFiltering = [];
      for (let i = 0; i < dataset.length; i++) {
        let searchRegex = new RegExp(textFilter, 'i');
        if (dataset[i].title.search(searchRegex) >= 0 || dataset[i].description.search(searchRegex) >= 0) {
          datasetsAfterFiltering.push(dataset[i]);
        }
      }
      return datasetsAfterFiltering;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.dataobservatory-search {
  width: 100%;
  padding: 16px;
  padding-right: 64px;
  border: 1px solid $neutral--300;
  border-radius: 2px;
  background-image: url("../assets/icons/datasets/data-observatory/search-icon.svg");
  background-repeat: no-repeat;
  background-position: right;
}

.checkbox {
  .checkbox-decoration {
    width: 16px;
    height: 16px;
  }

  .checkbox-input {
    z-index: 1;
    width: 16px;
    height: 16px;
    background: unset;

    &::before {
      display: none;
    }
  }
}
</style>
