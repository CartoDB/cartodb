<template>
  <div class="connector-section">
    <span class="is-small is-txtMidGrey">{{ label }}</span>
    <div ref="carousel" class="connectors-list u-flex u-flex__direction--row u-flex__align--center" :class="{ carousel }">
      <Connector v-for="(connector, index) in connectors"
        :key="`${connector.id}-${index}`"
        :id="connector.id"
        :connection_id="connector.connection_id"
        :label="connector.label"
        :beta="connector.beta"
        :disabled="connector.disabled"
        :class="{'lastInRow': !carousel && !((index + 1) % elementsPerPage)}"
        @connectorSelected="connectorSelected"
        @connectionSelected="connectionSelected"
        ></Connector>
    </div>
    <div ref="controls" class="carousel-controls" v-if="carousel">
      <span @click="prev" class="u-flex u-flex__align--center u-flex__justify--center prev" :class="{disabled: !page}"></span>
      <span @click="next" class="u-flex u-flex__align--center u-flex__justify--center next" :class="{disabled: page === numberOfPages - 1}"></span>
    </div>
  </div>
</template>

<script>

import Connector from 'new-dashboard/components/Connector/Connector';

const BOX_MARGIN = 12;
const ANIMATION = 'smooth';

export default {
  name: 'ConnectorSection',
  components: {
    Connector
  },
  props: {
    carousel: {
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
      containerWidth: 0,
      connectorWidth: 0,
      page: 0
    };
  },
  computed: {
    isFirstPage () {
      return this.page === 0;
    },
    isLastPage () {
      return this.page === this.numberOfPages - 1;
    },
    numberConnectors () {
      return this.connectors.length;
    },
    elementsPerPage () {
      return parseInt(this.containerWidth / (this.connectorWidth + BOX_MARGIN));
    },
    numberOfPages () {
      return Math.ceil(this.numberConnectors / this.elementsPerPage);
    }
  },
  mounted () {
    this.updateWidth();
    window.addEventListener('resize', this.onWindowResize);
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onWindowResize);
  },
  methods: {
    onWindowResize () {
      this.updateWidth();
      if (this.numberOfPages < this.page) {
        this.page = this.numberOfPages - 1;
      }
    },
    updateWidth () {
      if (this.$refs.carousel) {
        this.containerWidth = this.$refs.carousel.clientWidth;
        this.connectorWidth = this.$refs.carousel.querySelector('.connector').clientWidth;
      }
    },
    prev () {
      this.page -= 1;
      this.$refs.carousel.scroll({ left: (this.containerWidth + BOX_MARGIN) * this.page, behavior: ANIMATION });
    },
    next () {
      this.page += 1;
      this.$refs.carousel.scroll({ left: (this.containerWidth + BOX_MARGIN) * this.page, behavior: ANIMATION });
    },
    connectorSelected (id) {
      this.$emit('connectorSelected', id);
    },
    connectionSelected (id) {
      this.$emit('connectionSelected', id);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
$controlSize: 36px;

.connector-section {
  position: relative;

  .connectors-list {
    flex-wrap: wrap;
    padding-bottom: 16px;

    &.carousel {
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
      margin-right: 12px;

      &:last-child,
      &.lastInRow {
        margin-right: 0;
      }
    }
  }

  .carousel-controls {
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

      &:before {
        content: '';
        display: block;
        height: 14px;
        width: 14px;
        background-image: url("../../assets/icons/catalog/arrow-navy.svg");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 14px;
        opacity: .65;
      }

      &.disabled {
        pointer-events: none;
        &:before {
          opacity: .4;
        }
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
