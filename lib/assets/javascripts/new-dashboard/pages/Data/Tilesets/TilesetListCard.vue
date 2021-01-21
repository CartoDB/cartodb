<template>
  <a :href="vizUrl"
     class="tileset-row"
     :class="{
       'tileset-row--quick-actions-open': areQuickActionsOpen,
       'tileset-row--no-hover': !activeHover,
       'tileset-row--can-hover': canHover
     }"
     @click="onClick">

    <div class="viz-column--main-info">
      <div class="cell cell--start cell--first">
        <div class="row-dataType">
            <div class="icon--dataType" :class="`icon--${tilesetType}`"></div>
        </div>
      </div>

      <div class="cell cell--main">
        <div class="title-container" @mouseover="showCopyDropdown" @mouseleave="hideCopyDropdown">
          <h3 class="text is-caption is-txtGrey u-ellipsis row-title" :title="tileset.id">
            {{ tileset.id }}
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
        <span class="text is-small is-txtSoftGrey">0-12</span>
      </div>
      <div class="cell cell--large cell--overflow-hidden u-txt-right">
        <span class="text is-small is-txtSoftGrey ellipsis">
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quo, dolorem. Porro mollitia magnam doloribus iusto neque dolor dolore nihil earum consectetur, laudantium similique aut assumenda rem. Corrupti aperiam molestiae sapiente.
        </span>
      </div>
      <div class="cell cell--last" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
        <span class="quick-actions-placeholder" v-if="!showInteractiveElements"></span>
        <TilesetQuickActions
          v-if="showInteractiveElements"
          :tileset="tileset"
          :isSharedWithMe="isSharedWithMe"
          class="tileset--quick-actions"
          @open="openQuickActions"
          @close="closeQuickActions"
          @contentChanged="onContentChanged"/>
      </div>
    </div>
  </a>
</template>

<script>
import TilesetQuickActions from 'new-dashboard/components/QuickActions/TilesetQuickActions';
import CopyDropdown from 'new-dashboard/components/Dropdowns/CopyDropdown';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import FeaturesDropdown from 'new-dashboard/components/Dropdowns/FeaturesDropdown';
import SharedBrief from 'new-dashboard/components/SharedBrief';

export default {
  name: 'TilesetCard',
  components: {
    TilesetQuickActions,
    FeaturesDropdown,
    SharedBrief,
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
      return this.tileset.created_at.toLocaleDateString();
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
    vizUrl () {
      return null;
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
      // TODO
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
