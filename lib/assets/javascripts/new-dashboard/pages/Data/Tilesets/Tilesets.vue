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
        </SectionTitle>

        <div class="grid-cell grid-cell--col12">
          <template v-if="!loadingProjects">
            <div class="u-flex u-mt--20 u-mb--36">
              <div class="u-mr--28">
                <div class="text is-small is-semibold">
                  Select Project
                </div>
                <DropdownComponent ref="selector" v-model="project"
                  :elements="projects"
                  :showCreate="true"
                  :placeholder="$t('TilesetsPage.projectPlaceholder')"
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
                      :tileset="tileset"
                      @onClick="openViewer"></TilesetListCard>
                  </li>
                </ul>
                <Pagination v-if="needPagination" :page="page" :numPages="numPages" @pageChange="goToPage"></Pagination>
              </template>
              <template v-if="hasPermissionsError || (!projects || !projects.length)">
                <!-- ERROR -->
                <div class="u-flex u-pt--48 u-pb--48 u-pl--32 u-pr--32 empty-list">
                  <img src="../../../assets/icons/tilesets/tileset-error.svg">
                  <div class="u-ml--32">
                    <div class="text is-body is-semibold u-mb--12">
                      {{ $t('TilesetsPage.errorTitle') }}
                    </div>
                    <div class="text is-caption u-mb--16" v-html="$t('TilesetsPage.errorSubtitle')"></div>
                    <div class="is-small" v-if="error">
                      <div class="u-mt--12 text is-txtMidGrey is-semibold">Error info:</div>
                      <div class="u-mt--12 u-flex text is-semibold">
                        <input ref="inputError" class="code u-flex__grow--1 is-code" type="text" readonly :value=error.message>
                        <div @click="copyInfo" class="u-ml--4 copy">
                          <img svg-inline src="../../../assets/icons/catalog/copy.svg">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else-if="error && error.status === 404 && project && !datasets.length">
                <!-- PROJECT DOESN'T EXIST -->
                <div class="u-flex u-pt--48 u-pb--48 u-pl--32 u-pr--32 empty-list">
                  <img src="../../../assets/icons/tilesets/tileset-error.svg">
                  <div class="u-ml--32">
                    <div class="text is-body is-semibold u-mb--12">
                      {{ $t('TilesetsPage.notFoundTitle') }}
                    </div>
                    <div class="text is-caption u-mb--16" v-html="$t('TilesetsPage.notFoundSubtitle')"></div>
                  </div>
                </div>
              </template>
              <!-- EMPTY LIST -->
              <div v-else-if="!tilesets || !tilesets.length" class="u-flex u-pt--48 u-pb--48 u-pl--32 u-pr--32 u-flex__align--start empty-list">
                <img src="../../../assets/icons/tilesets/tileset-empty.svg">
                <div class="u-ml--32">
                  <div class="text is-body is-semibold u-mb--12">
                    {{ project && dataset ? $t('TilesetsPage.noAvailableTitle') : $t('TilesetsPage.noDataTitle')}}
                  </div>
                  <div class="text is-caption u-mb--16" v-html="project && dataset ? $t('TilesetsPage.noAvailableSubtitle') : $t('TilesetsPage.noDataSubtitle')">
                  </div>
                  <div class="text is-small is-txtMidGrey" v-if="!project || !dataset" v-html="$t('TilesetsPage.noDataCaption')">
                  </div>
                </div>
              </div>
            </template>
          </template>
          <LoadingState v-else primary/>
          <router-view></router-view>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import LoadingState from 'new-dashboard/components/States/LoadingState';
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
    TilesetListCardFake,
    LoadingState
  },
  data () {
    return {
      moreInfo: false,
      project: null,
      dataset: null,
      page: 1,
      maxVisibleTilesets: 12,
      error: null
    };
  },
  computed: {
    ...mapState({
      loading: state => state.connectors.loadingConnections,
      loadingDatasets: state => state.connectors.loadingDatasets,
      loadingProjects: state => state.connectors.loadingProjects,
      loadingTilesets: state => state.tilesets.loadingTilesets,
      projectsInRaw: state => state.connectors.projects,
      datasetsInRaw: state => state.connectors.bqDatasets,
      tilesetsInRaw: state => state.tilesets.tilesets,
      baseUrl: state => state.user.base_url
    }),
    ...mapGetters({
      bqConnection: 'connectors/getBigqueryConnection'
    }),
    hasPermissionsError () {
      return this.error && (parseInt(this.error.status) === 401 || parseInt(this.error.status) === 403);
    },
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
    async fetchProjects () {
      if (this.bqConnection) {
        try {
          await this.$store.dispatch('connectors/fetchBQProjectsList', this.bqConnection.id);
          this.error = null;
        } catch (e) {
          this.error = JSON.parse(e.message);
        }
      }
    },
    async fetchDatasets () {
      if (this.project) {
        try {
          await this.$store.dispatch('connectors/fetchBQDatasetsList', { connectionId: this.bqConnection.id, projectId: this.project.id });
          this.error = null;
        } catch (e) {
          this.error = JSON.parse(e.message);
        }
      }
    },
    async fetchTilesets () {
      if (this.bqConnection) {
        try {
          await this.$store.dispatch('tilesets/fetchTilesetsList', {
            connectionId: this.bqConnection.id,
            projectId: this.project.id,
            datasetId: this.dataset ? this.dataset.id : null,
            perPage: this.maxVisibleTilesets,
            page: this.page
          });
          this.error = null;
        } catch (e) {
          this.error = JSON.parse(e.message);
        }
      }
    },
    useOtherProject (searchingText) {
      this.project = {
        id: searchingText,
        label: searchingText
      };
    },
    openViewer (tileset) {
      this.$router.push({ name: 'tileset-viewer', params: { id: tileset.id } });
    },
    copyInfo () {
      this.$refs.inputError.select();
      document.execCommand('copy');
    }
  },
  mounted () {
    this.fetchProjects();
  },
  beforeDestroy () {
    this.$store.commit('tilesets/setTilesets', []);
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
      this.page = 1;
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

.code {
  max-width: 100%;
  border-radius: 4px;
  padding: 10px 12px;
  background-color: $neutral--100;
  font-weight: 400;
  height: 36px;
  border: none;
}

.copy {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 36px;
  width: 36px;
  flex: 0 0 36px;
  cursor: pointer;

  &:hover {
    background-color: $neutral--100;
    border-radius: 4px;

  }

  svg {
    outline: none;
    transform: scale(1.5);

    path[fill] {
      fill: #036fe2;
    }
  }
}
</style>
