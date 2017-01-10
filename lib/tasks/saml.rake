namespace :cartodb do
  namespace :saml do
    # Sets (inserts or overrides) SAML configuration for an organization. The following environments variables are needed:
    # ORGANIZATION_NAME: name of the organization. Example: 'orgname'.
    # SAML_ISSUER: [OPTIONAL] Name of the service provider in the SAML server. Example: 'CARTO_SAML_Test'. Defaults are based on organization name and domain.
    # SAML_EMAIL_ATTRIBUTE: attribute with the user email. Example: 'email'.
    # SAML_ASSERTION_CONSUMER_SERVICE_URL: [OPTIONAL] CARTO URL for SAML, including organization name. Examples: 'http://192.168.20.2/user/orgname/saml/finalize'. Defaults to the URL built from configuration and organization name
    # SAML_SINGLE_LOGOUT_SERVICE_URL: [OPTIONAL] CARTO URL for SAML logout, including organization name. Examples: 'http://192.168.20.2/user/orgname/logout'. Defaults to the URL built from configuration and organization name
    #
    # Option 1. Manual configuration
    # SAML_IDP_SSO_TARGET_URL: SAML Identity Provider login URL. Example: 'http://192.168.20.2/simplesaml/saml2/idp/SSOService.php'.
    # SAML_IDP_SLO_TARGET_URL: [OPTIONAL] SAML Identity Provider logout URL. Example: 'http://192.168.20.2/simplesaml/saml2/idp/SingleLogoutService.php'.
    # SAML_IDP_CERT_FINGERPRINT: SAML server certificate fingerprint. Command: `openssl x509 -noout -fingerprint -in "./cert/server.crt`. Example: '8C:47:97:B1:E2:E4:6C:06:B5:56:11:8A:5A:8B:53:5C:01:05:CB:05'.
    # SAML_NAME_IDENTIFIER_FORMAT: [OPTIONAL] Format of the name identifier parameter. Example: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'. Defaults to 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient'
    #
    # Option 2. Metadata parsing
    # SAML_IDP_METADATA_FILE: Url or file that contains metadata about the IdP. Example: 'http://192.168.20.2/saml2/idp/metadata.php'.
    task :create_saml_configuration, [] => :environment do |_t, _args|
      organization = Carto::Organization.where(name: ENV['ORGANIZATION_NAME']).first
      raise "Organization not found: #{ENV['ORGANIZATION_NAME']}" unless organization

      configuration = if ENV['SAML_IDP_METADATA_FILE'].present?
                        idp_metadata_parser = OneLogin::RubySaml::IdpMetadataParser.new
                        settings = idp_metadata_parser.parse_remote(ENV['SAML_IDP_METADATA_FILE'])
                        {
                          idp_sso_target_url: settings.idp_sso_target_url,
                          idp_slo_target_url: settings.idp_slo_target_url,
                          idp_cert_fingerprint: settings.idp_cert_fingerprint,
                          name_identifier_format: settings.name_identifier_format
                        }
                      else
                        config = {
                          idp_sso_target_url: ENV['SAML_IDP_SSO_TARGET_URL'],
                          idp_cert_fingerprint: ENV['SAML_IDP_CERT_FINGERPRINT'],
                          name_identifier_format: ENV['SAML_NAME_IDENTIFIER_FORMAT']
                        }
                        config[:idp_slo_target_url] = ENV['SAML_IDP_SLO_TARGET_URL'] if ENV['SAML_IDP_SLO_TARGET_URL'].present?
                        config
                      end

      base_url = CartoDB.base_url(organization.name)
      configuration[:issuer] = ENV['SAML_ISSUER'] || base_url + '/saml/metadata'
      configuration[:email_attribute] = ENV['SAML_EMAIL_ATTRIBUTE']
      configuration[:assertion_consumer_service_url] = ENV['SAML_ASSERTION_CONSUMER_SERVICE_URL'] || base_url + '/saml/finalize'
      configuration[:single_logout_service_url] = ENV['SAML_SINGLE_LOGOUT_SERVICE_URL'] || base_url + '/logout'
      configuration[:name_identifier_format] ||= 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient'

      raise "Missing parameter: #{configuration}" unless configuration.values.all?(&:present?)

      organization.update_attribute(:auth_saml_configuration, configuration)

      puts "Configuration metadata is available at #{base_url}/saml/metadata"
    end
  end
end
