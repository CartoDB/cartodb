<div class="OnBoarding-map js-onboarding-map CDB-Text"></div>
<div class='OnBoarding-welcome'>
  <div class="OnBoarding-welcomeContent OnBoarding-welcomeContent--wide">
    <div class="CDB-Text OnBoarding-welcomeContentInner">
      <h4 class="OnBoarding-welcomeContentTitle OnBoarding-welcomeContentMargin"><%= _t('dashboard.views.dashboard.onboarding.hello') %><%- username %>!</h4>
      <p class="OnBoarding-welcomeContentText OnBoarding-welcomeContentMargin"><%= _t('dashboard.views.dashboard.onboarding.welcome') %></p>
      <% if(hasCreateMapsFeature) { %>
        <p class="OnBoarding-welcomeContentText OnBoarding-welcomeContentMargin"><%= _t('dashboard.views.dashboard.onboarding.drag_your_data') %></p>
        <button class="CDB-Button CDB-Button--primary u-tSpace-xl js-createMap track-onboarding--newMap">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.onboarding.new_map') %></span>
        </button>
      <% } %>
    </div>
    <div class="OnBoarding-importAnimation"></div>
  </div>
</div>
