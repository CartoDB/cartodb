import Vue from 'vue';
import BackgroundPollingView from '@/components/BackgroundPollingView';

describe('HelloWorld.vue', () => {
  it('should render correct contents', () => {
    const Constructor = Vue.extend(BackgroundPollingView);
    const vm = new Constructor().$mount();
    console.log(vm.$el);
    expect(vm.$el.querySelector('.hello h1').textContent).toEqual('Welcome to Your Vue.js App');
  })
})
