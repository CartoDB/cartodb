# encoding: utf-8

module Carto
  class SamlService
    def initialize(organization)
      raise "organization can't be nil" unless organization

      @organization = organization
    end

    def enabled?
      carto_saml_configuration.present?
    end

    def authentication_request
      OneLogin::RubySaml::Authrequest.new.create(saml_settings)
    end

    def get_user_email(saml_response_param)
      response = get_saml_response(saml_response_param)
      response.is_valid? ? email_from_saml_response(response) : debug_response("Invalid SAML response", response)
    end

    private

    def email_from_saml_response(saml_response)
      email = saml_response.attributes[email_attribute]

      email.present? ? email : debug_response("SAML response lacks email", saml_response)
    end

    def debug_response(message, response)
      CartoDB::Logger.debug(
        message: message,
        response_settings: response.settings,
        response_options: response.options,
        response_errors: response.errors
      )
      nil
    end

    def get_saml_response(saml_response_param)
      OneLogin::RubySaml::Response.new(
        saml_response_param,
        settings: saml_settings,
        allowed_clock_drift: carto_saml_configuration[:allowed_clock_drift] || 3600
      )
    end

    def email_attribute
      carto_saml_configuration[:email_attribute] || 'name_id'
    end

    # Our SAML library expects object properties
    # Adapted from https://github.com/hryk/warden-saml-example/blob/master/application.rb
    def saml_settings(settings_hash = carto_saml_configuration)
      settings = OneLogin::RubySaml::Settings.new
      settings_hash.each do |k, v|
        method = "#{k}="
        settings.__send__(method, v) if settings.respond_to?(method)
      end
      settings
    end

    def carto_saml_configuration
      @organization.try(:auth_saml_configuration)
    end
  end
end
