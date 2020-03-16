module Carto::OauthServices
  OAUTH_SERVICE_TITLES = {
    'gdrive' => 'Google Drive',
    'dropbox' => 'Dropbox',
    'box' => 'Box',
    'mailchimp' => 'MailChimp',
    'instagram' => 'Instagram',
    'bigquery' => 'Google BigQuery'
  }.freeze

  OAUTH_SERVICE_REVOKE_URLS = {
    'mailchimp' => 'http://admin.mailchimp.com/account/oauth2/',
    'instagram' => 'http://instagram.com/accounts/manage_access/'
  }.freeze

  def get_oauth_services
    datasources = CartoDB::Datasources::DatasourcesFactory.get_all_oauth_datasources
    array = []

    datasources.each do |serv|
      obj ||= Hash.new

      title = OAUTH_SERVICE_TITLES.fetch(serv, serv)
      revoke_url = OAUTH_SERVICE_REVOKE_URLS.fetch(serv, nil)
      enabled = case serv
                when 'gdrive'
                  Cartodb.get_config(:oauth, serv, 'client_id')
                when 'box'
                  Cartodb.get_config(:oauth, serv, 'client_id')
                when 'dropbox'
                  Cartodb.get_config(:oauth, serv, 'app_key')
                when 'mailchimp'
                  Cartodb.get_config(:oauth, serv, 'app_key') && has_feature_flag?('mailchimp_import')
                when 'instagram'
                  Cartodb.get_config(:oauth, serv, 'app_key') && has_feature_flag?('instagram_import')
                when 'bigquery'
                  Cartodb.get_config(:oauth, serv, 'client_id') &&
                  Carto::Connector.provider_available?('bigquery', self)
                else
                  true
                end

      if enabled
        oauth = oauths.select(serv)

        obj['name'] = serv
        obj['title'] = title
        obj['revoke_url'] = revoke_url
        obj['connected'] = !oauth.nil? ? true : false

        array.push(obj)
      end
    end

    array
  end
end
