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
        <li class="grid-cell grid-cell--col12 download-element">
          <DownloadCard name="Prueba" dataType="polygon"></DownloadCard>
        </li>
        <li class="grid-cell grid-cell--col12 download-element">
          <DownloadCard name="Otra prueba" dataType="point"></DownloadCard>
        </li>
      </ul>
    </div>
  </div>
</section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import DownloadCard from 'new-dashboard/components/TrialExpired/DownloadCard';

export default {
  name: 'MapsDownload',
  components: {
    SectionTitle,
    DownloadCard
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
