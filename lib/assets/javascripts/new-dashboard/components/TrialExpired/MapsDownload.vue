<template>
<section class="section section--noBorder">
  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" title="Download your Maps">
        <template slot="icon">
          <img src="../../assets/icons/section-title/map.svg">
        </template>
      </SectionTitle>
      <ul class="grid">
        <li class="grid-cell grid-cell--col12 download-element" v-for="map in maps" :key="map.id">
          <DownloadCard :name="map.name" :image="mapThumbnailUrl"></DownloadCard>
        </li>
      </ul>
    </div>
  </div>
</section>
</template>

<script>
import { mapState } from 'vuex';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import DownloadCard from 'new-dashboard/components/TrialExpired/DownloadCard';
import * as Visualization from 'new-dashboard/core/visualization';

export default {
  name: 'MapsDownload',
  components: {
    SectionTitle,
    DownloadCard
  },
  computed: {
    ...mapState({
      maps: state => state.maps.list
    }),
    mapThumbnailUrl () {
      return Visualization.getThumbnailUrl(this.$props.map, this.$cartoModels, { width: 600, height: 280 });
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
