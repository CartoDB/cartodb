module HttpAuthenticationHelper
  def authentication_headers(value = FactoryGirl.create(:valid_user))
    "auth_header": value
  end

  def stub_http_header_authentication_configuration(field: 'email', autocreation: false, enabled: true)
    Cartodb.stubs(:get_config)

    config = {
      'header' => authenticated_header,
      'field' => field,
      'autocreation' => autocreation
    }

    config.each do |f, v|
      Cartodb.stubs(:get_config).with(:http_header_authentication, f).
        returns(enabled ? v : nil)
    end

    config
  end
end
