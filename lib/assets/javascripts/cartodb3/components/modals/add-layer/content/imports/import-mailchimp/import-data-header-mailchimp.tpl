<% if (state !== 'list' ) { %>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <% if (state === 'selected') { %>
      MailChimp campaign selected
    <% } else { %>
      Map your MailChimp Campaigns
    <% } %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor <% if (state === "error") { %>ImportPanel-headerDescription--negative<% } %>">
    <% if (state === "idle") { %>
      Connect your MailChimp account to select any of your campaigns.
    <% } %>
    <% if (state === "error") { %>
      We are sorry, It has been an error while connecting to your MailChimp account. Just in case it helps, be sure you have the pop-up blocker deactivated for this website.
    <% } %>
    <% if (state === "token") { %>
      Checking MailChimp Token.
    <% } %>
    <% if (state === "oauth") { %>
      Requesting oAuth.
    <% } %>
    <% if (state === "retrieving") { %>
      A list of your MailChimp campaigns will be displayed in a moment.
    <% } %>
    <% if (state === "selected") { %>
      Campaign selected.
    <% } %>
  </p>
  <% if (state === "selected") { %>
    <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
    </button>
  <% } %>
<% } %>
