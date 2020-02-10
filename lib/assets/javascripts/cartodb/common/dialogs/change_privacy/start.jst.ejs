<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
    <i class="CDB-IconFont CDB-IconFont-unlock"></i>
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-bSpace--m u-tSpace-xl"><%- vis.get('name') %> privacy</h4>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    Although we believe in the power of open data, you can also protect your <%- vis.isVisualization() ? 'map' : 'dataset' %>.
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
          <input class="js-password-input Input CDB-Text CDB-Size-medium ChangePrivacy-passwordInput u-altTextColor" placeholder="Type your password here" value="<%- password %>" type="password" autocomplete="off" disabled/>
        <% } else { %>
          <input class="js-password-input Input CDB-Text CDB-Size-medium ChangePrivacy-passwordInput u-altTextColor" placeholder="Type your password here" value="<%- password %>" type="password" autocomplete="off" />
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
        <p class="UpgradeElement-infoText u-ellipsLongText">To get advantage of all the privacy options you should upgrade your plan</p>
      </div>
      <div class="UpgradeElement-actions">
        <% if (showTrial) { %>
          <div class="UpgradeElement-trial">
            <i class="CDB-IconFont CDB-IconFont-gift UpgradeElement-trialIcon"></i>
            <p class="UpgradeElement-trialText u-ellipsLongText">14 days Free trial</p>
          </div>
        <% } %>
        <a href="<%- upgradeUrl %>" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton">
          <span>upgrade</span>
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
            Shared with your whole organization.
          <% } else { %>
            Shared with <%- sharedEntitiesCount %> <%- personOrPeopleStr %>.
          <% } %>
          <a href="#" class="js-share">Open sharing settings</a>
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
      <div class="DefaultParagraph DefaultParagraph--secondary CDB-Text CDB-Size-medium">Team work is always better. <a href="#" class="js-share">Share it with your colleagues</a></div>
    </div>
  <% } %>
<% } %>

<div class="CDB-Text Dialog-footer Dialog-footer--simple u-inner ChangePrivacy-startFooter">
  <button class="CDB-Button CDB-Button--secondary cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Cancel</span>
  </button>
  <button class="ok u-lSpace--xl CDB-Button CDB-Button--primary <%- saveBtnClassNames %>">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Save settings</span>
  </button>
</div>
