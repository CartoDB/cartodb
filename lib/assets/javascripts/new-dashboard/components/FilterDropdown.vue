<template>
<div>
  <button class="button button--ghost">
    <span class="button-icon">
      <svg width="18" height="20" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg">
        <g fill="#036FE2" fill-rule="evenodd">
          <path d="M8.3 6.7l1.4-1.4L5 .58.3 5.29l1.4 1.42L4 4.4v11.6h2V4.4zM16.3 13.3L14 15.58V4h-2V15.6l-2.3-2.3-1.4 1.42 4.7 4.7 4.7-4.7z"/>
        </g>
      </svg>
    </span>
  </button>
  <div class="head-sectionDropdown">
    <div class="head-sectionDropdownCategory">
      <h6 class="text is-xsmall is-txtGreyLight u-tupper letter-spacing">Show Me</h6>
      <ul class="head-sectionDropdownList">
          <li class="text is-caption is-txtGrey is-selected">All applications</li>
          <li class="text is-caption is-txtGrey">Favorites only</li>
          <li class="text is-caption is-txtGrey">Shared with you</li>
      </ul>
      </div>
      <div class="head-sectionDropdownCategory">
      <h6 class="text is-xsmall is-txtGreyLight u-tupper letter-spacing">Order</h6>
      <ul class="head-sectionDropdownList">
        <li class="text is-caption is-txtGrey is-selected">Alphabetically</li>
        <li class="text is-caption is-txtGrey">Newest first</li>
        <li class="text is-caption is-txtGrey">Oldest first</li>
        <li class="text is-caption is-txtGrey">Most views first</li>
      </ul>
    </div>
  </div>
</div>
</template>

<script>

</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.head-sectionDropdown {
  position: absolute;
  z-index: 1;
  right: 0;
  overflow: hidden;
  transition: all 0.25s linear;
  border: 1px solid $light-grey;
  border-radius: 2px;
  opacity: 0;
  pointer-events: none;
}

.head-sectionDropdownCategory {
  width: 270px;
  padding: 16px 36px;
  border-bottom: 1px solid $light-grey;
  background-color: #FFF;

  &:last-of-type {
    border-bottom: none;
  }

  &:nth-child(2n) {
    background-color: $softblue;
  }
}

.head-sectionDropdownList {
  margin-top: 8px;

  li {
    margin-bottom: 12px;

    &:last-of-type {
      margin-bottom: 0;
    }

    &.is-selected {
      position: relative;
      color: $primary-color;

      &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: -22px;
        width: 14px;
        height: 14px;
        transform: translateY(-50%);
        background-image: url("/img/icons/check.svg");
      }
    }
  }
}
</style>
