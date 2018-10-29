<template>
  <ul class="Pagination-list CDB-Text CDB-Size-medium">
    <li class="Pagination-listItem" v-if="showFirst">
      <button class="Pagination-listItemInner Pagination-listItemInner--link" @click=goToPage(1)>1</button>
    </li>
    <li class="Pagination-listItem" v-if="showNPositionPrev(2)">
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
    <li class="Pagination-listItem" v-if="showNPositionNext(2)">
      <button class="Pagination-listItemInner Pagination-listItemInner--more">&hellip;</button>
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
@import 'stylesheets/new-dashboard/variables';

.Pagination-list {
  display: flex;
  align-items: center;
  justify-content: center;
}

.Pagination-listItem {
  border: 1px $grey solid;
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
  color: $text-color;
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

.Pagination-listItem.is-current,
.Pagination-listItem.is-current .Pagination-listItemInner--link,
.Pagination-listItem.is-current .Pagination-listItemInner--link:hover {
  color: $text-color;
  background-color: $softblue;
  text-decoration: none;
  cursor: default;
}
</style>
