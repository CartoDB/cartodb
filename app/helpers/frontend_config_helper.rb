require_dependency 'helpers/avatar_helper'

module FrontendConfigHelper
  include AvatarHelper
  include FullstoryHelper

  UPGRADE_LINK_ACCOUNT = 'PERSONAL30'.freeze

  def frontend_config_hash(user = current_user)
    config = {
      app_assets_base_url:        app_assets_base_url,
      maps_api_template:          maps_api_template,
      sql_api_template:           sql_api_template,
      user_name:                  CartoDB.extract_subdomain(request),
      cartodb_com_hosted:         Cartodb.config[:cartodb_com_hosted].present?,
      account_host:               CartoDB.account_host,
      trackjs_customer:           Cartodb.get_config(:trackjs, 'customer'),
      trackjs_enabled:            Cartodb.get_config(:trackjs, 'enabled'),
      trackjs_app_key:            Cartodb.get_config(:trackjs, 'app_keys', 'editor'),
      google_analytics_ua:        Cartodb.get_config(:google_analytics, 'primary'),
      google_analytics_domain:    Cartodb.get_config(:google_analytics, 'domain'),
      google_tag_manager_id:      Cartodb.get_config(:google_tag_manager, 'primary'),
      hubspot_enabled:            CartoDB::Hubspot::instance.enabled?,
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
      arcgis_enabled:             Cartodb.get_config(:datasources, 'arcgis_enabled'),
      salesforce_enabled:         Cartodb.get_config(:datasources, 'salesforce_enabled'),
      datasource_search_twitter:  nil,
      max_asset_file_size:        Cartodb.config[:assets]["max_file_size"],
      watcher_ttl:                Cartodb.config[:watcher].try("fetch", 'ttl', 60),
      upgrade_url:                cartodb_com_hosted? ? false : user.try(:upgrade_url, request.protocol).to_s,
      licenses:                   Carto::License.all,
      data_library_enabled:       CartoDB::Visualization::CommonDataService.configured?,
      avatar_valid_extensions:    AVATAR_VALID_EXTENSIONS
    }

    if CartoDB::Hubspot::instance.enabled? && !CartoDB::Hubspot::instance.token.blank?
      config[:hubspot_token] = CartoDB::Hubspot::instance.token
      config[:hubspot_ids] = CartoDB::Hubspot::instance.event_ids.to_json.html_safe
      config[:hubspot_form_ids] = CartoDB::Hubspot::instance.form_ids
    end

    if Cartodb.config[:datasource_search].present? && Cartodb.config[:datasource_search]['twitter_search'].present? \
      && Cartodb.config[:datasource_search]['twitter_search']['standard'].present?
      config[:datasource_search_twitter] = Cartodb.config[:datasource_search]['twitter_search']['standard']['search_url']
    end

    if Cartodb.config[:graphite_public].present?
      config[:statsd_host] = Cartodb.config[:graphite_public]['host']
      config[:statsd_port] = Cartodb.config[:graphite_public]['port']
    end

    if Cartodb.config[:error_track].present?
      config[:error_track_url] = Cartodb.config[:error_track]["url"]
      config[:error_track_percent_users] = Cartodb.config[:error_track]["percent_users"]
    end

    if Cartodb.config[:static_image_upload_endpoint].present?
      config[:static_image_upload_endpoint] = Cartodb.config[:static_image_upload_endpoint]
    end

    if Cartodb.config[:cdn_url].present?
      config[:cdn_url] = Cartodb.config[:cdn_url]
    end

    if !Cartodb.get_config(:dataservices, 'enabled').nil?
      config[:dataservices_enabled] = Cartodb.get_config(:dataservices, 'enabled')
    end

    if CartoDB.account_host.present? && show_account_update_url(user)
      config[:account_update_url] = "#{CartoDB.account_host}"\
                                    "#{CartoDB.account_path}/"\
                                    "#{user.username}/update_payment"
    end

    config
  end

  def frontend_config
    frontend_config_hash.to_json
  end

  def show_account_update_url(user)
    user && user.account_type.casecmp(UPGRADE_LINK_ACCOUNT).zero?
  end
end
