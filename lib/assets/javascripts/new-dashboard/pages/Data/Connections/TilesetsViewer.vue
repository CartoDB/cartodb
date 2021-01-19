<template>
  <div ref="viewer">HOLA MUNDO</div>
</template>

<script>


import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '@carto/viewer/src/App.js';
import Home from '@carto/viewer/src/components/views/Home';
import { useNavigate } from 'react-router-dom';
import { initialState, oauthInitialState } from '@carto/viewer/src/config/initialStateSlice';
import configureAppStore from '@carto/viewer/src/config/store';
import * as serviceWorker from '@carto/viewer/src/serviceWorker';

import { createCartoSlice, createOauthCartoSlice } from '@carto/react/redux';

const store = configureAppStore();

store.reducerManager.add('carto', createCartoSlice(initialState));
store.reducerManager.add('oauth', createOauthCartoSlice(oauthInitialState));

serviceWorker.unregister();

export default {
  name: 'TilesetsViewer',
  components: {},
  props: {},
  data () {
    return {};
  },
  computed: {},
  methods: {},
  mounted () {
    // var App = require('@carto/viewer/src/App.js');
    ReactDOM.render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes basename="/dashboard/datasets/tilesets/1">
            <App />
          </Routes>
        </BrowserRouter>
      </Provider>,
      this.$refs.viewer
    );
    // ReactDOM.render(
    //   <Provider store={store}>
    //     <Home />
    //   </Provider>,
    //   this.$refs.viewer
    // );
    let navigate = useNavigate();
    navigate('success');
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.viewer {
  height: 500px;
}
</style>
