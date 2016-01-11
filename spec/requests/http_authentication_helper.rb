module HttpAuthenticationHelper
  def authenticated_header
    'auth_header'
  end

  def authentication_headers(value = $user_1.email)
    { "#{authenticated_header}" => value }
  end

  def stub_http_header_authentication_configuration(field: 'email', autocreation: false, enabled: true)
    Cartodb.stubs(:get_config)

    config = {
      'header' => authenticated_header,
      'field' => field,
      'autocreation' => autocreation
    }

    config.each do |field, value|
      Cartodb.stubs(:get_config).with(:http_header_authentication, field).
        returns(enabled ? value : nil)
    end

    config
  end
end
