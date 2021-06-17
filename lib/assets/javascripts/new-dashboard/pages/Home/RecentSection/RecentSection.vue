<template>
  <section class="recent-section is-bgSoftBlue">
    <div class="container">
      <SectionTitle class="grid-cell">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/recent.svg">
        </template>
        <template slot="title">{{ $t('HomePage.RecentSection.title') }}</template>
        <template slot="actionButton">
          <button class="button button--small is-primary button--ghost button--last" @click="goToTagsSection">
            <img svg-inline src="../../../assets/icons/sections/recent-content/tags.svg" class="recent__action"/>
            {{ $t('HomePage.RecentSection.viewTagsAction') }}
          </button>
        </template>
      </SectionTitle>

      <ul class="grid">
        <template v-if="!isFetching">
          <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile"
              v-for="visualization in recentContent"
              :key="visualization.id">
            <SimpleMapCard
              :visualization="visualization"
              :visibleSections="visibleSections"
              :canHover="false"
              :singleLineTitle="true"
              storeActionType="recentContent"
              @contentChanged="onContentChanged" />
          </li>
        </template>
        <template v-else>
          <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile"
              v-for="n in 3"
              :key="n">
            <SimpleMapCardFake :visibleSections="visibleSections"></SimpleMapCardFake>
          </li>
        </template>
      </ul>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import SimpleMapCard from 'new-dashboard/components/MapCard/SimpleMapCard';
import SimpleMapCardFake from 'new-dashboard/components/MapCard/fakes/SimpleMapCardFake';

export default {
  name: 'RecentSection',
  components: {
    SectionTitle,
    SimpleMapCard,
    SimpleMapCardFake
  },
  data () {
    return {
      visibleSections: ['privacy', 'lastModification']
    };
  },
  computed: {
    ...mapState({
      isFetching: state => {
        return state.recentContent.isFetching;
      },
      recentContent: state => {
        if (
          state.config.cartodb_com_hosted &&
          state.recentContent.list
        ) {
          const recentContent = {};
          Object.entries(state.recentContent.list).forEach(([key, value]) => {
            if (value.type !== 'keplergl') {
              recentContent[key] = value;
            }
          });
          return recentContent;
        } else {
          return state.recentContent.list;
        }
      }
    })
  },
  methods: {
    goToTagsSection () {
      const section = 'TagsSection';

      this.$emit('sectionChange', section);
      this.$router.push({ query: { section, sectionPage: 1 } });
    },

    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  }
};
</script>

<style lang="scss" scoped>
.recent__action {
  margin-right: 12px;
}
</style>
