<template>
  <div class="solutions-card grid">
    <div class="grid-cell--col4 grid-cell--col12--mobile left-column">
      <div>
        <slot name="icon"></slot>
        <h3 class="title is-body is-txtBaseGrey card-title">{{title}}</h3>
        <p class="text is-caption is-caption--mobile is-txtBaseGrey card-description">{{description}}</p>
      </div>
      <a :href=infoUrl class="buttonLink card-link is-txtGrey u-no-decoration">{{ $t(`SolutionCard.moreExamples`) }}</a>
    </div>
    <div class="grid-cell--col8 grid-cell--col12--mobile right-column">
      <div class="image-solutions-map">
        <slot name="image"></slot>
      </div>
      <div class="demo-image-overlay">
        <p class="text is-caption is-caption--mobile is-txtBaseGrey">{{ $t(`SolutionCard.usedBy`) }}</p>
        <div class="u-flex logos">
          <slot name="demo-logos"></slot>
        </div>
        <a :href=demoUrl target="_blank" rel="noopener noreferrer" class="button card-demo-button u-no-decoration">
          <span>{{ $t(`SolutionCard.goDemo`) }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SolutionCard',
  props: {
    title: String,
    description: String,
    demoUrl: String,
    infoUrl: String
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.solutions-card {
  justify-content: space-between;
  min-height: 420px;
  overflow: hidden;
  border-radius: 2px;
  background-color: $white;
}

.logos {
  @media (max-width: $layout-mobile) {
    margin-top: 16px;
    margin-bottom: 24px;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  border-right: 1px solid #EAEDF7;
  text-align: center;

  @media (max-width: $layout-mobile) {
    padding: 24px 16px;
    border: 0;
  }
}

.right-column {
  position: relative;
  min-height: 180px;
}

.image-solutions-map {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;

  img {
    min-width: 100%;
    min-height: 100%;
    object-fit: cover;
  }

  @media (max-width: $layout-mobile) {
    position: relative;
    height: 180px;
  }
}

.demo-image-overlay {
  display: flex;
  position: absolute;
  bottom: 16px;
  left: 16px;
  align-items: center;
  width: calc(100% - 32px);
  padding: 16px;
  background-color: $white;

  @media (max-width: $layout-mobile) {
    display: block;
    position: relative;
    bottom: 0;
    left: 0;
    width: 100%;
  }
}

.demo-card-logo {
  max-height: 24px;
  margin-left: 24px;

  @media (max-width: $layout-mobile) {
    &:first-of-type {
      margin-left: 0;
    }
  }
}

.card-title {
  margin-top: 12px;
}

.card-description {
  margin-top: 8px;
}

.card-link {
  margin-top: 24px;
}

.card-demo-button {
  margin-left: auto;
}
</style>
