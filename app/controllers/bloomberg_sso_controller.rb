class BloombergSsoController < ApplicationController
  layout 'frontend'
  
  before_filter :load_organization
  # before_filter :initialize_google_plus_config
  
  # Don't force org urls
  # skip_before_filter :ensure_org_url_if_org_user
  # skip_before_filter :ensure_account_has_been_activated, :only => :account_token_authentication_error
  # skip_before_filter :verify_authenticity_token, :only => [:acs, :logout]

  def index
    @attrs = {}
  end

  def sso
  end

  # scs should acs method
  def scs
    
    logger.info "inside scs"
    
    settings = get_saml_settings
    authResponse = getSamlResponse
    
    #logger.info "settings are  #{settings.idp_cert}"
    
    response = OneLogin::RubySaml::Response.new(authResponse)
    response.settings = settings

    logger.info "NAMEID: #{response.nameid}"
    
    if response.is_valid?
      session[:nameid] = response.nameid
      session[:attributes] = response.attributes
      @attrs = session[:attributes]
      logger.info "Sucessfully logged"
      logger.info "NAMEID: #{response.nameid}"
      render :action => :index
    else
      logger.info "Response Invalid. Errors: #{response.errors}"
      @errors = response.errors
      render :action => :invalid_saml
    end
    
  end

  def metadata
    settings = get_saml_settings
    meta = OneLogin::RubySaml::Metadata.new
    render :xml => meta.generate(settings, true)
  end

  def sp_logout_request
  end

  def process_logout_response
  end

  def idp_logout_request
  end
  
  
  def load_organization
    subdomain = CartoDB.subdomain_from_request(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
  end
  
  def get_saml_settings
    # this is just for testing purposes.
    # should retrieve SAML-settings based on subdomain, IP-address, NameID or similar
    settings = OneLogin::RubySaml::Settings.new

    # When disabled, saml validation errors will raise an exception.
    settings.soft = true

    # Example settings data, replace this values!

    # SP section
    settings.assertion_consumer_service_url = "http://localhost/bloomberg_sso/scs"
    settings.assertion_consumer_logout_service_url = "http://localhost:3000/bloomberg_sso/logout"
    settings.issuer                         = "http://localhost:3000/bloomberg_sso/metadata"

    # IdP section
    settings.idp_entity_id                  = "https://app.onelogin.com/saml/metadata/<onelogin-app-id>"
    settings.idp_sso_target_url             = "https://app.onelogin.com/trust/saml2/http-post/sso/<onelogin-app-id>"
    settings.idp_slo_target_url             = "https://app.onelogin.com/trust/saml2/http-redirect/slo/<onelogin-app-id>"
    settings.idp_cert                       = "-----BEGIN CERTIFICATE-----
MIIDNDCCAhygAwIBAgIIRVI0ZQSoAHEwDQYJKoZIhvcNAQEEBQAwgZUxCzAJBgNV
BAYTAlVTMREwDwYDVQQIEwhOZXcgWW9yazEWMBQGA1UEBxMNTmV3IFlvcmsgQ2l0
eTEVMBMGA1UEChQMQmxvb21iZXJnIExQMRkwFwYDVQQLExBJbnRlcm5hbCBTeXN0
ZW1zMSkwJwYDVQQDEyBCbG9vbWJlcmcgU0FNTCBBdXRob3JpdHkgUm9vdCBDQTAe
Fw0wNjExMDgxOTQ4NDRaFw0xNjExMDUxOTQ4NDRaMIGNMQswCQYDVQQGEwJVUzER
MA8GA1UECBMITmV3IFlvcmsxFjAUBgNVBAcTDU5ldyBZb3JrIENpdHkxFTATBgNV
BAoUDEJsb29tYmVyZyBMUDEZMBcGA1UECxMQSW50ZXJuYWwgU3lzdGVtczEhMB8G
A1UEAxMYQmxvb21iZXJnIFNBTUwgQXV0aG9yaXR5MIGfMA0GCSqGSIb3DQEBAQUA
A4GNADCBiQKBgQC+LwYWgPv/brG91DejVuqDSYDgnVhxFt/SMQr1GAgXLlrJG10h
1WAxEYH3ztsQOR5HJ3YlZWlajhv/maCDTV3zOviQTzuO+C1x7/QDmUcA0AL7XN1Q
z/wDP9hASyJUv9Fn8cZFj7oaOLIF95/nO6uvXSyusVuKAkdQjesowBWB0QIDAQAB
oxIwEDAOBgNVHQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQEEBQADggEBANeEyXnpiSvi
57U101SfmrvJHr/UGlWP4xjIF6iCOoDTVvf3CK4QAGtabZfzM2xZP9pS7xArrF0M
bBp8AN6CFXNwR9kYjtafGbKbrfvwBdrcqEeCgjjwvdYHBULSnu+o2kMEgRSMEgga
falkxKkRe2w02gV1V/6m69nr4YHmYtkjAMoCa80FVxudb/orly2+SD5C8Ysa7oqA
Qt9ym/tbZCrsJZNEc/TYIhRB6wqeRR94ItV5QjYpspdiw6MAsgZIoZvxuzePq5ov
BxU+B/zVosVn9V8JA1p5CfKMpfD27It6KUE0nJp5ODAFJZqFBakeaLtNRkN7lR6f
YGD+vIsxIbs=
-----END CERTIFICATE-----"
    # or settings.idp_cert_fingerprint           = "3B:05:BE:0A:EC:84:CC:D4:75:97:B3:A2:22:AC:56:21:44:EF:59:E6"
    #    settings.idp_cert_fingerprint_algorithm = XMLSecurity::Document::SHA1

    settings.name_identifier_format         = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"

    # Security section
    settings.security[:authn_requests_signed] = false
    settings.security[:logout_requests_signed] = false
    settings.security[:logout_responses_signed] = false
    settings.security[:metadata_signed] = false
    settings.security[:digest_method] = XMLSecurity::Document::SHA1
    settings.security[:signature_method] = XMLSecurity::Document::RSA_SHA1

    settings
  end

  def getSamlResponse
    samlResp = %q(
'<Response Destination="https://maps.prod.bloomberg.com/acs" ID="_038FC0B1DDF89EA93B696219C0AFBE4DA5739CBD" IssueInstant="2015-08-17T19:27:18Z" Version="2.0" xmlns="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
<ds:SignedInfo>
<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<ds:Reference URI="#_038FC0B1DDF89EA93B696219C0AFBE4DA5739CBD">
<ds:Transforms>
<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">
<ec:InclusiveNamespaces PrefixList="#default saml samlp ds xsd xsi code kind typens" xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#"/>
</ds:Transform>
</ds:Transforms>
<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<ds:DigestValue>ySStZmuZ/agNRWCQtyMtJloHidU=</ds:DigestValue>
</ds:Reference>
</ds:SignedInfo>
<ds:SignatureValue>V9a1UkV11d0zPA5djWQgaROzd3txmNoWCXSIkswMnfOwCa1jkKdm5f40Ymmp3pnl
1yjcMKbBqs18eEz75wfTZEJ0LDm4vNOehUnV9iuDczINRpH+12N3C4X9kjTQ4KFk
KEVwAqCa4YGQsz3B/ZAtp9fk7Qqi2HjsFXpx2BkrROk=</ds:SignatureValue>
<ds:KeyInfo>
<ds:X509Data>
<ds:X509Certificate>MIIDNDCCAhygAwIBAgIIRVI0ZQSoAHEwDQYJKoZIhvcNAQEEBQAwgZUxCzAJBgNV
BAYTAlVTMREwDwYDVQQIEwhOZXcgWW9yazEWMBQGA1UEBxMNTmV3IFlvcmsgQ2l0
eTEVMBMGA1UEChQMQmxvb21iZXJnIExQMRkwFwYDVQQLExBJbnRlcm5hbCBTeXN0
ZW1zMSkwJwYDVQQDEyBCbG9vbWJlcmcgU0FNTCBBdXRob3JpdHkgUm9vdCBDQTAe
Fw0wNjExMDgxOTQ4NDRaFw0xNjExMDUxOTQ4NDRaMIGNMQswCQYDVQQGEwJVUzER
MA8GA1UECBMITmV3IFlvcmsxFjAUBgNVBAcTDU5ldyBZb3JrIENpdHkxFTATBgNV
BAoUDEJsb29tYmVyZyBMUDEZMBcGA1UECxMQSW50ZXJuYWwgU3lzdGVtczEhMB8G
A1UEAxMYQmxvb21iZXJnIFNBTUwgQXV0aG9yaXR5MIGfMA0GCSqGSIb3DQEBAQUA
A4GNADCBiQKBgQC+LwYWgPv/brG91DejVuqDSYDgnVhxFt/SMQr1GAgXLlrJG10h
1WAxEYH3ztsQOR5HJ3YlZWlajhv/maCDTV3zOviQTzuO+C1x7/QDmUcA0AL7XN1Q
z/wDP9hASyJUv9Fn8cZFj7oaOLIF95/nO6uvXSyusVuKAkdQjesowBWB0QIDAQAB
oxIwEDAOBgNVHQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQEEBQADggEBANeEyXnpiSvi
57U101SfmrvJHr/UGlWP4xjIF6iCOoDTVvf3CK4QAGtabZfzM2xZP9pS7xArrF0M
bBp8AN6CFXNwR9kYjtafGbKbrfvwBdrcqEeCgjjwvdYHBULSnu+o2kMEgRSMEgga
falkxKkRe2w02gV1V/6m69nr4YHmYtkjAMoCa80FVxudb/orly2+SD5C8Ysa7oqA
Qt9ym/tbZCrsJZNEc/TYIhRB6wqeRR94ItV5QjYpspdiw6MAsgZIoZvxuzePq5ov
BxU+B/zVosVn9V8JA1p5CfKMpfD27It6KUE0nJp5ODAFJZqFBakeaLtNRkN7lR6f
YGD+vIsxIbs=
</ds:X509Certificate>
</ds:X509Data>
</ds:KeyInfo>
</ds:Signature><Status><StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></Status><Assertion ID="_EC090D23E41068A2195CED389AAF432021F96105" IssueInstant="2015-08-17T19:27:18Z" Version="2.0" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"><Issuer>Bloomberg_SAML_Authority</Issuer><Subject><NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">4286253</NameID><SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><SubjectConfirmationData NotOnOrAfter="2015-08-17T19:32:18Z" Recipient="https://maps.prod.bloomberg.com/acs"/></SubjectConfirmation></Subject><Conditions NotBefore="2015-08-17T19:22:18Z" NotOnOrAfter="2015-08-17T19:32:18Z"><AudienceRestriction><Audience>maps.prod.bloomberg.com</Audience></AudienceRestriction></Conditions><AuthnStatement AuthnInstant="2015-08-17T19:27:18Z"><AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</AuthnContextClassRef></AuthnContext></AuthnStatement><AttributeStatement><Attribute Name="AccountName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified"><AttributeValue>Bloomberg LP</AttributeValue></Attribute></AttributeStatement></Assertion></Response>  end  
)
    samlResp
  end
  
end #end of the controller class