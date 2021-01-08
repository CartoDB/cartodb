module HttpAuthenticationHelper
  def authenticated_header
    'auth_header'
  end

  def authentication_headers(value)
    { "#{authenticated_header}" => value }
  end

  def stub_http_header_authentication_configuration(field: 'email', autocreation: false, enabled: true)
    allow(Cartodb).to receive(:get_config)

    config = {
      'header' => authenticated_header,
      'field' => field,
      'autocreation' => autocreation
    }

    config.each do |f, v|
      allow(Cartodb).to receive(:get_config).with(:http_header_authentication, f).and_return(enabled ? v : nil)
    end

    config
  end
end
