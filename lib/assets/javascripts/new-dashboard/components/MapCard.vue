<template>
    <div class="grid-cell grid-cell--col4">
        <div class="card" v-bind:class="{selected: selected}">
            <span class="checkbox card-select" style="margin-right: 20px;">
                <input class="checkbox-input" v-on:click="selected = !selected" type="checkBox" name="contact" value="02">
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
                          <li v-for="(tag, index) in map.tagList" :key="tag.id">
                            <a href="#">{{tag}}</a><span v-if="index < map.tagList.length - 1">,&nbsp;</span>
                          </li>
                          <li v-if="map.tagList.length <= 0">
                            <a>No tags</a>
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
  data: function (){
    return {
      selected: Boolean = false
    }
  },
  props: {
      map: Object
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.card {
  position: relative;
  transition: background 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
  background-color: $white;
  height: 100%;
  &:after {
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
  &.selected{
    background-color: #F2F9FF;
    .card-actions,
    .card-select{
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
    margin-bottom: 32px;
    height: 72px;
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
  font: 600 10px/1.6 'Montserrat';
  margin-bottom: 4px;
}

.card-text {
  padding: 24px 16px;
  color: $textColor;
}
.card-media {
  height: 140px;
  display: flex;
  overflow: hidden;
  img {
    width: 100%;
    object-fit: cover;
  }
}
.card-title {
  font: 700 18px/1.4 'Montserrat';
  margin-bottom: 12px;
  transition: background 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
.card-description {
  font: 400 16px/1.6 'Open Sans';
  margin-bottom: 8px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 48px;
  display: block;
  display: -webkit-box;
}
.card-metadataItem {
  margin-bottom: 4px;
  font: 400 16px/1.6 'Open Sans';
  display: flex;
  a {
    color: $textColor;
    text-decoration: none;
  }
  a:hover {
    color: $textColor;
    text-decoration: underline;
  }
  .icon {
    margin-right: 8px;
    margin-top: 4px;
  }
}
  .card-metadataItem:last-child {
    margin-bottom: 0;
  }

.card-select {
  position: absolute;
  top: 8px;
  left: 8px;
  opacity: 0;
  transition: opacity 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
  background: $white;
  border-radius: 4px;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  &:focus {
    outline: none;
  }
  &:checked {
    background: $primaryColor;
    opacity: 1;
  }
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
.card-actionsSelect {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $white;
  border-radius: 4px;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
}

.card-actionsContainer {
  position: absolute;
  top: 32px;
  right: 0;
  background: $white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  border: 1px solid rgba($textColor, 0.08);
  z-index: 2;
}
.card-actionsListItem {
  border-bottom: 1px solid rgba($textColor, 0.08);
  width: 264px;
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

.card-development{
  background-color: $softblue;
  padding: 36px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .card-developmentTitle{
      margin-bottom: 8px;
  }
}

.card-tagList > li{
  display: inline;
}
</style>
