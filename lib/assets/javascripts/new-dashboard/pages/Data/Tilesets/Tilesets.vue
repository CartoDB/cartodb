<template>
  <section class="u-mt--64">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="header grid-cell" ref="headerContainer">
          <template slot="icon">
            <img src="../../../assets/icons/section-title/tilesets.svg" width="24" height="24" />
          </template>
          <template slot="title">
            <VisualizationsTitle :defaultTitle="$t('DataPage.tabs.tilesets')"/>
          </template>
          <template slot="actionButton">
            <button @click="openInfo" class="is-small is-semibold is-txtPrimary">More info</button>
          </template>
        </SectionTitle>

        <div class="grid-cell grid-cell--col12">
          <div class="u-flex u-flex__align--center text is-small u-pt--20 u-pb--20 u-pl--24 u-pr--24 more-info" :class="{ open: moreInfo }">
            <img class="info__svg" svg-inline src="../../../assets/icons/common/info-icon.svg" height="20px" width="20px">
            <span class="u-ml--16">
              Preview your Tilesets here or use them on your own application using <a href="#">CARTO for deck.gl</a> or any <a href="#">other library</a>. <br>
              Check out the <a href="#">Documentation</a> to learn how to add Tilesets to your own application
            </span>
          </div>

          <div class="u-mt--20 u-mb--36">
            <div class="text">
              Select Project
            </div>
          </div>

          <!-- EMPTY LIST -->
          <div class="u-flex u-pt--48 u-pb--48 u-pl--32 u-pr--32 empty-list">
            <img src="../../../assets/icons/tilesets/no-tileset.svg">
            <div class="u-ml--32">
              <div class="text is-body is-semibold u-mb--12">Tilesets not available</div>
              <div class="text is-caption u-mb--16">
                This project doesn’t have any tilesets or you don’t have permission to view them. <br>
                Try changing the <i>Project name</i>.
              </div>
              <div class="text is-small is-txtMidGrey">
                Doubts? Read the <a href="#">documentation</a> to know about how to create tilesets and integrate them in webmaps.
              </div>
            </div>
          </div>

          <div class="grid__head--sticky">
            <TilesetListHeader></TilesetListHeader>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import TilesetListHeader from './TilesetListHeader';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';

export default {
  name: 'Tilesets',
  components: {
    SectionTitle,
    VisualizationsTitle,
    TilesetListHeader
  },
  data () {
    return {
      moreInfo: false
    };
  },
  watch: {
  },
  computed: {
  },
  methods: {
    openInfo () {
      this.moreInfo = !this.moreInfo;
    }
  },
  mounted () {
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.full-width {
  width: 100%;
}

.grid-cell {
  &::v-deep {
    &.head-section {
      margin-bottom: 4px;
    }
  }
}

.more-info {
  width: 100%;
  background-color: $neutral--100;
  color: $neutral--600;
  border-radius: 4px;

  &:not(.open) {
    display: none;
  }

  .info__svg {
    outline: none;

    path {
      fill: $neutral--600;
    }
  }
}

.empty-list {
  border-radius: 4px;
  border: dashed 2px #dddddd;

  i {
    font-style: italic;
  }
}
</style>
