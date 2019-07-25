<template>
  <a :href="vizUrl"
     target="_blank"
     class="card map-card"
     :class="{
       'card--selected': isSelected,
       'card--child-hover': !activeHover,
       'card--quick-actions-open': areQuickActionsOpen,
       'card--can-hover': canHover
     }"
    @click="onClick">
    <div class="card-media" :class="{'has-error': isThumbnailErrored}">
      <img :src="mapThumbnailUrl" @error="onThumbnailError" v-if="isMap && !isThumbnailErrored"/>

      <div class="media-dataset" v-if="!isMap">
        <img svg-inline src="../../assets/icons/datasets/dataset-icon.svg" />
      </div>

      <div class="MapCard-error" v-if="isThumbnailErrored"></div>
    </div>

    <span class="checkbox card-select" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <input class="checkbox-input" :class="{'is-selected': isSelected }" @click.stop.prevent="toggleSelection($event)"  type="checkbox">
      <span class="checkbox-decoration">
        <img svg-inline src="../../assets/icons/common/checkbox.svg">
      </span>
    </span>

    <div class="card-actions" v-if="showInteractiveElements" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <component
        :is="quickActionsComponent"

        :map="visualization"
        :dataset="visualization"
        :storeActionType="storeActionType"

        @open="openQuickActions"
        @close="closeQuickActions"
        @contentChanged="onContentChanged"></component>
    </div>

    <div class="card-text">
      <div class="card-header" :class="{ 'card-header__no-description': !sectionsToShow.description}">
        <h2 :title="visualization.name" class="card-title title is-caption" :class="{'title-overflow': (titleOverflow || isStarInNewLine) && !singleLineTitle, 'single-line': singleLineTitle}">
          <span :class="{ 'title-element': singleLineTitle }">{{ visualization.name }}</span>
          <span
            v-if="showInteractiveElements"
            class="card-favorite"
            :class="{'is-favorite': visualization.liked, 'favorite-overflow': titleOverflow}"
            @click.prevent="toggleFavorite"
            @mouseover="mouseOverChildElement"
            @mouseleave="mouseOutChildElement">
            <img svg-inline src="../../assets/icons/common/favorite.svg">
          </span>
        </h2>
        <template v-if="sectionsToShow.description">
          <p class="card-description text is-caption" :title="visualization.description" v-if="visualization.description" :class="{'single-line': multilineTitle}">{{ visualization.description }}</p>
          <p class="card-description text is-caption is-txtSoftGrey" v-else>{{ $t(`MapCard.noDescription`) }}</p>
        </template>
      </div>

      <ul class="card-metadata">
        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.privacy && !isSharedWithMe">
          <span class="icon icon--privacy" :class="privacyIcon"></span>
          <p>{{ $t(`MapCard.shared.${visualization.privacy}`) }} <span v-if="showViews">| {{ $t(`MapCard.views`, { views: numberViews })}}</span></p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.privacy && isSharedWithMe">
          <span class="icon icon--privacy icon--sharedBy" :style="{ backgroundImage: `url('${visualization.permission.owner.avatar_url}')` }"></span>
          <p>{{ $t(`MapCard.sharedBy`, { owner: visualization.permission.owner.username })}}</p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.lastModification">
          <span class="icon"><img inline-svg src="../../assets/icons/maps/calendar.svg"></span>
          <p>{{ lastUpdated }}</p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.tags">
          <span class="icon"><img class="icon__tags" svg-inline src="../../assets/icons/common/tag.svg"></span>

          <ul class="card-tags" v-if="tagsChars <= maxTagsChars">
            <li v-for="(tag, index) in visualization.tags" :key="tag">
              <router-link class="card-tags__tag" :to="{ name: 'tagSearch', params: { tag } }" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">{{ tag }}</router-link><span v-if="index < visualization.tags.length - 1">,&#32;</span>
            </li>

            <li v-if="!tagsLength">
              <span>{{ $t(`MapCard.noTags`) }}</span>
            </li>
          </ul>
          <FeaturesDropdown v-if="tagsChars > maxTagsChars" :list=visualization.tags linkRoute="tagSearch" feature="tag">
            <span class="feature-text text is-caption is-txtGrey">{{tagsLength}} {{$t(`MapCard.tags`)}}</span>
          </FeaturesDropdown>
        </li>
      </ul>
    </div>
  </a>
</template>

<script>


export default {
  name: 'AppCard',
  components: {
  },
  props: {
    app
  },
  computed: {
    ...computed,
    quickActionsComponent () {
      const visualizationType = this.$props.visualization.type;

      if (visualizationType === 'table') {
        return 'DatasetQuickActions';
      }

      if (visualizationType === 'derived') {
        return 'MapQuickActions';
      }
    },
    sectionsToShow () {
      const defaultSections = ['description', 'privacy', 'lastModification', 'tags'];
      const visibleSections = this.$props.visibleSections || defaultSections;

      return visibleSections.reduce((allSections, section) => {
        allSections[section] = true;
        return allSections;
      }, {});
    },
    isMap () {
      return this.$props.visualization.type === 'derived';
    }
  },
  methods: {
    ...methods,
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  },
  // mounted: function () {
  //   function isStarUnderText (textNode, starNode) {
  //     const range = document.createRange();
  //     range.selectNodeContents(textNode.firstChild);
  //     const textBottomPosition = range.getClientRects()[0].bottom;
  //     const starBottomPosition = starNode.getBoundingClientRect().bottom;
  //     return textBottomPosition !== starBottomPosition;
  //   }

  //   this.$nextTick(function () {
  //     var title = this.$el.querySelector('.card-title');
  //     this.multilineTitle = title.offsetHeight > 30;
  //     this.titleOverflow = title.scrollHeight > title.clientHeight;
  //     this.isStarInNewLine = isStarUnderText(this.$el.querySelector('.card-title'), this.$el.querySelector('.card-favorite'));
  //   });
  // }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';


</style>
