module Carto
  class SamlService
    def enabled?
      carto_saml_configuration.present?
    end

    def authentication_request
      OneLogin::RubySaml::Authrequest.new.create(saml_settings)
    end

    def subdomain(saml_response_param)
      saml_response = get_saml_response(saml_response_param)
      return nil unless saml_response.is_valid?
      return nil unless saml_response.attributes[email_attribute].present?

      email_to_subdomain(saml_response.attributes[email_attribute])
    end

    def get_user(saml_response_param)
      response = get_saml_response(saml_response_param)

      unless response.is_valid?
        CartoDB::Logger.debug(message: "SAML response not valid", response: response)
        return nil
      end

      email = response.attributes[email_attribute]
      # Can't match the subdomain because ADFS can only redirect to one endpoint.
      # So this just checks to see if we have a user with this email address.
      # We can log them in at that point since identity is confirmed by BCG's ADFS.
      ::User.filter("email ILIKE ?", email).first
    end

    private

    def get_saml_response(saml_response_param)
      OneLogin::RubySaml::Response.new(
        saml_response_param,
        settings: saml_settings,
        allowed_clock_drift: 3600
      )
    end

    def email_attribute
      carto_saml_configuration['email_attribute'] || 'name_id'
    end

    # Transforms an email address (e.g. firstname.lastname@example.com) into a string
    # which can serve as a subdomain.
    # firstname.lastname@example.com -> firstname-lastname
    # Replaces all non-allowable characters with
    # hyphens. This could potentially result in collisions between two specially-
    # constructed names (e.g. John Smith-Bob and Bob-John Smith).
    # We're ignoring this for now since this type of email is unlikely to come up.
    # This method is used by the SAML authentication framework to create appropriate
    def email_to_subdomain(email)
      email.strip.split('@')[0].gsub(/[^A-Za-z0-9-]/, '-').downcase
    end

    # Our SAML library expects object properties
    # Adapted from https://github.com/hryk/warden-saml-example/blob/master/application.rb
    def saml_settings(settings_hash = carto_saml_configuration)
      settings = OneLogin::RubySaml::Settings.new
      settings_hash.each do |k, v|
        method = "#{k}="
        settings.__send__ method, v if settings.respond_to?(method)
      end
      settings
    end

    def carto_saml_configuration
      saml_config = Cartodb.config[:saml_authentication]
      saml_config ? saml_config.with_indifferent_access : nil
    end
  end
end
