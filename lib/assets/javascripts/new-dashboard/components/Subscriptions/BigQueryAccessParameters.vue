<template>
<div>
  <p v-if="!isGeography">Your Data Observatory subscription is composed of a data and a geography table. Find below the location of these tables in BigQuery and a sample query to join them.</p>
  <p v-else>Find below the location of your Data Observatory subscription in BigQuery and a sample query.</p>
  <CopyTextInput v-if="!isGeography" label="Data table" :value="dataTable" />
  <CopyTextInput label="Geography table" :value="geographyTable" />
  <div class="u-flex u-flex__align--start u-flex__justify--between u-mt--24 code-block-wrapper">
    <label class="is-small u-mt--8 u-mr--16">Sample query</label>
    <div class="u-flex u-flex__direction--column code-wrapper">
      <input type="text" aria-hidden="true" ref="codeBlock" :value="query" />
      <CodeBlock language="text/x-plsql" v-model="query"/>
      <div class="u-flex u-flex__justify--between">
        <p class="u-mt--8">Query to join data and geography</p>
        <button @click="copy"  class="copy-btn u-flex u-flex__align--center text is-small is-semibold is-txtPrimary">
          <img svg-inline class="copy-icon" src="../../assets/icons/catalog/copy.svg">
          Copy
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script>

import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import CopyTextInput from './CopyTextInput.vue';
import { mapState } from 'vuex';

export default {
  name: 'BigQueryAccessParameters',
  components: {
    CodeBlock,
    CopyTextInput
  },
  props: {
    subscription: {
      require: true
    }
  },
  data () {
    return {
    };
  },
  computed: {
    ...mapState({
      user: state => state.user
    }),
    dataTable () {
      return this.buildDatasetPath(this.subscription.id);
    },
    isGeography () {
      return this.subscription.is_geography || !this.subscription.geography_id;
    },
    geographyTable () {
      if (this.isGeography) {
        return this.dataTable;
      } else if (this.subscription.geography_id.includes('carto-do-public-data')) {
        return this.subscription.geography_id;
      } else {
        return this.buildDatasetPath(this.subscription.geography_id);
      }
    },
    query () {
      let query = `SELECT * FROM \`${this.geographyTable}\``;
      if (!this.isGeography) {
        query =
          `SELECT \n\tdo_data.*, do_geo.geom \nFROM \`${this.dataTable}\` do_data \nINNER JOIN \`${this.geographyTable}\` do_geo \nON do_data.geoid=do_geo.geoid `;
      }
      return query;
    }
  },
  methods: {
    buildDatasetPath (table) {
      const tableName = table.split('.')[2];
      return `${this.user.do_bq_project}.${this.user.do_bq_dataset}.view_${this.subscription.provider_id}_${tableName}`;
    },
    copy () {
      this.$refs.codeBlock.select();
      document.execCommand('copy');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
[aria-hidden="true"] {
  opacity: 0;
  position: absolute;
  z-index: -9999;
  pointer-events: none;
}

.copy-btn {
  height: 36px;
  padding: 6px 8px;

  .copy-icon {
    height: 24px;
    width: 24px;

    path:not(:first-child){
      fill: $color-primary
    }
  }
}

.code-block-wrapper {
  label {
    flex: 1;
    text-align: right;
    text-transform: capitalize;
  }

  /deep/ .CodeMirror {
    border-radius: 4px;
    width: 512px;
    max-height: 220px;
    margin: 0;
    padding: 4px 0;
  }
}
</style>
