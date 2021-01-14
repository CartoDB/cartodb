<template>
  <div class="connector">
    <div class="beta-label text is-small" v-if="beta">Beta</div>
    <div class="quickactions" @click="stopPropagation">
      <ConnectorQuickActions :connection="id" :editable="isDatabase && !isBigQuery"/>
    </div>
    <div class="ConnectorInfo u-flex u-flex__direction--column u-flex__align--center u-flex__align--center u-pt--20 u-pb--16">
      <div :class="'is-' + type"></div>
      <span class="is-semibold u-mt--8">{{ label }}</span>
    </div>
    <div class="tools u-pt--16 u-pb--16 u-pl--20 u-pr--20">
      <div class="u-flex" v-if="isDatabase">
        <div class="text is-small u-flex__grow--1 u-mr--16 u-flex u-flex__align-center conn-name">
          <img class="u-mr--4" src="../../assets/icons/datasets/connection.svg" width="16" height="16" />
          <span class="conn-name">{{ connectionName }}</span>
        </div>
        <div class="text is-small u-flex u-flex__align-center conn-params" v-if="connectionParams">
          <img class="u-mr--4" src="../../assets/icons/datasets/connection.svg" width="16" height="16" />
          {{ $t('DataPage.connectionParameters') }}
        </div>
      </div>
      <div class="text is-small is-txtMidGrey u-width--100 oauth" v-else>
        {{ $t('DataPage.connectionThroughtOauth') }}
      </div>
    </div>
  </div>
</template>

<script>
import ConnectorQuickActions from './ConnectorQuickActions';

const DATABASE = 'database';

export default {
  name: 'Connection',
  components: {
    ConnectorQuickActions
  },
  props: {
    id: {
      type: String
    },
    type: {
      type: String
    },
    connectionType: {
      type: String
    },
    connectionName: {
      type: String
    },
    connectionParams: {
      type: Object
    },
    label: {
      type: String
    },
    beta: {
      type: Boolean
    },
    disabled: {
      type: Boolean
    }
  },
  data: () => {
    return {
    };
  },
  computed: {
    isDatabase () {
      return this.connectionType === DATABASE;
    },
    isBigQuery () {
      return this.type === 'bigquery';
    }
  },
  methods: {
    connectorSelected () {
      this.$emit('connectorSelected', this.id);
    },
    stopPropagation (e) {
      e.stopPropagation();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.connector {
  border-radius: 4px;
  background-color: $white;
  border: 1px solid $neutral--300;
  position: relative;
  transition: ease 300ms box-shadow;
  cursor: pointer;

  &:hover {
    box-shadow: 0 8px 12px 0 #c8d2da;

    .quickactions {

      .quick-actions {
        &:not(.is-open) {
          display: initial;
        }
      }
    }
  }

  .tools {
    border-top: 1px solid $neutral--300;

    .oauth {
      text-align: center;
    }

    .conn-name {
      overflow: hidden;

      > span {
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .conn-params {
      flex-wrap: nowrap;
    }
  }

  .quickactions {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;

    .quick-actions {
      &:not(.is-open) {
        display: none;
      }
    }
  }

  .beta-label {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    padding: 0 5px 4px 5px;
    background-color: #f0f0f0;
    border: 1px solid #dddddd;
    border-left: 0;
    border-top: 0;
    border-bottom-right-radius: 4px;
  }
}
</style>
