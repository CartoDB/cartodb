<template>
  <ul class="Pagination-list CDB-Text CDB-Size-medium">
    <li class="Pagination-listItem" v-if="showFirst">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(1)>1</button>
    </li>
    <li class="Pagination-listItem" v-for="item in leftItems" :key="item">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(item)>{{ item }}</button>
    </li>
    <li class="Pagination-listItem" v-if="hasMoreThanMaximumElements && showNPositionPrev(2)">
      <button class="Pagination-listItemInner Pagination-listItemInner--more">&hellip;</button>
    </li>
    <li class="Pagination-listItem" v-if="showNPositionPrev(1)">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(prevPage)>{{ prevPage }}</button>
    </li>
    <li class="Pagination-listItem is-current">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(page)>{{ page }}</button>
    </li>
    <li class="Pagination-listItem" v-if="showNPositionNext(1)">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(nextPage)>{{ nextPage }}</button>
    </li>
    <li class="Pagination-listItem" v-if="hasMoreThanMaximumElements && showNPositionNext(2)">
      <button class="Pagination-listItemInner Pagination-listItemInner--more">&hellip;</button>
    </li>
    <li class="Pagination-listItem" v-for="item in rightItems" :key="item">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(item)>{{ item }}</button>
    </li>
    <li class="Pagination-listItem" v-if="showLast">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(numPages)>{{ numPages }}</button>
    </li>
  </ul>
</template>

<script>

export default {
  name: 'Pagination',
  props: {
    page: Number,
    numPages: Number
  },
  data () {
    return {
      maximumElements: 7
    };
  },
  computed: {
    prevPage () {
      return this.page - 1;
    },
    nextPage () {
      return this.page + 1;
    },
    showFirst () {
      return this.page !== 1;
    },
    showLast () {
      return this.page !== this.numPages;
    },
    hasMoreThanMaximumElements () {
      return this.numPages > this.maximumElements;
    },
    leftItems () {
      if (!this.numPages ||
          this.hasMoreThanMaximumElements ||
          (this.prevPage - 1) < 1) {
        return [];
      }

      const numberOfItems = this.prevPage - 2;
      return [...Array(numberOfItems)].map((_, i) => i + 2);
    },
    rightItems () {
      if (!this.numPages ||
          this.hasMoreThanMaximumElements ||
          (this.numPages - this.nextPage) <= 0) {
        return [];
      }

      const numberOfItems = this.numPages - this.nextPage - 1;
      const nextPage = this.nextPage;
      return [...Array(numberOfItems)].map((_, i) => i + nextPage + 1);
    }
  },
  methods: {
    showNPositionPrev (n) {
      return (this.page - n) > 1;
    },
    showNPositionNext (n) {
      return (this.page + n) < this.numPages;
    },
    goToPage (page) {
      this.$emit('pageChange', page);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.Pagination-list {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
}

.Pagination-listItem {
  border: 1px solid $border-color--dark;
  border-right-width: 0;
}

.Pagination-listItemInner {
  display: inline-block;
  padding: 15px 20px;
  border: none;
  outline: none;
  background: $white;
  color: $primary-color;
}

.Pagination-listItemInner--more {
  background-color: $white;
  color: $text__color;
  cursor: default;
}

.Pagination-listItem:first-child {
  border-radius: 2px 0 0 2px;

  .Pagination-listItemInner {
    border-radius: 2px 0 0 2px;
  }
}

.Pagination-listItem:last-child {
  border-right-width: 1px;
  border-radius: 0 2px 2px 0;

  .Pagination-listItemInner {
    border-radius: 0 2px 2px 0;
  }
}

.Pagination-listItemInner--link:hover {
  background-color: $softblue;
  text-decoration: underline;
}

.Pagination-listItem.is-current,
.Pagination-listItem.is-current .Pagination-listItemInner--link,
.Pagination-listItem.is-current .Pagination-listItemInner--link:hover {
  background-color: $softblue;
  color: $text__color;
  text-decoration: none;
  cursor: default;
  pointer-events: none;
}
</style>
