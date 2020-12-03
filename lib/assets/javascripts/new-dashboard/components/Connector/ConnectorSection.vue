<template>
  <div class="connector-section">
    <span class="is-small">{{ label }}</span>
    <div class="connectors-list u-flex u-flex__direction--row u-flex__align--center" :class="{ carrousel }">
      <Connector v-for="connector in connectors"
        :key="connector.id"
        :id="connector.id"
        :label="connector.label"
        :beta="connector.beta"
        :disabled="connector.disabled"
        @connectorSelected="connectorSelected"
        ></Connector>
    </div>
    <div class="carrousel-controls" v-if="carrousel">
      <span class="prev"></span>
      <span class="next"></span>
    </div>
  </div>
</template>

<script>

import Connector from 'new-dashboard/components/Connector/Connector';

export default {
  name: 'ConnectorSection',
  components: {
    Connector
  },
  props: {
    /**
     * The idea with carrouse would be that only appears if is true and the component is overflowing. In that case will appear controls
     * and allows to scrolling with no scrollbar rendered
     */
    carrousel: {
      type: Boolean
    },
    label: {
      type: String
    },
    connectors: {
      type: Array
    }
  },
  data: () => {
    return {
    };
  },
  computed: {},
  methods: {
    connectorSelected (id) {
      this.$emit('connectorSelected', id);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
$controlSize: 36px;

.connector-section {
  position: relative;
  margin-bottom: 16px;

  .connectors-list {
    flex-wrap: wrap;

    &.carrousel {
      flex-wrap: nowrap;
      overflow-x: auto;
    }

    .connector {
      margin-top: 8px;

      &:not(:last-child) {
        margin-right: 12px;
      }
    }
  }

  .carrousel-controls {
    position: absolute;
    height: calc(100% - 16px)  ;
    width: 100%;
    pointer-events: none;
    top: 16px;

    .prev, .next {
      display: block;
      position: absolute;
      height: $controlSize;
      width: $controlSize;
      top: calc(50% - #{$controlSize / 2});
      pointer-events: all;
      cursor: pointer;
      background-color: $white;
      border: 1px solid $neutral--300;
      border-radius: 50%;
    }
    .prev {
      left: #{$controlSize / -2};
    }
    .next {
      right: #{$controlSize / -2};
    }
  }
}
</style>
