<% if (googleTagManagerId) { %>
  <!-- Google Tag Manager -->
  <% // Tags for GTM are being included in _google_tag_manager.html.erb for Rails templates.
    // So if you change anything here, please make sure that you change it there too. %>

  <script>
    dataLayer = [{
      'userId': '<%= userId %>',
      'userJobRole': '<%= userAccountType %>',
      'userSignUpDate': '<%= userCreatedAtInSeconds %>'
    }];
  </script>

  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','<%= googleTagManagerId %>');</script>
  <!-- End Google Tag Manager -->
<% } %>

<% if (trackjsEnabled) { %>
  <script type='text/javascript'>
    window._trackJs = {
      enabled: true,
      application: '<%= trackjsAppKey %>',
      version: '<%= assetsVersion %>',
      userId: '<%= userName %>',
      token: '<%= trackjsCustomer %>'
    };
  </script>

  <script
    type='text/javascript'
    src='//d2zah9y47r7bi2.cloudfront.net/releases/current/tracker.js'
    data-token='<%= trackjsCustomer %>'>
  </script>
<% } %>

<% if (googleAnalyticsUa) { %>
  <script>
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', '<%= googleAnalyticsUa %>', {
      cookieDomain: '<%= googleAnalyticsDomain %>'
    });
    ga('set', 'Member Type', '<%= googleAnalyticsMemberType %>');
    ga('send', 'pageview');
  </script>
  <script async="" src='https://www.google-analytics.com/analytics.js'></script>
<% } %>

<% if (hubspotEnabled) { %>
  <script type='text/javascript'>
    window.hubspot_ids = <%= hubspotIds %>;

    (function(d,s,i,r) {
      if (d.getElementById(i)){return;}
      var n=d.createElement(s), e=d.getElementsByTagName(s)[0];
      n.id=i;
      n.src='//js.hs-analytics.net/analytics/'+(Math.ceil(new Date()/r)*r)+'/<%= hubspotToken %>.js';
      e.parentNode.insertBefore(n, e);
    })(document,'script','hs-analytics',300000);
  </script>
<% } %>

<% if (intercomEnabled) { %>
  <script type='text/javascript'>
    window.intercomSettings = {
      app_id: '<%= intercomAppId %>',
      email: '<%= userEmail %>'
    };
  </script>
  <script type='text/javascript'>
    (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',intercomSettings);}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;function l(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/<%= intercomAppId %>';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);}if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
  </script>
<% } %>

<% if (fullstoryEnabled) { %>
  <script type='text/javascript'>
    window['_fs_debug'] = false;
    window['_fs_host'] = 'www.fullstory.com';
    window['_fs_org'] = '<%= fullstoryOrg %>';
    window['_fs_namespace'] = 'FS';
    (function(m,n,e,t,l,o,g,y){
        if (e in m && m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].'); return;}
        g=m[e]=function(a,b){g.q?g.q.push([a,b]):g._api(a,b);};g.q=[];
        o=n.createElement(t);o.async=1;o.src='https://'+_fs_host+'/s/fs.js';
        y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
        g.identify=function(i,v){g(l,{uid:i});if(v)g(l,v)};g.setUserVars=function(v){g(l,v)};
        g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
        g.clearUserCookie=function(c,d,i){if(!c || document.cookie.match('fs_uid=[`;`]*`[`;`]*`[`;`]*`')){
        d=n.domain;while(1){n.cookie='fs_uid=;domain='+d+
        ';path=/;expires='+new Date(0).toUTCString();i=d.indexOf('.');if(i<0)break;d=d.slice(i+1)}}};
    })(window,document,window['_fs_namespace'],'script','user');
    FS.clearUserCookie();
    FS.identify('<%= userName %>', {
      displayName: '<%= userName %>',
      email: '<%= userEmail %>'
    });
  </script>
  <% } %>
