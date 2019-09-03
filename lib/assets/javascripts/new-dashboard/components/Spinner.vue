<template>
  <div class="spinner"></div>
</template>

<script>
export default {
  name: 'Spinner'
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.spinner {
  position: relative;
  margin: 0 auto;
  border-top: 2px solid #ddd;
  border-right: 2px solid #ddd;
  border-bottom: 2px solid #ddd;
  border-left: 2px solid #0090d7;
  -webkit-animation: load8 1.1s infinite linear;
  -khtml-animation: load8 1.1s infinite linear;
  -moz-animation: load8 1.1s infinite linear;
  -ms-animation: load8 1.1s infinite linear;
  -o-animation: load8 1.1s infinite linear;
  animation: load8 1.1s infinite linear;
}

.spinner,
.spinner:after {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
</style>
