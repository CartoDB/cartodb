<template>
    <header class="head-section">
        <div class="head-sectionContainer">
            <h2 class="head-sectionTitle">
                <span class="icon icon--large"><slot name="icon"></slot></span>
                {{title}}
            </h2>
            <ul class="head-sectionActions">
                <li class="head-sectionActionsItem head-sectionDropdownContainer">
                    <slot name="dropdownButton"></slot>
                </li>
                <li class="head-sectionActionsItem">
                    <slot name="primaryButton"></slot>
                </li>
            </ul>
        </div>
        <p class="head-sectionDescription">{{description}}</p>
    </header>
</template>

<script>
export default {
  name: 'SectionTitle',
  components: {
  },
  props: {
    title: String,
    icon: String,
    description: String
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.icon--large {
  width: 24px;
  height: 24px;
}

.icon--small {
  width: 14px;
  height: 14px;
}

.head-section {
  margin-bottom: 36px;
}

.head-sectionTitle {
  display: flex;
  align-items: center;
  color: $textColor;
  font: 700 24px/1.6 'Montserrat';

  .icon {
    margin-right: 16px;
    margin-left: -40px;
  }
}

.head-sectionDescription {
  color: $textColor;
  font: 400 16px/1.6 'Open Sans';

  a {
    color: $textColor;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}

.head-sectionContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.head-sectionActions {
  display: flex;
  align-items: center;
}

.head-sectionActionsItem {
  margin-left: 24px;

  &:last-child {
    margin-left: 0;
  }
}

.head-sectionDropdownContainer {
  position: relative;

  &:hover {
    .head-sectionDropdown {
      opacity: 1;
      pointer-events: all;
    }
  }
}

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
      color: $primaryColor;

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
