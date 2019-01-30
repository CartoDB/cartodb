<template>
  <section class="tags-section is-bgSoftBlue">
    <div class="container">
      <SectionTitle class="grid-cell" title="Your Tags">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/tags.svg">
        </template>

        <template slot="actionButton">
          <button class="button button--small is-primary button--ghost" @click="goToRecentSection">
            View recent content
          </button>
        </template>
      </SectionTitle>

      <ul class="grid">
        <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" v-for="tag in tags" :key="tag.tag">
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
      tags: [
        {
          tag: 'Administrative Regions',
          maps: 0,
          datasets: 1
        },
        {
          tag: '2014',
          maps: 3,
          datasets: 3
        },
        {
          tag: 'EARTHQUAKE',
          maps: 2,
          datasets: 0
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
