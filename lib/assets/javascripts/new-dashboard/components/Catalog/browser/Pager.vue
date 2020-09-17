<template>
  <ul v-if="totalPages > 1" class="pager text is-caption">
    <li @click="goToPage(0)" :class="{ active: currentPage === 0 }">1</li>
    <li v-if="middlePages[0] > 1" class="disabled">...</li>
    <li
      v-for="page in middlePages"
      :key="page"
      @click="goToPage(page)"
      :class="{ active: currentPage === page }"
    >
      {{ page + 1 }}
    </li>
    <li
      v-if="middlePages[middlePages.length - 1] < totalPages - 2"
      class="disabled"
    >
      ...
    </li>
    <li
      v-if="totalPages > 1"
      @click="goToPage(totalPages - 1)"
      :class="{ active: currentPage === totalPages - 1 }"
    >
      {{ totalPages }}
    </li>
  </ul>
</template>

<script>
export default {
  name: 'Pager',
  props: {
    count: {
      type: Number,
      required: true
    },
    currentPage: {
      type: Number,
      required: true
    }
  },
  computed: {
    pageSize () {
      return process.env.VUE_APP_PAGE_SIZE || 10;
    },
    totalPages () {
      return Math.ceil(this.count / this.pageSize);
    },
    middlePages () {
      if (this.totalPages > 3) {
        if (this.currentPage < 2) {
          return [1, 2];
        } else if (this.currentPage > this.totalPages - 3) {
          return [this.totalPages - 3, this.totalPages - 2];
        } else {
          return [this.currentPage - 1, this.currentPage, this.currentPage + 1];
        }
      } else if (this.totalPages > 2) {
        return [this.totalPages - 2];
      } else {
        return [];
      }
    }
  },
  methods: {
    goToPage (pageNum) {
      this.$emit('goToPage', pageNum);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.pager {
  display: inline-flex;
  flex-direction: row;
  border: 1px solid $neutral--300;

  li {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    color: $navy-blue;
    cursor: pointer;

    &:not(.disabled):not(.active):hover {
      background-color: transparentize($color: $blue--100, $amount: 0.5);
    }

    & + li {
      border-left: 1px solid $neutral--300;
    }

    &.active {
      background-color: $blue--100;
    }

    &.disabled {
      cursor: default;
    }
  }
}
</style>
