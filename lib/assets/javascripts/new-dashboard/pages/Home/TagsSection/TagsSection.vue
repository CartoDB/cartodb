<template>
  <section class="tags-section is-bgSoftBlue">
    <div class="container">
      <SectionTitle class="grid-cell" :title="$t('HomePage.TagsSection.title')">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/tags.svg">
        </template>

        <template slot="actionButton">
          <button class="button button--small is-primary button--ghost button--last" @click="goToRecentSection">
            <img svg-inline src="../../../assets/icons/sections/tags/recent_content.svg" class="tags__action"/>
            {{ $t('HomePage.TagsSection.viewRecentContentAction') }}
          </button>
        </template>
      </SectionTitle>

      <LoadingState v-if="isFetching" :text="$t('HomePage.TagsSection.loading')" class="loading"></LoadingState>

      <EmptyState
        :text="$t('HomePage.TagsSection.emptyState.title')"
        :subtitle="$t('HomePage.TagsSection.emptyState.subtitle')"
        v-if="isEmptyState">
      </EmptyState>

      <ul class="grid tags" v-if="hasTags">
        <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile tag" v-for="tag in tags" :key="tag.tag">
          <TagCard :tag="tag" />
        </li>
      </ul>

      <Pagination class="pagination-element" v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
    </div>
  </section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import TagCard from 'new-dashboard/components/TagCard';
import Pagination from 'new-dashboard/components/Pagination';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import LoadingState from 'new-dashboard/components/States/LoadingState';

export default {
  name: 'TagsSection',
  components: {
    SectionTitle,
    TagCard,
    Pagination,
    EmptyState,
    LoadingState
  },
  mounted () {
    this.getTags();
  },
  data () {
    return {
      isFetching: false,
      tags: [],
      currentPage: 1,
      perPage: 6,
      totalTags: 0
    };
  },
  computed: {
    hasTags () {
      return !this.isFetching && this.totalTags > 0;
    },
    isEmptyState () {
      return !this.isFetching && this.totalTags <= 0;
    },
    numPages () {
      return Math.ceil(this.totalTags / this.perPage);
    },
    shouldShowPagination () {
      return this.numPages > 1;
    }
  },
  methods: {
    goToRecentSection () {
      this.$emit('sectionChange', 'RecentSection');
    },
    getTags (options = {}) {
      this.isFetching = true;

      this.$store.state.client.getTags(options,
        (err, _, tags) => {
          this.isFetching = false;

          if (err) {
            return;
          }

          this.tags = tags.result;
          this.totalTags = tags.total;
        }
      );
    },
    goToPage (page) {
      this.currentPage = page;
      this.getTags({ page });
    }
  }
};
</script>

<style lang="scss" scoped>
.tags {
  margin-bottom: 10px;
}

.tag {
  margin-bottom: 24px;
}

.tags__action {
  margin-right: 12px;
}

.loading {
  margin: 154px 0 85px;
}
</style>
