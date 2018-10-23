<template>
    <div class="grid-cell grid-cell--col4">
        <div class="card" v-bind:class="{selected: selected}">
            <span class="checkbox card-select">
                <input class="checkbox-input" @click="selected = !selected" type="checkBox" name="contact" value="02">
                <span class="checkbox-decoration">
                    <svg viewBox="0 0 12 12" class="checkbox-decorationMedia">
                        <g fill="none">
                            <polyline class="checkbox-check" points="1.65093994 3.80255127 4.48919678 6.97192383 10.3794556 0.717346191"></polyline>
                        </g>
                    </svg>
                </span>
            </span>
            <div class="card-actions">
                <span class="card-actionsSelect">
                  <img src="../assets/icons/common/options.svg">
                </span>
                <!-- {%include cards/card-dropdown.html%} -->
            </div>
            <div class="card-media">
                <img :src=map.thumbnailUrl />
            </div>
            <div class="card-text">
                <h2 class="card-title">{{map.name}}</h2>
                <p class="card-description">{{map.description}}</p>
                <ul class="card-metadata">
                    <li class="card-metadataItem">
                        <span class="icon"><img src="../assets/icons/maps/privacy/link.svg"></span>
                        <p>Shared with link</p>
                    </li>
                    <li class="card-metadataItem">
                        <span class="icon"><img src="../assets/icons/maps/calendar.svg"></span>
                        <p>{{map.updatedAt}}</p>
                    </li>
                    <li class="card-metadataItem">
                        <span class="icon"><img src="../assets/icons/maps/tag.svg"></span>
                        <ul class="card-tagList">
                          <li v-for="(tag, index) in map.tagList" :key="tag">
                            <a href="#">{{tag}}</a><span v-if="index < map.tagList.length - 1">,&nbsp;</span>
                          </li>
                          <li v-if="map.tagList.length <= 0">
                            <span>No tags</span>
                          </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'CardMap',
  components: {
  },
  data: function () {
    return {
      selected: false
    };
  },
  methods: {
    toggleSelection () {
      this.selected = !this.selected;
    }
  },
  props: {
    map: Object
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.card {
  position: relative;
  height: 100%;
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
  background-color: $white;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border: 1px solid rgba($textColor, 0.16);
    pointer-events: none;
  }

  &:hover {
    // background: rgba($primaryColor, 0.02);
    cursor: pointer;

    .card-title {
      color: $primaryColor;
    }

    .card-select,
    .card-actions {
      opacity: 1;
    }
  }

  &.selected {
    background-color: #F2F9FF;

    .card-actions,
    .card-select {
      opacity: 1;
    }
  }
}

.card--highlight {
  display: flex;

  .card-title {
    margin-bottom: 16px;
    font-size: 24px;
  }

  .card-description {
    height: 72px;
    margin-bottom: 32px;
    -webkit-line-clamp: 3;
  }

  .card-media {
    flex: 0 0 58.3331%;
    min-width: 58.3331%;
  }

  .card-text {
    padding: 24px 36px 24px 20px;
  }
}

.card-subtitle {
  margin-bottom: 4px;
  font: 600 10px/1.6 'Montserrat';
}

.card-text {
  padding: 24px 16px;
  color: $textColor;
}

.card-media {
  display: flex;
  height: 140px;
  overflow: hidden;

  img {
    width: 100%;
    object-fit: cover;
  }
}

.card-title {
  margin-bottom: 12px;
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
  font: 700 18px/1.4 'Montserrat';
}

.card-description {
  display: -webkit-box;
  display: block;
  height: 48px;
  margin-bottom: 8px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font: 400 16px/1.6 'Open Sans';
  text-overflow: ellipsis;
}

.card-metadataItem {
  display: flex;
  margin-bottom: 4px;
  font: 400 16px/1.6 'Open Sans';

  a {
    color: $textColor;
    text-decoration: none;
  }

  a:hover {
    color: $textColor;
    text-decoration: underline;
  }

  .icon {
    margin-top: 4px;
    margin-right: 8px;
  }
}

.card-metadataItem:last-child {
  margin-bottom: 0;
}

.card-select {
  position: absolute;
  top: 8px;
  left: 8px;
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  opacity: 0;
  background: $white;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:checked {
    opacity: 1;
    background: $primaryColor;
  }
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.card-actionsSelect {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: $white;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
}

.card-actionsContainer {
  position: absolute;
  z-index: 2;
  top: 32px;
  right: 0;
  border: 1px solid rgba($textColor, 0.08);
  border-radius: 2px;
  background: $white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.card-actionsListItem {
  width: 264px;
  border-bottom: 1px solid rgba($textColor, 0.08);
  font: 400 16px/1.6 'Open Sans';

  &:last-child {
    border-bottom: 0;
  }

  a {
    display: block;
    padding: 12px 24px;
    text-decoration: none;
  }
}

.card-development {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 36px 16px;
  background-color: $softblue;

  .card-developmentTitle {
    margin-bottom: 8px;
  }
}

.card-tagList > li {
  display: inline;
}
</style>
