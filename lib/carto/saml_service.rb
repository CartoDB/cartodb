module Carto
  class SamlService
    def authentication_request
      OneLogin::RubySaml::Authrequest.new.create(saml_settings)
    end

    def subdomain(saml_response_param)
      saml_response = OneLogin::RubySaml::Response.new(
        saml_response_param,
        settings: saml_settings,
        allowed_clock_drift: 3600
      )
      return nil unless saml_response.is_valid?
      return nil unless saml_response.attributes['name_id'].present?

      subdomain = email_to_subdomain(saml_response.attributes['name_id'])
    end

    def get_user(saml_response_param)
      response = OneLogin::RubySaml::Response.new(saml_response_param, settings: saml_settings)

      return nil unless response.is_valid?

      email = response.attributes['name_id']
      # Can't match the subdomain because ADFS can only redirect to one endpoint.
      # So this just checks to see if we have a user with this email address.
      # We can log them in at that point since identity is confirmed by BCG's ADFS.
      User.filter("email ILIKE ?", email).first && user.enabled?
    end

    private

    def email_to_subdomain(email)
      email.strip.split('@')[0].gsub(/[^A-Za-z0-9-]/, '-').downcase
    end

    # Our SAML library expects object properties
    # Adapted from https://github.com/hryk/warden-saml-example/blob/master/application.rb
    def saml_settings(settings_hash = Cartodb.config[:saml_authentication])
      settings = OneLogin::RubySaml::Settings.new
      settings_hash.each do |k, v|
        settings.__send__ "#{k}=", v
      end
      settings
    end
  end
end
