<template>
  <div class="connector-section">
    <span class="is-small is-txtMidGrey">{{ label }}</span>
    <div class="connectors-list u-flex u-flex__direction--row u-flex__align--center" :class="{ carrousel }">
      <Connector v-for="(connector, index) in connectors"
        :key="`${connector.id}-${index}`"
        :id="connector.id"
        :conenection_id="connector.conenection_id"
        :label="connector.label"
        :beta="connector.beta"
        :disabled="connector.disabled"
        @connectorSelected="connectorSelected"
        @conenectionSelected="conenectionSelected"
        ></Connector>
    </div>
    <div class="carrousel-controls" v-if="carrousel">
      <span class="u-flex u-flex__align--center u-flex__justify--center prev"></span>
      <span class="u-flex u-flex__align--center u-flex__justify--center next"></span>
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
    },
    conenectionSelected (id) {
      this.$emit('conenectionSelected', id);
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
      -ms-overflow-style: none;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
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
      position: absolute;
      height: $controlSize;
      width: $controlSize;
      top: calc(50% - #{$controlSize / 2});
      pointer-events: all;
      cursor: pointer;
      background-color: $white;
      border: 1px solid $neutral--300;
      border-radius: 50%;

      &:before{
        content: '';
        display: block;
        height: 14px;
        width: 14px;
        background-image: url("../../assets/icons/catalog/arrow-navy.svg");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 14px;
        opacity: .2;
      }
    }

    .prev {
      left: #{$controlSize / -2};
      transform: rotate(90deg);
    }
    .next {
      right: #{$controlSize / -2};
      transform: rotate(-90deg);
    }
  }
}
</style>
