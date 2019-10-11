<template>
  <div class="u-width--100 u-pt--32 u-pr--10 u-pb--80 u-pl--10">
    <div class="circle"></div>
    <div class="placeholder">
      <img class="placeholder__img" src="../../../../assets/images/onboarding/cartoframes@2x.png"/>
      <div class="placeholder__shadow"></div>
    </div>

    <ul class="tag__list">
      <li class="tag__item title">Python</li>
      <li class="tag__item title">CARTOframes</li>
    </ul>
    <h1 v-html="$t(`Wizards.cartoframes.step1.title`)" class="heading title is-subheader"></h1>

    <div class="block">
      <StepTitle :title="$t(`Wizards.cartoframes.sections.summary`)">
        <template slot="icon">
            <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
        </template>
      </StepTitle>
      <ul class="list">
        <li class="list__item text" v-html="$t(`Wizards.cartoframes.step1.text1`)"></li>
        <li class="list__item text" v-html="$t(`Wizards.cartoframes.step1.text2`)"></li>
        <li class="list__item text" v-html="$t(`Wizards.cartoframes.step1.text3`)"></li>
      </ul>
    </div>

    <div class="block">
      <StepTitle :title="$t(`Wizards.cartoframes.sections.howto`)">
        <template slot="icon">
            <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
        </template>
      </StepTitle>
      <CodeBlock :code="codeBlock1" language="python" :lineNumbers="false" :theme="'default'"></CodeBlock>
      <InjectableIframe :content="map" width="100%" height="416"></InjectableIframe>
    </div>

    <div class="footer hangar">
      <a href="https://carto.com/developers/cartoframes/" class="underlined-link title is-caption is-txtCartoframes"><span>Go to dashboard</span></a>
      <a href="https://carto.com/developers/cartoframes/" class="button button--arrow is-cartoframes"><span>Check the documentation</span></a>
    </div>
  </div>
</template>

<script>
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle.vue';
import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import InjectableIframe from 'new-dashboard/components/InjectableIframe';
import map from 'new-dashboard/assets/resources/onboarding/cartoframes.html';

export default {
  name: 'Step1',
  stepName: 'Add spatial data to your data science workflow',
  components: {
    StepTitle,
    CodeBlock,
    InjectableIframe
  },
  data () {
    return {
      codeBlock1,
      map
    };
  }
};

const codeBlock1 =
`from cartoframes.contrib import vector
vector.vmap([
  vector.Layer('world_ports', strokeWidth=0.5, strokeColor='black', size=3, color='#0ab96b')
], context=cc)`;

</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
@import 'new-dashboard/styles/hangar/_variables';

.circle {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 120vw;
  height: 120vw;
  transform: translate(44vw, -71.5vw);
  border-radius: 50%;
  background-color: $cartoframes;
}

.placeholder {
  position: absolute;
  left: 50%;
  transform: translate(-70px, -10px);

  &__img {
    width: 460px;
    height: auto;
  }

  &__shadow {
    position: absolute;
    z-index: -1;
    top: 24px;
    left: 24px;
    width: 412px;
    height: 326px;
    opacity: 0.24;
    background: $neutral--800;
    filter: blur(24px);
  }
}

.tag {
  &__list {
    margin-bottom: 40px;
  }

  &__item {
    display: inline-block;
    position: relative;
    margin-right: 16px;
    padding: 7px 16px;
    border-radius: 18px;
    background-color: rgba($cartoframes, 0.08);
    color: $cartoframes;
    font-size: 10px;
    text-transform: uppercase;

    &::before {
      content: '';
      display: block;
      position: absolute;
      z-index: -1;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 18px;
      background-color: #FFF;
    }
  }
}

.heading {
  max-width: 300px;
  margin-bottom: 150px;
}

.block {
  margin-bottom: 96px;
}

.list {
  padding-left: 16px;

  &__item {
    display: flex;
    align-items: center;
    font-size: 16px;
    line-height: 38px;

    &::before {
      content: '\00b7';
      margin-right: 8px;
      font-size: 60px;
    }
  }
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/*.button {
    display: inline-block;
    border-radius: 8px;
    font: 600 16px/24px Montserrat,"Helvetica Neue",Helvetica,Arial,sans-serif;
    padding: 16px 24px;
    text-align: center;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
    background-color: $cartoframes;
}

.button--arrow span:after {
  content: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAyMCAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgPHBhdGggZD0iTS0yLTdoMjR2MjRILTJ6Ii8+CiAgICA8cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTQuNzA3LjI5M2wtMS40MTQgMS40MTRMMTUuNTg2IDRIMHYyaDE1LjU4NmwtMi4yOTMgMi4yOTMgMS40MTQgMS40MTRMMTkuNDE0IDV6Ii8+CiAgPC9nPgo8L3N2Zz4=");
  margin-left: 12px;
}

.button--link {
  display: inline-block;
  padding: 16px 0;
  font-family: "Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: $cartoframes;
}*/
</style>
