<template>
  <div class="solutions-card grid">
    <div class="grid-cell--col4 grid-cell--col12--mobile left-column">
      <div>
        <slot name="solution-icon"></slot>
        <h3 class="title is-body is-txtBaseGrey card-title">{{title}}</h3>
        <p class="text is-caption is-caption--mobile is-txtBaseGrey card-description">{{description}}</p>
      </div>
      <a :href=infoUrl class="buttonLink card-link is-txtGrey u-no-decoration">{{ $t(`solutionsCard.moreExamples`) }}</a>
    </div>
    <div class="grid-cell--col8 grid-cell--col12--mobile right-column">
      <div class="image-solutions-map">
        <slot name="image"></slot>
      </div>
      <div class="demo-image-overlay">
        <p class="text is-caption is-caption--mobile is-txtBaseGrey">{{ $t(`solutionsCard.usedBy`) }}</p>
        <div class="u-flex logos">
          <slot name="demo-logos"></slot>
        </div>
        <a :href=demoUrl target="_blank" class="button card-demo-button u-no-decoration">
          <span>{{ $t(`solutionsCard.goDemo`) }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SolutionsCard',
  props: {
    title: String,
    description: String,
    demoUrl: String,
    infoUrl: String
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.solutions-card {
  justify-content: space-between;
  min-height: 420px;
  overflow: hidden;
  transition: box-shadow 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
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
  position: absolute;
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

//Icon animations
.solutions-card {
  #marker,
  .marker {
    animation: 2s slidein infinite linear;
    animation-play-state: paused;
  }

  #cloud02,
  .cloud--02 {
    animation: 20s move infinite alternate linear;
    animation-play-state: paused;
  }

  #cloud01,
  .cloud--01 {
    animation: 40s move infinite alternate linear;
    animation-play-state: paused;
  }

  #sun {
    transform-origin: 42px 42px;
    animation: 60s rotate infinite linear;
    animation-play-state: paused;
  }

  .plane {
    animation: 0.5s flying infinite alternate linear;
    animation-play-state: paused;
  }

  .user {
    animation: 2s user infinite alternate linear;
    animation-play-state: paused;
  }
}

.solutions-card {
  &:hover {
    #marker,
    .marker {
      animation-play-state: running;
    }

    .marker--01 {
      animation-delay: 1s;
    }

    .marker--02 {
      animation-delay: 2s;
    }

    #cloud02,
    .cloud--02 {
      animation-play-state: running;
    }

    #cloud01,
    .cloud--01 {
      animation-play-state: running;
    }

    .sun {
      animation-play-state: running;
    }

    .plane {
      animation-play-state: running;
    }

    .user {
      animation-play-state: running;
    }

    .user--01 {
      animation-delay: 0s;
    }

    .user--02 {
      animation-delay: 1.5s;
    }

    .user--03 {
      animation-delay: 2.5s;
    }
  }
}

@keyframes flying {
  0% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 1px, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes user {
  0% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 12px, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes slidein {
  0% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 20px, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes move {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(-100%, 0, 0);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
