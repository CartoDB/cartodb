module MailerConfig
  def app_link
    Cartodb.get_config(:mailer, 'template', 'app_link') || 'https://carto.com'
  end

  def app_name
    Cartodb.get_config(:mailer, 'template', 'app_name') || 'CARTO'
  end

  def support_link
    Cartodb.get_config(:mailer, 'template', 'support_link') || 'mailto:support@carto.com'
  end
end
