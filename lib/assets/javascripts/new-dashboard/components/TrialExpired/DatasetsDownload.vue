<template>
<section class="section section--noBorder">
  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" title="Download your Data">
        <template slot="icon">
          <img src="../../assets/icons/section-title/map.svg">
        </template>
      </SectionTitle>
      <ul class="grid">
        <li class="grid-cell grid-cell--col12 download-element" v-for="dataset in datasets" :key="dataset.id">
          <DownloadCard :name="dataset.name" :dataType="dataType(dataset)"></DownloadCard>
        </li>
      </ul>
    </div>
  </div>
</section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import DownloadCard from 'new-dashboard/components/TrialExpired/DownloadCard';
import { mapState } from 'vuex';

export default {
  name: 'DatasetsDownload',
  components: {
    SectionTitle,
    DownloadCard
  },
  computed: {
    ...mapState({
      datasets: state => state.datasets.list
    })
  },
  methods: {
    dataType (dataset) {
      const geometryTypes = {
        'st_multipolygon': 'polygon',
        'st_polygon': 'polygon',
        'st_multilinestring': 'line',
        'st_linestring': 'line',
        'st_multipoint': 'point',
        'st_point': 'point',
        '': 'empty'
      };
      let geometry = '';
      if (dataset.table && dataset.table.geometry_types && dataset.table.geometry_types.length) {
        geometry = dataset.table.geometry_types[0];
      }
      const currentGeometryType = geometry.toLowerCase();
      return geometryTypes[currentGeometryType] ? geometryTypes[currentGeometryType] : 'unknown';
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.full-width {
  width: 100%;
}

.download-element {
  border-bottom: 1px solid #F2F6F9;
}
</style>
