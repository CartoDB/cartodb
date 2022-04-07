<template>
  <a class="notification" href="javascript:void(0)" @click="handleClick">
    <div class="notification__icon"><slot /></div>

    <div class="notification__message">
      <p class="notification__paragraph text is-small is-semibold">
        {{ title }}
      </p>

      <template v-for="(paragraph, index) in message">
        <p class="notification__paragraph text is-small" v-if="messageHasHTML" v-html="paragraph" :key="index"></p>
        <p class="notification__paragraph text is-small" v-else :key="index">{{ paragraph }}</p>
      </template>
    </div>
  </a>
</template>

<script>
export default {
  name: 'NotificationPopup',
  props: {
    title: String,
    message: Array,
    messageHasHTML: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick () {
      this.$emit('click');
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.notification {
  display: flex;
  width: 320px;
  padding: 16px;
  border-radius: 4px;
  background-color: $white;
  box-shadow: $dropdown__shadow;

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

.notification__icon {
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
    background-image: url('../../assets/icons/common/chat-bubble.svg');
    background-repeat: no-repeat;
    background-position: center;
  }
}

.notification__message {
  flex: 1;
  color: $text__color;
}

.notification__paragraph {
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
