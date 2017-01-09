namespace :cartodb do
  namespace :saml do
    # Sets (inserts or overrides) SAML configuration for an organization. The following environments variables are needed:
    # ORGANIZATION_NAME: name of the organization. Example: 'orgname'.
    # SAML_ISSUER: Name of the service provider in the SAML server. Example: 'CARTO_SAML_Test'.
    # SAML_IDP_SSO_TARGET_URL: SAML Identity Provider login URL. Example: 'http://192.168.20.2/simplesaml/saml2/idp/SSOService.php'.
    # SAML_IDP_SLO_TARGET_URL: SAML Identity Provider logout URL. Example: 'http://192.168.20.2/simplesaml/saml2/idp/SingleLogoutService.php'.
    # SAML_IDP_CERT_FINGERPRINT: SAML server certificate fingerprint. Command: `openssl x509 -noout -fingerprint -in "./cert/server.crt`. Example: '8C:47:97:B1:E2:E4:6C:06:B5:56:11:8A:5A:8B:53:5C:01:05:CB:05'.
    # SAML_ASSERTION_CONSUMER_SERVICE_URL: CARTO URL for SAML, including organization name. Examples: 'http://192.168.20.2/user/orgname/saml/finalize'.
    # SAML_NAME_IDENTIFIER_FORMAT: Format of the name identifier parameter. Example: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'. Defaults to 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient'
    # SAML_EMAIL_ATTRIBUTE: attribute with the user email. Example: 'email'.
    task :create_saml_configuration, [] => :environment do |_t, _args|
      organization = Carto::Organization.where(name: ENV['ORGANIZATION_NAME']).first
      raise "Organization not found: #{ENV['ORGANIZATION_NAME']}" unless organization

      configuration = {
        issuer: ENV['SAML_ISSUER'],
        idp_sso_target_url: ENV['SAML_IDP_SSO_TARGET_URL'],
        idp_cert_fingerprint: ENV['SAML_IDP_CERT_FINGERPRINT'],
        assertion_consumer_service_url: ENV['SAML_ASSERTION_CONSUMER_SERVICE_URL'],
        name_identifier_format: ENV['SAML_NAME_IDENTIFIER_FORMAT'],
        email_attribute: ENV['SAML_EMAIL_ATTRIBUTE']
      }

      configuration[:assertion_consumer_service_url] ||= 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient'
      configuration[:idp_slo_target_url] = ENV['SAML_IDP_SLO_TARGET_URL'] if ENV['SAML_IDP_SLO_TARGET_URL'].present?

      raise "Missing parameter: #{configuration}" unless configuration.values.all?(&:present?)

      organization.update_attribute(:auth_saml_configuration, configuration)
    end
  end
end
