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
      saml_response = saml_response_from_saml_response_param(saml_response_param)

      email_from_saml_response(saml_response) if saml_response
    end

    private

    def saml_response_from_saml_response_param(saml_response_param)
      response = get_saml_response(saml_response_param)

      response.is_valid? ? response : debug_response("SAML response not valid", response)
    end

    def email_from_saml_response(saml_response)
      email = saml_response.attributes[email_attribute]

      email.present? ? email : debug_response("SAML response lacks email", saml_response)
    end

    def debug_response(message, response)
      CartoDB::Logger.debug(message: message, response_settings: response.settings, response_options: response.options)
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

    # Transforms an email address (e.g. firstname.lastname@example.com) into a string
    # which can serve as a subdomain.
    # firstname.lastname@example.com -> firstname-lastname
    # Replaces all non-allowable characters with
    # hyphens. This could potentially result in collisions between two specially-
    # constructed names (e.g. John Smith-Bob and Bob-John Smith).
    # We're ignoring this for now since this type of email is unlikely to come up.
    # This method is used by the SAML authentication framework to create appropriate
    #
    # TODO: this is not currently used because `username` gets it based on the email.
    # This will be either used or deleted on #11073
    def email_to_subdomain(email)
      email.strip.split('@')[0].gsub(/[^A-Za-z0-9-]/, '-').downcase
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
