<template>
  <div
    :to="{ name: 'tileset-viewer', params: { id: tileset.id }}"
    class="tileset-row"
    :class="{
      'tileset-row--quick-actions-open': areQuickActionsOpen,
      'tileset-row--no-hover': !activeHover,
      'tileset-row--can-hover': canHover
    }"
    @click="onClick"
    >

    <div class="viz-column--main-info">
      <div class="cell cell--start cell--first">
        <div class="row-dataType">
            <div class="icon--dataType" :class="`icon--${tilesetType}`"></div>
        </div>
      </div>

      <div class="cell cell--main">
        <div class="title-container" @mouseover="showCopyDropdown" @mouseleave="hideCopyDropdown">
          <h3 class="text is-caption is-txtGrey u-ellipsis row-title" :title="tileset.id">
            {{ name }}
          </h3>
          <div class="dropdown-container" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <CopyDropdown :textToCopy="tileset.id" :isVisible="copyDropdownVisible" @hideDropdown="hideCopyDropdown"></CopyDropdown>
          </div>
        </div>
      </div>
    </div>

    <div class="viz-column--extra-info">
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey">{{ lastUpdated }}</span>
      </div>
      <div class="cell cell--small u-txt-right">
        <span class="text is-small is-txtSoftGrey">{{ createdAt }}</span>
      </div>
      <div class="cell cell--small u-txt-right">
        <span class="text is-small is-txtSoftGrey">{{ zoom }}</span>
      </div>
      <div class="cell cell--xlarge cell--overflow-hidden u-txt-right">
        <span class="text is-small is-txtSoftGrey ellipsis">
          {{ properties }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import CopyDropdown from 'new-dashboard/components/Dropdowns/CopyDropdown';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';

export default {
  name: 'TilesetCard',
  components: {
    CopyDropdown
  },
  props: {
    tileset: Object,
    isSelected: {
      type: Boolean,
      default: false
    },
    canHover: {
      type: Boolean,
      default: true
    },
    selectMode: {
      type: Boolean,
      default: false
    },
    storeActionType: {
      type: String,
      default: 'tilesets'
    }
  },
  data: function () {
    return {
      areQuickActionsOpen: false,
      activeHover: true,
      copyDropdownVisible: false
    };
  },
  computed: {
    createdAt () {
      return new Date(this.tileset.created_at).toLocaleDateString();
    },
    lastUpdated () {
      return this.$t('TilesetCard.lastUpdated', { date: distanceInWordsStrict(this.tileset.updated_at, new Date()) });
    },
    tilesetType () {
      return 'tileset';
    },
    isSharedWithMe () {
      return false;
    },
    showInteractiveElements () {
      return !this.selectMode;
    },
    properties () {
      return this.tileset.metadata.tilestats && this.tileset.metadata.tilestats.layers ? this.tileset.metadata.tilestats.layers[0].attributes.map(({ attribute }) => attribute).join(', ') : '';
    },
    zoom () {
      return `${this.tileset.metadata.minzoom} - ${this.tileset.metadata.maxzoom}`;
    },
    vizUrl () {
      return null;
    },
    name () {
      const [,, table] = this.tileset.id.split('.');
      return table;
    }
  },
  methods: {
    mouseOverChildElement () {
      this.activeHover = false;
    },
    mouseOutChildElement () {
      this.activeHover = true;
    },
    showCopyDropdown () {
      this.copyDropdownVisible = true;
    },
    hideCopyDropdown () {
      this.copyDropdownVisible = false;
    },
    openQuickActions () {
      this.areQuickActionsOpen = true;
    },
    closeQuickActions () {
      this.areQuickActionsOpen = false;
    },
    onClick (event) {
      this.$emit('onClick', this.tileset);
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.tileset-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  background-color: $white;
  cursor: pointer;

  &.tileset-row--quick-actions-open,
  &:hover {
    text-decoration: none;

    .tileset--quick-actions {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }
  }

  &:hover {
    background-color: $softblue;
  }
}

.row-dataType {
  width: 36px;
  height: 36px;
  margin-right: 6px;
  margin-left: 6px;
  padding: 9px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border-radius: 2px;
  background-color: $thumbnail__bg-color;

  .row-typeIcon {
    fill: $text__color;
  }

  &.row-dataType--premium {
    background-color: $color-premium;

    .row-typeIcon {
      fill: $white;
    }
  }
}

.cell--start {
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
}

.icon--dataType {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center;

  &.icon--tileset {
    background-image: url("../../../assets/icons/tilesets/tileset-simple.svg");
  }
}

.dropdown-container {
  position: absolute;
  z-index: 2;
  bottom: 100%;
  margin-left: 32px;
  padding-bottom: 8px;
}

.tileset--quick-actions {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.quick-actions-placeholder {
  display: block;
  width: 24px;
  height: 24px;
}
</style>
