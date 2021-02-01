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
          <div class="u-flex u-mt--20 u-mb--36">
            <div class="u-mr--28">
              <div class="text is-small is-semibold">
                Select Project
              </div>
              <DropdownComponent ref="selector" v-model="project"
                :elements="projects"
                :showCreate="true"
                placeholder='Select your BigQuery Project'
                @createElement="useOtherProject">
                <template v-slot:createMessage="{ data }">
                  <span v-if="!data.filteredElements.length">No results.</span>
                  Select <a @click="data.createNew">{{data.searchingText}}</a> project
                </template>
              </DropdownComponent>
            </div>
            <div :class="{ 'dropdown-disabled': !project }">
              <div class="text is-small is-semibold">
                Project datasets
              </div>
              <DropdownComponent ref="selector" v-model="dataset"
                :elements="datasets"
                :showCreate="false"
                placeholder='Select dataset'
                @createElement="useOtherProject">
                <template v-slot:createMessage="{ data }">
                  <span v-if="!data.filteredElements.length">No results.</span>
                  Select <a @click="data.createNew">{{data.searchingText}}</a> project
                </template>
              </DropdownComponent>
            </div>
          </div>

          <ul v-if="loadingTilesets">
            <li v-for="n in maxVisibleTilesets" :key="n" class="dataset-item">
              <TilesetListCardFake></TilesetListCardFake>
            </li>
          </ul>
          <template v-else>
            <template v-if="tilesets && tilesets.length">
              <div class="grid__head--sticky">
                <TilesetListHeader></TilesetListHeader>
              </div>
              <ul>
                <li v-for="tileset in tilesets" :key="tileset.id" class="tileset-item">
                  <TilesetListCard
                    class="tileset-item"
                    :tileset="tileset"></TilesetListCard>
                </li>
              </ul>
              <Pagination v-if="needPagination" :page="page" :numPages="numPages" @pageChange="goToPage"></Pagination>
            </template>

            <!-- EMPTY LIST -->
            <div v-if="!tilesets || !tilesets.length" class="u-flex u-pt--48 u-pb--48 u-pl--32 u-pr--32 empty-list">
              <img src="../../../assets/icons/tilesets/no-tileset.svg">
              <div class="u-ml--32">
                <div class="text is-body is-semibold u-mb--12">
                  {{ project && dataset ? $t('TilesetsPage.noAvailableTitle') : $t('TilesetsPage.noDataTitle')}}
                </div>
                <div class="text is-caption u-mb--16" v-html="project && dataset ? $t('TilesetsPage.noAvailableSubtitle') : $t('TilesetsPage.noDataSubtitle')">
                </div>
                <div class="text is-small is-txtMidGrey" v-html="$t('TilesetsPage.noDataCaption')">
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import Pagination from 'new-dashboard/components/Pagination';
import DropdownComponent from 'new-dashboard/components/forms/DropdownComponent';
import TilesetListHeader from './TilesetListHeader';
import TilesetListCard from './TilesetListCard';
import TilesetListCardFake from './TilesetListCardFake';
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'Tilesets',
  components: {
    DropdownComponent,
    SectionTitle,
    VisualizationsTitle,
    TilesetListHeader,
    Pagination,
    TilesetListCard,
    TilesetListCardFake
  },
  data () {
    return {
      moreInfo: false,
      project: null,
      dataset: null,
      page: 1,
      maxVisibleTilesets: 12
    };
  },
  computed: {
    ...mapState({
      loading: state => state.connectors.loadingConnections,
      loadingDatasets: state => state.connectors.loadingDatasets,
      loadingTilesets: state => state.tilesets.loadingTilesets,
      projectsInRaw: state => state.connectors.projects,
      datasetsInRaw: state => state.connectors.bqDatasets,
      tilesetsInRaw: state => state.tilesets.tilesets
    }),
    ...mapGetters({
      bqConnection: 'connectors/getBigqueryConnection'
    }),
    numPages () {
      return Math.ceil(this.tilesetsInRaw.total / this.maxVisibleTilesets);
    },
    projects () {
      return this.projectsInRaw ? this.projectsInRaw.map(e => ({ id: e.id, label: e.friendly_name })) : [];
    },
    datasets () {
      return this.datasetsInRaw && !this.loadingDatasets ? this.datasetsInRaw.map(d => ({ id: d.id, label: d.id })) : [];
    },
    tilesets () {
      return this.tilesetsInRaw ? this.tilesetsInRaw.result : [];
    },
    isSomeTilesetSelected () {
      return this.selectedTilesets.length > 0;
    },
    needPagination () {
      return this.tilesetsInRaw.total > this.maxVisibleTilesets;
    }
  },
  methods: {
    openInfo () {
      this.moreInfo = !this.moreInfo;
    },
    goToPage (page) {
      this.page = page;
      this.fetchTilesets();
    },
    fetchProjects () {
      if (this.bqConnection) {
        return this.$store.dispatch('connectors/fetchBQProjectsList', this.bqConnection.id);
      }
    },
    fetchDatasets () {
      if (this.bqConnection) {
        return this.$store.dispatch('connectors/fetchBQDatasetsList', { connectionId: this.bqConnection.id, projectId: this.project.id });
      }
    },
    fetchTilesets () {
      if (this.bqConnection) {
        return this.$store.dispatch('tilesets/fetchTilesetsList', {
          connectionId: this.bqConnection.id,
          projectId: this.project.id,
          datasetId: this.dataset ? this.dataset.id : null,
          perPage: this.maxVisibleTilesets,
          page: this.page
        });
      }
    },
    useOtherProject (searchingText) {
      this.project = {
        id: searchingText,
        label: searchingText
      };
    }
  },
  mounted () {
    this.fetchProjects();
  },
  watch: {
    projects () {
      const defaultProject = this.bqConnection.parameters.default_project;
      this.project = this.projects.find(p => p.id === defaultProject) || this.projects[0];
    },
    bqConnection () {
      this.fetchProjects();
    },
    project () {
      this.fetchDatasets();
      this.dataset = null;
    },
    dataset () {
      this.fetchTilesets();
    }
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

.tileset-item {
  &:not(:last-child) {
    border-bottom: 1px solid $border-color;
  }
}
.dropdown-disabled {
  pointer-events: none;
  opacity: .38;
}
.dropdown-wrapper {
  width: 295px;
  margin-top: 8px;
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
