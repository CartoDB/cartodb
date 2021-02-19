<template>
  <div class="text is-small is-txtMidGrey dataset-card" :class="{'is-selected': isSelected}">
    <div class="dataset-card__icon" :class="`dataset-card__icon--${dataType}`"></div>
    <div class="dataset-card__name u-ml--12 u-mr--40">
      <h3 class="text is-caption is-txtBaseGrey text-title u-ellipsis">{{dataset.name}}</h3>
      <p class="text is-small is-txtBaseGrey text-description">{{dataset.description? dataset.description : $t('NewMapDatasetCard.noDescription')}}</p>
    </div>
    <div class="dataset-card__property dataset-card__rows">
      {{$tc('NewMapDatasetCard.numberRows', dataset.table.row_count, { count: getNumberInLocaleFormat(dataset.table.row_count) })}}
    </div>
    <div class="dataset-card__property dataset-card__size">
      {{humanFileSize(dataset.table.size)}}
    </div>
    <div class="dataset-card__property dataset-card__creation">
      {{lastUpdated}}
    </div>
    <div class="dataset-card__property dataset-card__tags">
      <span v-if="dataset.tags.length == 0">
        {{$tc('NewMapDatasetCard.tags', dataset.tags.length)}}
      </span>
      <span v-else-if="tagsChars <= maxTagChars">
        {{dataset.tags.join(', ')}}
      </span>
      <div v-else-if="tagsChars > maxTagChars" class="extra-tags">
        {{$tc('NewMapDatasetCard.tags', dataset.tags.length)}}
        <ul class="dropdown">
          <li v-for="tagName in dataset.tags" :key="tagName">
            {{tagName}}
          </li>
        </ul>
      </div>
    </div>
    <div class="dataset-card__property dataset-card__privacy">
      {{ $t(`NewMapDatasetCard.shared.${dataset.privacy}`) }}
    </div>
    <div class="u-flex dataset-card__property dataset-card__owner" v-if="isShared">
      {{ $t(`NewMapDatasetCard.shared.by`) }}
      <Tooltip :text="dataset.permission.owner.username" position="top-right" hide-delay="0s" show-delay="1s">
        <img class="u-ml--4" width="18px" height="18px" :title="dataset.permission.owner.username" :alt="dataset.permission.owner.username" :src="dataset.permission.owner.avatar_url">
      </Tooltip>
    </div>
  </div>
</template>

<script>
import * as Formatter from 'new-dashboard/utils/formatter';
import countCharsArray from 'new-dashboard/utils/count-chars-array';
import Tooltip from 'new-dashboard/components/Tooltip/Tooltip';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import { mapState } from 'vuex';

export default {
  name: 'DatasetCard',
  components: {
    Tooltip
  },
  props: {
    dataset: Object,
    isSelected: Boolean
  },
  data: () => {
    return {
      maxTagChars: 16
    };
  },
  computed: {
    ...mapState({
      userName: state => state.config.user_name
    }),
    isShared () {
      return this.dataset && this.dataset.permission.owner.username !== this.userName;
    },
    lastUpdated () {
      let updatedDate = this.$props.dataset.updated_at;
      if (this.$props.dataset.synchronization && this.$props.dataset.synchronization.updated_at) {
        updatedDate = this.$props.dataset.synchronization.updated_at;
      }
      return this.$t('NewMapDatasetCard.lastUpdated', { date: distanceInWordsStrict(updatedDate, new Date()) });
    },
    tagsChars () {
      return countCharsArray(this.$props.dataset.tags, ', ');
    },
    numberTags () {
      return this.$props.dataset.tags ? this.$props.dataset.tags.length : 0;
    },
    dataType () {
      const geometryTypes = {
        'st_multipolygon': 'polygon',
        'st_polygon': 'polygon',
        'st_multilinestring': 'line',
        'st_linestring': 'line',
        'st_multipoint': 'point',
        'st_point': 'point',
        '': 'empty'
      };
      let geometry = '';
      if (this.$props.dataset.table && this.$props.dataset.table.geometry_types && this.$props.dataset.table.geometry_types.length) {
        geometry = this.$props.dataset.table.geometry_types[0];
      }
      const currentGeometryType = geometry.toLowerCase();
      return geometryTypes[currentGeometryType] ? geometryTypes[currentGeometryType] : 'unknown';
    }
  },
  methods: {
    humanFileSize (size) {
      return Formatter.humanFileSize(size);
    },
    isLastTag (index) {
      return index === this.numberTags - 1;
    },
    getNumberInLocaleFormat (number) {
      return number.toLocaleString();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.text-description {
  opacity: 0.48;
}

.dataset-card {
  display: flex;
  align-items: center;
  padding: 16px 24px 16px 16px;
  transition: box-shadow 0.2s;
  border: 1px solid #E7E9EC;
  border-radius: 4px;
  background-color: $white;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 8px #C8D2DA;
  }

  &.is-selected {
    border-color: $blue--500;
  }
}

.dataset-card__name {
  width: 35%;
}

.dataset-card__property {
  margin-left: 24px;
  text-align: right;
}

.dataset-card__rows {
  width: 8%;
  margin-left: auto;
}

.dataset-card__size {
  width: 8%;
}

.dataset-card__creation {
  width: 12%;
}

.dataset-card__tags {
  position: relative;
  width: 10%;
}

.dataset-card__privacy {
  width: 51px;
  padding: 2px 0;
  border: 1px solid #DDD;
  border-radius: 4px;
  background-color: #F0F0F0;
  text-align: center;
}

.dataset-card__icon {
  width: 40px;
  height: 40px;
  border: 1px solid $neutral--800;
  border-radius: 4px;
  opacity: 0.32;
  background-repeat: no-repeat;
  background-position: center;

  &.dataset-card__icon--point {
    background-image: url("../../assets/icons/datasets/data-types/dots.svg");
  }

  &.dataset-card__icon--polygon {
    background-image: url("../../assets/icons/datasets/data-types/area.svg");
  }

  &.dataset-card__icon--line {
    background-image: url("../../assets/icons/datasets/data-types/line.svg");
  }

  &.dataset-card__icon--empty,
  &.dataset-card__icon--unknown {
    background-image: url("../../assets/icons/datasets/data-types/unknown.svg");
  }
}

.dropdown {
  display: none;
  position: absolute;
  top: 24px;
  min-width: 100px;
  padding: 12px 16px 16px;
  border: 1px solid $border-color;
  border-radius: 4px;
  background-color: #FFF;
  text-align: left;

  &::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 16px;
    width: 14px;
    height: 14px;
    transform: rotate(45deg);
    border: 1px solid $neutral--200;
    border-right: none;
    border-bottom: none;
    border-radius: 2px;
    background-color: #FFF;
  }
}

.extra-tags {
  &:hover {
    .dropdown {
      display: block;
    }
  }
}
</style>
