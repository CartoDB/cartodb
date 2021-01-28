<template>
  <div @click="connectorSelected" class="connector u-flex u-flex__direction--column u-flex__justify--center u-flex__align--center" :class="{disabled, beta, connection: connection_id}">
    <div class="beta-label is-small" v-if="beta">Beta</div>
    <div class="ImportButton">
      <i :class="'is-' + id"></i>
    </div>
    <span class="is-small is-semibold title">{{ label }}</span>
  <div v-if="disabled" class="tooltip">
    <Tooltip :text="$t('ConnectorsPage.disabledUniqueConnectorText', {connector: label})" position="bottom-left" hide-delay="0s" show-delay="0s">
      <div></div>
    </Tooltip>
  </div>
  </div>
</template>

<script>

import Tooltip from 'new-dashboard/components/Tooltip/Tooltip';

export default {
  name: 'Connector',
  components: {
    Tooltip
  },
  props: {
    id: {
      type: String
    },
    connection_id: {
      default: null
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
  computed: {},
  methods: {
    connectorSelected () {
      if (!this.disabled) {
        if (this.connection_id) {
          this.$emit('connectionSelected', this.connection_id);
        } else {
          this.$emit('connectorSelected', this.id);
        }
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.connector {
  flex: 0 0 124px;
  width: 124px;
  height: 88px;
  border-radius: 4px;
  background-color: $white;
  border: 1px solid $neutral--300;
  position: relative;
  transition: ease 300ms box-shadow;
  cursor: pointer;
  position: relative;

  &.disabled {
    cursor: default;
    opacity: .4;
  }

  &.connection {
    border-color: $green--400;
  }

  &:hover {
    box-shadow: 0 8px 12px 0 #c8d2da;
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
    border-top-left-radius: 4px;
  }

  .title {
    white-space: pre-wrap;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    padding: 0 8px;
    max-height: 32px;
  }

  .tooltip {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    /deep/ >* {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1;
    }
  }
}

.ImportButton {
  min-width: 0;
  border: none;
  padding: 0;
  margin: 0;
  height: auto;
  width: auto;

  > * {
    height: 24px;
    padding: 0;
  }
}
</style>
