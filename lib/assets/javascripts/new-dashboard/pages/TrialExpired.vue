<template>
  <div class="page">
    <ExpirationMessage></ExpirationMessage>
    <div class="is-bgSoftBlue">
      <MapsDownload></MapsDownload>
      <DatasetsDownload></DatasetsDownload>
    </div>
  </div>
</template>

<script>
import ExpirationMessage from '../components/TrialExpired/ExpirationMessage';
import MapsDownload from '../components/TrialExpired/MapsDownload';
import DatasetsDownload from '../components/TrialExpired/DatasetsDownload';

export default {
  name: 'TrialExpired',
  components: {
    ExpirationMessage,
    MapsDownload,
    DatasetsDownload
  }
};
</script>
