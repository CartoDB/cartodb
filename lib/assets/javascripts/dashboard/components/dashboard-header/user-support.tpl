<% if (userType === 'org') { %>
  <a href="mailto:enterprise-support@carto.com" class="Header-navigationLink u-hideOnMobile">Support</a>
<% } else if (userType === 'client' || userType === 'internal') { %>
  <a href="mailto:support@carto.com" class="Header-navigationLink u-hideOnMobile">Support</a>
<% } else { %>
  <a href="http://gis.stackexchange.com/questions/tagged/carto" class="Header-navigationLink u-hideOnMobile">Support</a>
<% } %>
