<template>
  <a class="feedback" href="javascript:void(0)" @click.stop.prevent="handleClick">
    <div class="feedback__icon"></div>

    <div class="feedback__message">
      <p class="feedback__paragraph text is-small is-semibold">
        {{ $t('FeedbackMessage.title') }}
      </p>
      <p class="feedback__paragraph text is-small">
        {{ $t('FeedbackMessage.message') }}
      </p>
    </div>
  </a>
</template>

<script>
import storageAvailable from 'new-dashboard/utils/is-storage-available';

export default {
  name: 'FeedbackPopup',
  mounted () {
    if (storageAvailable('localStorage')) {
      this.markFeedbackPopupAsOpened();
    }
  },
  methods: {
    markFeedbackPopupAsOpened () {
      window.localStorage.setItem('carto.feedback.popupWasShown', JSON.stringify(true));
    },
    handleClick () {
      this.$emit('feedbackClick');
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.feedback {
  display: flex;
  width: 320px;
  padding: 16px;
  border-radius: 4px;
  background-color: $white;
  box-shadow: 0 4px 12px 0 $shadow-color;

  &:hover {
    text-decoration: none;
  }

  &::before {
    content: "";
    position: absolute;
    top: 2px;
    right: 0;
    width: 20px;
    height: 20px;
    transform: rotate(45deg) translateX(-50%);
    transform-origin: center center;
    border-radius: 4px;
    background-color: $white;
  }
}

.feedback__icon {
  position: relative;
  width: 48px;
  margin-right: 16px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: $primary-color;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 48px;
    height: 48px;
    background-image: url('../assets/icons/common/chat-bubble.svg');
    background-repeat: no-repeat;
    background-position: center;
  }
}

.feedback__message {
  flex: 1;
  color: $text-color;
}

.feedback__paragraph {
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
