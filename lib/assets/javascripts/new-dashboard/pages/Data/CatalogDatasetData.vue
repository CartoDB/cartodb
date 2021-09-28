<template>
  <div v-if="!isFetching" class="grid grid-cell u-flex__justify--center u-mb--32">
    <div class="grid-cell grid-cell--col12 u-mt--28">
      <div class="u-flex u-flex__justify--between title-container">
        <h2 class="title is-caption is-txtMainTextColor">
          Data preview
          <transition name="fade">
            <a
              v-if="variables && variables.length > 0"
              @click="scrollToVariables()"
              id="viewDatasetVariables"
              class="is-small"
              >View {{ numberColumns }} variables list</a
            >
          </transition>
        </h2>
        <div class="is-small text txtMainTextColor">
          <span class="source u-flex u-flex__align--center" style="white-space:pre-wrap;" v-if="source"
            >(*) Data preview not available: this one is for&nbsp;
            <i class="is-semibold is-italic">{{ source }}</i></span
          >
          <span class="grey" v-else-if="numberRows > 0"
            >First {{ numberRows }} rows</span
          >
          <span class="grey" v-else>Not available</span>
        </div>
      </div>
      <div class="table-wrapper" ref="tableWrapper" v-if="columns.length">
        <div
          class="tooltip is-small"
          :class="{ first: tooltip.isFirst, last: tooltip.isLast }"
          v-if="tooltip.visible"
          :style="{ left: tooltip.left + 'px' }"
        >
          <p class="text is-small">
            <span class="is-semibold">Description:</span>
            {{ tooltip.description }}
          </p>
          <p class="text is-small">
            <span class="is-semibold">Type:</span> {{ tooltip.type }}
          </p>
        </div>
        <div v-if="numberRows > 0" class="scrollable-table u-mt--24">
          <table class="text is-small u-width--100">
            <tr>
              <th></th>
              <th
                @mousemove="showTooltip(value, $event)"
                @mouseleave="hideTooltip"
                v-for="value in columns"
                :key="value"
              >
                {{ value }}
              </th>
            </tr>
            <tr v-for="n in numberRows" :key="n">
              <td class="is-semibold">{{ n - 1 }}</td>
              <td v-for="preview of tablePreview" :key="preview.column_name">
                <template v-if="preview.column_name !== 'geom'">
                  <span
                    v-if="
                      preview.values[n - 1] !== null &&
                        preview.values[n - 1] !== undefined
                    "
                    >{{ preview.values[n - 1] }}</span
                  >
                  <span v-else class="is-txtLightGrey is-italic">null</span>
                </template>
                <template v-else>
                  <span>GeoJSON</span>
                </template>
              </td>
            </tr>
          </table>
        </div>
      </div>
      <NotAvailable
        v-else
        :title="'Data preview is not available'"
        :contactUrl="getFormURL()"
        :mode="'contact'"
      ></NotAvailable>
    </div>

    <transition name="fade">
      <div
        v-if="variables && variables.length > 0"
        class="grid-cell--col12 u-mt--60"
        ref="variablesSection"
        id="variablesSection"
      >
        <div class="u-flex u-flex__align--center u-flex__justify--between">
          <h2 class="grid-cell title is-caption is-txtMainTextColor">
            Variables
          </h2>
          <span class="is-txtMidGrey text is-small u-pr--10">{{numberColumns}} variables</span>
        </div>

        <ul class="u-mt--24 text f12 is-small is-txtMainTextColor">
          <li class="grid title is-txtMidGrey header-row">
            <div class="grid-cell grid-cell--col4">Column Name</div>
            <div
              class="grid-cell grid-cell--col7 grid-cell--col6--tablet grid-cell--col5--mobile"
            >
              Description
            </div>
            <div
              class="grid-cell grid-cell--col1 grid-cell--col2--tablet grid-cell--col3--mobile"
            >
              Type
            </div>
          </li>

          <li
            class="grid info-row"
            v-for="variable in variables"
            :key="variable.slug"
          >
            <div class="grid-cell grid-cell--col4 is-semibold name-cell">
              {{ variable.column_name }}
            </div>
            <div
              class="grid-cell grid-cell--col7 grid-cell--col6--tablet grid-cell--col5--mobile"
            >
              {{ variable.description }}
            </div>
            <div
              class="grid-cell grid-cell--col1 grid-cell--col2--tablet grid-cell--col3--mobile"
            >
              {{ variable.db_type }}
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import NotAvailable from 'new-dashboard/components/Catalog/NotAvailable.vue';
import { formURL } from 'new-dashboard/utils/catalog/form-url';
import { sendCustomDimensions } from 'new-dashboard/utils/catalog/custom-dimensions-ga';

export default {
  name: 'CatalogDatasetData',
  components: {
    NotAvailable
  },
  data () {
    return {
      tooltip: {
        visible: false,
        isFirst: false,
        isLast: false,
        left: 0,
        description: null,
        type: null
      }
    };
  },
  watch: {
    dataset: {
      handler (value) {
        if (value && value.category_name) {
          sendCustomDimensions(
            value.category_name,
            value.country_name,
            value.is_public_data,
            value.provider_name
          );
        }
      },
      immediate: true
    }
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      variables: state => state.catalog.variables,
      isFetching: state => state.catalog.isFetching
    }),
    tableKey () {
      if (this.dataset && this.dataset.summary_json) {
        if (this.dataset.summary_json.ordered_glimpses) {
          return 'ordered_glimpses';
        } else if (this.dataset.summary_json.default_ordered_glimpses) {
          return 'default_ordered_glimpses';
        }
      }
      return null;
    },
    source () {
      if (this.tableKey === 'default_ordered_glimpses') {
        return this.dataset.summary_json[this.tableKey].source;
      }
      return null;
    },
    tablePreview () {
      if (this.tableKey && this.dataset.summary_json) {
        const geom_column = { column_name: 'geom', values: Array(10) };
        return [...this.dataset.summary_json[this.tableKey].tail, geom_column];
      }
      return [];
    },
    columns () {
      return this.tablePreview ? this.tablePreview.map(t => t.column_name) : [];
    },
    numberRows () {
      return this.tablePreview && this.tablePreview.length > 0 ? this.tablePreview[0].values.length : 0;
    },
    numberColumns () {
      return this.variables ? this.variables.length : this.columns.length;
    },
    isGeography () {
      return this.$route.params.entity_type === 'geography';
    }
  },
  methods: {
    findVariableInfo (variableName) {
      return this.variables.find(e => e.column_name === variableName);
    },
    showTooltip (variableName, event) {
      let tooltipInfo = this.findVariableInfo(variableName);
      if (tooltipInfo) {
        let tableBoundingSize = this.$refs.tableWrapper.getBoundingClientRect();
        this.tooltip.left =
          event.target.getBoundingClientRect().left -
          this.$refs.tableWrapper.getBoundingClientRect().left +
          event.offsetX;
        if (this.tooltip.left < 140) {
          this.tooltip.isFirst = true;
          this.tooltip.left -= 26;
        } else if (tableBoundingSize.width - this.tooltip.left < 120) {
          this.tooltip.isLast = true;
          this.tooltip.left += 26;
        } else {
          this.tooltip.isFirst = false;
          this.tooltip.isLast = false;
        }

        this.tooltip.description = tooltipInfo.description;
        this.tooltip.type = tooltipInfo.db_type;
        this.tooltip.visible = true;
      } else {
        this.hideTooltip();
      }
    },
    hideTooltip () {
      this.tooltip.visible = false;
      this.tooltip.isFirst = false;
      this.tooltip.isLast = false;
    },
    getFormURL () {
      return formURL(this.dataset);
    },
    scrollToVariables () {
      window.scrollTo({
        top: this.$refs.variablesSection.offsetTop,
        left: 0,
        behavior: 'smooth'
      });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.title a {
  margin-left: 26px;
}

a {
  cursor: pointer;
}

.scrollable-table {
  width: 100%;
  overflow: auto;

  td,
  th {
    padding: 12px 24px 12px 8px;
    white-space: nowrap;
  }
  tr:nth-child(even) {
    background-color: $color-primary--soft;
  }

  th {
    position: relative;
    color: $link__color;
    text-align: left;
  }
}

.info-row {
  padding: 14px 0;
  border-bottom: 1px solid $blue--100;
}

.name-cell {
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-row {
  padding-bottom: 12px;
  border-bottom: 2px solid $blue--100;
}

.tooltip-container {
  position: absolute;
  z-index: 2;
  bottom: 100%;
  margin-left: 32px;
  padding-bottom: 8px;
}

.table-wrapper {
  position: relative;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  width: 300px;
  padding: 12px 16px 8px;
  transform: translateX(-50%);
  border: 1px solid $border-color;
  border-radius: 4px;
  background-color: #fff;
  word-break: break-word;

  &::before {
    content: '';
    position: absolute;
    bottom: -8px;
    left: calc(50% - 12px); // To compensate right extra padding
    width: 14px;
    height: 14px;
    transform: rotate(45deg);
    border: 1px solid $neutral--200;
    border-top: none;
    border-left: none;
    border-radius: 2px;
    background-color: #fff;
  }

  &.first {
    transform: translateX(0);

    &::before {
      left: 12px;
    }
  }

  &.last {
    transform: translateX(-100%);

    &::before {
      right: 24px;
      left: auto;
    }
  }
}
.grey {
  opacity: 0.48;
}
.source {
  &:after {
    content: url('../../assets/icons/catalog/interface-alert-triangle.svg');
    margin-left: 12px;
  }
}

@media (max-width: $layout-mobile) {
  .title-container {
    flex-wrap: wrap;
    >h2 {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    >div {
      width: 100%;
      text-align: right;
    }
  }
}

</style>
