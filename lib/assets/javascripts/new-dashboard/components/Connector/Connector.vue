<template>
  <div @click="connectorSelected" class="connector u-flex u-flex__direction--column u-flex__justify--center u-flex__align--center" :class="{disabled, beta}">
    <div class="beta-label is-small" v-if="beta">Beta</div>
    <div class="ImportButton">
      <i :class="'is-' + id"></i>
    </div>
    <span class="is-small is-semibold">{{ label }}</span>
  </div>
</template>

<script>

export default {
  name: 'Connector',
  components: {},
  props: {
    id: {
      type: String
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
      this.$emit('connectorSelected', this.id);
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

  &.disabled {
    pointer-events: none;
    opacity: .4;
  }

  &:hover {
    box-shadow: 0 8px 12px 0 #c8d2da;
  }

  .beta-label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 5px 4px 5px;
    background-color: #f0f0f0;
    border: 1px solid #dddddd;
    border-left: 0;
    border-top: 0;
    border-bottom-right-radius: 4px;
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
