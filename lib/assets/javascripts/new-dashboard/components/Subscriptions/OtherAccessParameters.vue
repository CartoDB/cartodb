<template>
<div>
  <p>Find below the instructions to access your Data Observatory subscription directly in Amazon S3.</p>
  <div class="textarea-wrapper">
    <textarea ref="textarea" class="u-mt--24" v-model="subscription.full_access_aws_info" readonly />
    <div class="u-flex u-flex__justify--end">
        <button @click="copy"  class="copy-btn u-flex u-flex__align--center text is-small is-semibold is-txtPrimary">
          <img svg-inline class="copy-icon" src="../../assets/icons/catalog/copy.svg">
          Copy
        </button>
    </div>
  </div>
</div>
</template>

<script>

import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import CopyTextInput from './CopyTextInput.vue';
import { mapState } from 'vuex';

export default {
  name: 'OtherAccessParameters',
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
      connectionsSuccessfullId: null
    };
  },
  computed: {
    ...mapState({
      user: state => state.user
    }),
    dataTable () {
      return `${this.user.do_bq_project}.${this.user.do_bq_dataset}.view_${this.subscription.id.split('.')[2]}`;
    },
    geographyTable () {
      return !this.subscription.is_geography
        ? `${this.user.do_bq_project}.${this.user.do_bq_dataset}.view_${this.subscription.geography_id.split('.')[2]}`
        : this.dataTable;
    },
    query () {
      let query = `SELECT * FROM \`${this.geographyTable}\``;
      if (!this.subscription.is_geography) {
        query =
          `SELECT\n\tdo_data.*, do_geo.geom, do_geo.name AS geom_name\nFROM \`${this.dataTable}\` do_data\nINNER JOIN \`${this.geographyTable}\` do_geo \nON do_data.geoid=do_geo.geoid `;
      }
      return query;
    }
  },
  methods: {
    copy () {
      this.$refs.textarea.select();
      document.execCommand('copy');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.textarea-wrapper {
  width: 100%;

  textarea {
    height: 96px;
    width: 100%;
    padding: 12px;
    color: $neutral--800;
    border: solid 1px #dddddd;
    border-radius: 4px;
    resize: none;
  }
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
</style>
