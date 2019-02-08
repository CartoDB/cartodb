<template>
  <a class="feedback" href="https://carto.com">
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
export default {
  name: 'FeedbackPopup',
  methods: {}
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.feedback {
  display: flex;
  width: 320px;
  padding: 16px;
  border-radius: 4px;
  background-color: #00D851;

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
    background-color: #00D851;
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
    background: $white;
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
  color: $white;
}

.feedback__paragraph {
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
