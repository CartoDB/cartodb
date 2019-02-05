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

      <ul class="grid">
        <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile tag" v-for="tag in tags" :key="tag.tag">
          <TagCard :tag="tag" />
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';
import TagCard from 'new-dashboard/components/TagCard.vue';

export default {
  name: 'TagsSection',
  components: {
    SectionTitle,
    TagCard
  },
  mounted () {
    this.getTags();
  },
  data () {
    return {
      tags: []
    };
  },
  methods: {
    goToRecentSection () {
      this.$emit('sectionChange', 'RecentSection');
    },
    getTags (options = {}) {
      this.$store.state.client.getTags(options,
        (err, _, tags) => {
          if (err) {
            return;
          }

          this.tags = tags;
        }
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.tag {
  margin-bottom: 24px;
}

.tags__action {
  margin-right: 12px;
}
</style>
