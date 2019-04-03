<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
    <i class="CDB-IconFont CDB-IconFont-unlock"></i>
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-bSpace--m u-tSpace-xl"><%- vis.get('name') %><%= _t('dashboard.views.dashboard.dialogs.change_privacy.privacy') %></h4>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- vis.isVisualization() ? _t('dashboard.views.dashboard.dialogs.change_privacy.protect_map') : _t('dashboard.views.dashboard.dialogs.change_privacy.protect_dataset') %>.
  </p>
</div>
<div class="CDB-Text Dialog-body u-inner OptionCards">
  <% privacyOptions.each(function(m, index) { %>
    <div class="OptionCard OptionCard--blocky <%- m.classNames() %> js-option" data-index="<%- index %>">
      <div class="OptionCard-icon IllustrationIcon IllustrationIcon--<%- m.get('illustrationType') %>">
        <i class="CDB-IconFont CDB-IconFont-<%- m.get('iconFontType') %>"></i>
      </div>
      <h5 class="OptionCard-title OptionCard-title CDB-Text CDB-Size-large"><%- m.get('title') %></h5>
      <% if (m.get('privacy') == 'PASSWORD') { %>
        <% if (m.get('disabled')) { %>
          <input class="js-password-input Input CDB-Text CDB-Size-medium ChangePrivacy-passwordInput u-altTextColor" placeholder="<%= _t('dashboard.views.dashboard.dialogs.change_privacy.placeholder') %>" value="<%- password %>" type="password" disabled/>
        <% } else { %>
          <input class="js-password-input Input CDB-Text CDB-Size-medium ChangePrivacy-passwordInput u-altTextColor" placeholder="<%= _t('dashboard.views.dashboard.dialogs.change_privacy.placeholder') %>" value="<%- password %>" type="password" />
        <% } %>
      <% } else { %>
      <div class="OptionCard-desc CDB-Text CDB-Size-medium u-altTextColor"><%- m.get('desc') %></div>
      <% } %>
    </div>
  <% }); %>
</div>

<% if (showUpgradeBanner) { %>
  <div class="CDB-Text Dialog-body u-inner ChangePrivacy-upgradeBanner">
    <div class="UpgradeElement ChangePrivacy-upgradeBannerInner">
      <div class="UpgradeElement-info">
        <p class="UpgradeElement-infoText u-ellipsLongText"><%= _t('dashboard.views.dashboard.dialogs.change_privacy.advantage') %></p>
      </div>
      <div class="UpgradeElement-actions">
        <% if (showTrial) { %>
          <div class="UpgradeElement-trial">
            <i class="CDB-IconFont CDB-IconFont-gift UpgradeElement-trialIcon"></i>
            <p class="UpgradeElement-trialText u-ellipsLongText"><%= _t('dashboard.views.dashboard.dialogs.change_privacy.trial') %></p>
          </div>
        <% } %>
        <a href="<%- upgradeUrl %>" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton">
          <span><%= _t('dashboard.views.dashboard.dialogs.change_privacy.upgrade') %></span>
        </a>
      </div>
    </div>
  </div>
<% } %>

<% if (showShareBanner) { %>
  <% if (sharedEntitiesCount > 0) { %>
    <div class="CDB-Text Dialog-body u-inner ChangePrivacy-shareBanner Dialog-affectedEntities">
      <div class="Dialog-affectedEntities">
        <div class="LayoutIcon ChangePrivacy-shareBannerIcon">
          <i class="CDB-IconFont CDB-IconFont-people CDB-IconFont--super"></i>
          <span class="Badge Dialog-headerIconBadge"><%- sharedEntitiesCount %></span>
        </div>
        <div class="DefaultParagraph DefaultParagraph--secondary">
          <% if (sharedWithOrganization) { %>
            <%= _t('dashboard.views.dashboard.dialogs.change_privacy.shared_with_org') %>
          <% } else { %>
            <%= _t('dashboard.views.dashboard.dialogs.change_privacy.shared_with', {smart_count: sharedEntitiesCount}) %>
          <% } %>
          <a href="#" class="js-share"><%= _t('dashboard.views.dashboard.dialogs.change_privacy.open_sharing') %></a>
        </div>
      </div>
      <div class="u-flex">
        <% sharedEntitiesSample.forEach(function(user) { %>
          <span class="UserAvatar Dialog-sharedEntitiesAvatar u-lSpace--xl">
            <% if (user.get('avatar_url')) { %>
              <img class="UserAvatar-img UserAvatar-img--medium" src="<%- user.get('avatar_url') %>" alt="<%- user.get('name') || user.get('username') %>" title="<%- user.get('name') || user.get('username') %>" />
            <% } else { %>
              <div class="UserAvatar-img UserAvatar-img--medium UserAvatar-img--no-src" title="<%- user.get('name') || user.get('username') %>"></div>
            <% } %>
          </span>
        <% }); %>
        <% if (sharedEntitiesCount > sharedEntitiesSampleCount) { %>
          <div class="UserAvatar Dialog-sharedEntitiesAvatar">
            <span class="UserAvatar-img UserAvatar-img--medium UserAvatar--moreItems" />
          </div>
        <% } %>
      </div>
    </div>
  <% } else { %>
    <div class="Dialog-body u-inner ChangePrivacy-shareBanner">
      <div class="LayoutIcon ChangePrivacy-shareBannerIcon">
        <i class="CDB-IconFont CDB-IconFont-people CDB-IconFont--super"></i>
      </div>
      <div class="DefaultParagraph DefaultParagraph--secondary CDB-Text CDB-Size-medium"><%= _t('dashboard.views.dashboard.dialogs.change_privacy.team_work') %></div>
    </div>
  <% } %>
<% } %>

<div class="CDB-Text Dialog-footer Dialog-footer--simple u-inner ChangePrivacy-startFooter">
  <button class="CDB-Button CDB-Button--secondary cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.dialogs.change_privacy.cancel') %></span>
  </button>
  <button class="ok u-lSpace--xl CDB-Button CDB-Button--primary <%- saveBtnClassNames %>">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.dialogs.change_privacy.save') %></span>
  </button>
</div>
