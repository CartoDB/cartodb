require_dependency 'helpers/avatar_helper'

module FrontendConfigHelper
  include AvatarHelper
  include FullstoryHelper

  def frontend_config_hash(user = current_user)
    config = {
      app_assets_base_url:        app_assets_base_url,
      maps_api_template:          maps_api_template,
      sql_api_template:           sql_api_template,
      user_name:                  CartoDB.extract_subdomain(request),
      cartodb_com_hosted:         Cartodb.get_config(:cartodb_com_hosted),
      account_host:               CartoDB.account_host,
      trackjs_customer:           Cartodb.get_config(:trackjs, 'customer'),
      trackjs_enabled:            Cartodb.get_config(:trackjs, 'enabled'),
      trackjs_app_key:            Cartodb.get_config(:trackjs, 'app_keys', 'editor'),
      google_tag_manager_id:      Cartodb.get_config(:google_tag_manager, 'primary'),
      intercom_app_id:            Cartodb.get_config(:intercom, 'app_id'),
      fullstory_enabled:          fullstory_enabled?(user),
      fullstory_org:              Cartodb.get_config(:fullstory, 'org'),
      dropbox_api_key:            Cartodb.get_config(:dropbox_api_key),
      gdrive_api_key:             Cartodb.get_config(:gdrive, 'api_key'),
      gdrive_app_id:              Cartodb.get_config(:gdrive, 'app_id'),
      oauth_dropbox:              Cartodb.get_config(:oauth, 'dropbox', 'app_key'),
      oauth_box:                  Cartodb.get_config(:oauth, 'box', 'client_id'),
      oauth_gdrive:               Cartodb.get_config(:oauth, 'gdrive', 'client_id'),
      oauth_instagram:            Cartodb.get_config(:oauth, 'instagram', 'app_key'),
      oauth_mailchimp:            Cartodb.get_config(:oauth, 'mailchimp', 'app_key'),
      oauth_bigquery:             Cartodb.get_config(:oauth, 'bigquery', 'client_id'),
      bigquery_enabled:           Carto::Connector.provider_available?('bigquery', user),
      bigquery_available:         Carto::Connector.provider_public?('bigquery'),
      oauth_mechanism_bigquery:   Cartodb.get_config(:oauth, 'bigquery', 'oauth_mechanism'),
      arcgis_enabled:             Cartodb.get_config(:datasources, 'arcgis_enabled'),
      salesforce_enabled:         Cartodb.get_config(:datasources, 'salesforce_enabled'),
      mysql_enabled:              Cartodb.get_config(:connectors, 'mysql', 'enabled'),
      postgres_enabled:           Cartodb.get_config(:connectors, 'postgres', 'enabled'),
      sqlserver_enabled:          Cartodb.get_config(:connectors, 'sqlserver', 'enabled'),
      hive_enabled:               Cartodb.get_config(:connectors, 'hive', 'enabled'),
      datasource_search_twitter:  nil,
      max_asset_file_size:        Cartodb.get_config(:assets, 'max_file_size'),
      watcher_ttl:                Cartodb.get_config(:watcher, 'ttl') || 60,
      upgrade_url:                cartodb_com_hosted? ? false : user.try(:upgrade_url, request.protocol).to_s,
      licenses:                   Carto::License.all,
      data_library_enabled:       CartoDB::Visualization::CommonDataService.configured?,
      avatar_valid_extensions:    AVATAR_VALID_EXTENSIONS,
      app_name:                   Cartodb.get_config(:mailer, 'template', 'app_name') || 'CARTO'
    }

    if CartoDB::Hubspot::instance.enabled? && !CartoDB::Hubspot::instance.token.blank?
      config[:hubspot_token] = CartoDB::Hubspot::instance.token
      config[:hubspot_ids] = CartoDB::Hubspot::instance.event_ids.to_json.html_safe
      config[:hubspot_form_ids] = CartoDB::Hubspot::instance.form_ids
    end

    if Cartodb.get_config(:datasource_search, 'twitter_search', 'standard')
      search_url = Cartodb.get_config(:datasource_search, 'twitter_search', 'standard', 'search_url')
      config[:datasource_search_twitter] = search_url
    end

    if Cartodb.get_config(:graphite_public)
      config[:statsd_host] = Cartodb.get_config(:graphite_public, 'host')
      config[:statsd_port] = Cartodb.get_config(:graphite_public, 'port')
    end

    if Cartodb.get_config(:error_track)
      config[:error_track_url] = Cartodb.get_config(:error_track, 'url')
      config[:error_track_percent_users] = Cartodb.get_config(:error_track, 'percent_users')
    end

    if Cartodb.get_config(:static_image_upload_endpoint)
      config[:static_image_upload_endpoint] = Cartodb.get_config(:static_image_upload_endpoint)
    end

    if Cartodb.get_config(:cdn_url)
      config[:cdn_url] = Cartodb.get_config(:cdn_url)
    end

    if !Cartodb.get_config(:dataservices, 'enabled').nil?
      config[:dataservices_enabled] = Cartodb.get_config(:dataservices, 'enabled')
    end

    config
  end

  def frontend_config
    frontend_config_hash.to_json
  end
end
