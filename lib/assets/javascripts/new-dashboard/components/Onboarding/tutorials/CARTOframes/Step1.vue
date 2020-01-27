<template>
  <div class="u-width--100 u-pt--32 u-pr--10 u-pb--80 u-pl--10">
    <div class="circle"></div>
    <div class="placeholder">
      <div class="placeholder__img"></div>
      <div class="placeholder__shadow"></div>
    </div>

    <ul class="tag__list">
      <li class="tag__item title">Python</li>
      <li class="tag__item title">CARTOframes</li>
    </ul>
    <h1 v-html="$t(`Wizards.cartoframes.step1.title`)" class="heading title is-subheader"></h1>

    <div class="block">
      <StepTitle :title="$t(`Wizards.cartoframes.step1.sections.summary`)">
        <template slot="icon">
            <img svg-inline src="../../../../assets/icons/onboarding/summary.svg"/>
        </template>
      </StepTitle>
      <ul class="list">
        <li class="list__item text">
          <span>{{ $t(`Wizards.cartoframes.step1.text1`) }}</span>
        </li>
        <li class="list__item text">
          <span>{{ $t(`Wizards.cartoframes.step1.text2`) }}</span>
        </li>
        <li class="list__item text">
          <span>{{ $t(`Wizards.cartoframes.step1.text3`) }}</span>
        </li>
        <li class="list__item text">
          <span>{{ $t(`Wizards.cartoframes.step1.text4`) }}</span><span class="u-ml--4 is-italic">{{ $t(`Wizards.cartoframes.step1.text5`) }}</span>
        </li>
      </ul>
    </div>

    <div class="block">
      <StepTitle :title="$t(`Wizards.cartoframes.step1.sections.howto`)">
        <template slot="icon">
            <img svg-inline src="../../../../assets/icons/onboarding/howto.svg"/>
        </template>
      </StepTitle>
      <CodeBlock :code="codeBlock1" language="python" :lineNumbers="false" theme="default"></CodeBlock>
      <InjectableIframe :content="map" width="100%" height="436"></InjectableIframe>
    </div>

    <div class="footer hangar">
      <button class="underlined-link title is-caption is-txtCartoframes" @click="goToDashboard">
        <span>{{ $t('Wizards.cartoframes.step1.footer.returnToDashboard') }}</span>
      </button>
      <a href="https://carto.com/developers/cartoframes/" class="button button--arrow is-cartoframes" target="_blank" rel="noopener noreferrer" @click="goToDashboard">
        <span>{{ $t('Wizards.cartoframes.step1.footer.learnMore') }}</span>
      </a>
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
  },
  methods: {
    goToDashboard () {
      this.$router.push({ name: 'home' });
    }
  }
};

const codeBlock1 =
`from cartoframes.auth import set_default_credentials
from cartoframes.data.observatory import Enrichment
from cartoframes.data.services import Geocoding, Isolines
from cartoframes.viz import Map, color_continuous_style, size_continuous_style
import pandas as pd

set_default_credentials('creds.json')

stores_df = pd.read_csv('http://libs.cartocdn.com/cartoframes/files/starbucks_brooklyn.csv')
stores_gdf, _ = Geocoding().geocode(stores_df, street='address')
aoi_gdf, _ = Isolines().isochrones(stores_gdf, [15*60], mode='walk')
aoi_enriched_gdf = Enrichment().enrich_polygons(aoi_gdf, ['total_pop_3cf008b3'])

result_map = Map([
    Layer(aoi_enriched_gdf, color_continuous_style('total_pop', stroke_width=0, opacity=0.7)),
    Layer(stores_gdf, size_continuous_style('revenue', stroke_color='white'), default_widget=True)
])`;

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
    height: 330px;
    border-radius: 4px;
    background-image: url('../../../../assets/images/onboarding/cartoframes@2x.png');
    background-size: cover;
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
</style>
