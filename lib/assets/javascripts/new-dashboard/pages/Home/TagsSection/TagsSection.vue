<template>
  <section class="tags-section is-bgSoftBlue">
    <div class="container">
      <SectionTitle class="grid-cell" :title="$t('HomePage.TagsSection.title')">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/tags.svg">
        </template>

        <template slot="actionButton">
          <button class="button button--small is-primary button--ghost" @click="goToRecentSection">
            {{ $t('HomePage.TagsSection.viewRecentContentAction') }}
          </button>
        </template>
      </SectionTitle>

      <ul class="grid">
        <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile tag-element" v-for="tag in tags" :key="tag.tag">
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
  data () {
    return {
      // TODO: Retrieve tags from API when endpoint is ready
      tags: [
        {
          tag: 'Blog',
          maps: 2,
          datasets: 3
        },
        {
          tag: 'Catalog',
          maps: 1,
          datasets: 4
        },
        {
          tag: 'Customer',
          maps: 3,
          datasets: 4
        },
        {
          tag: 'David',
          maps: 3,
          datasets: 4
        },
        {
          tag: 'Website',
          maps: 4,
          datasets: 1
        },
        {
          tag: 'Production',
          maps: 2,
          datasets: 3
        },
        {
          tag: 'Census',
          maps: 4,
          datasets: 3
        },
        {
          tag: 'Client',
          maps: 2,
          datasets: 4
        }
      ]
    };
  },
  methods: {
    goToRecentSection () {
      this.$emit('sectionChange', 'RecentSection');
    }
  }
};
</script>

<style lang="scss" scoped>
.tag-element {
  margin-bottom: 24px;
}
</style>
