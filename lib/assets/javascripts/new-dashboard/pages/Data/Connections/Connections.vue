<template>
  <section class="u-mt--64">
    <div class="container grid">
      <div class="u-width--100">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img src="../../../assets/icons/datasets/connection.svg" width="24" height="24" />
          </template>
          <template slot="title">
            <VisualizationsTitle :defaultTitle="$t('DataPage.tabs.connections')"/>
          </template>
        </SectionTitle>
      </div>
      <div class="u-width--100 u-mt-50 grid-cell">
        <div class="emptyState u-pl--64 u-mb--60">
          <h3 class="is-body is-semibold u-mt--64">{{$t('DataPage.startAddingConnections')}}</h3>
          <p class="u-mt--16 is-caption">{{$t('DataPage.connectDescription')}}</p>   
          <router-link :to="{ name: 'new-connection' }">
            <button class="button is-primary u-mt--48" style="margin-bottom: 56px;"> {{$t('DataPage.newConnection')}} </button>
          </router-link>
          <img class="logo" width="314" src="../../../assets/images/connectors/connectors.png">
        </div>
      </div>
    </div>
    <router-view></router-view>
  </section>
</template>

<script>

import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';

export default {
  name: 'YourConnections',
  components: {
    SectionTitle,
    VisualizationsTitle
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.emptyState {
  border-radius: 4px;
  border: solid 1px #dddddd;
  position: relative;
  p {
    max-width: 467px;
  }
  .logo {
    position: absolute;
    right: 0;
    top: 0;
  }
}
</style>
