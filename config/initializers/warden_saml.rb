
Warden::Strategies.add(:saml_header) do

  def valid?
    true
  end

  def store?
    true
  end

  def authenticate!
    user = User.where(username: SamlAuthenticator.username_from_saml(params)).first
    user ? success!(user) : fail!
  end
end 
 
class SamlAuthenticator

  # Modify the signature and test the failure
  def self.testSignature(params)
     xmlstr =  Base64.decode64(params[:SAMLResponse])
        
      puts Base64.decode64(params[:SAMLResponse])

     signStart = xmlstr =~/<ds:SignatureValue>/
     signEnd = xmlstr =~/<\/ds:SignatureValue>/
     sign = xmlstr[signStart+"<ds:SignatureValue>".length, signEnd - signStart]
     puts "found the signature as  #{sign}"
     #xmlstr[signStart+"<ds:SignatureValue>".length, 2]= 'xx'
     sign = xmlstr[signStart+"<ds:SignatureValue>".length, signEnd - signStart]
     puts "changed signature is #{sign}"
     puts "after modifying"
     puts xmlstr
     xmlstr
  end

  def self.username_from_saml(params)
   
   puts Base64.decode64(params[:SAMLResponse])
   
   # Test the signature
   xmlstr =  testSignature(params) 
   
   response = OneLogin::RubySaml::Response.new(xmlstr)
   
   response.settings = get_saml_settings
   
   puts "The name id is #{response.nameid}"
   if response.is_valid?
      puts "It's a valid response"
      response.nameid
   else
      puts "Invalid response"
      puts "Response Invalid. Errors: #{response.errors}"
      response.errors
      nil
   end
  end

   def self.get_saml_settings
       settings = OneLogin::RubySaml::Settings.new

       settings.soft = true
      # settings.assertion_consumer_service_url = "/bloomberg_sso/scs"
      # settings.assertion_consumer_logout_service_url = "/bloomberg_sso/logout"
       #settings.issuer                         = "/bloomberg_sso/metadata"

       #settings.idp_entity_id                  = "https://app.onelogin.com/saml/metadata/<onelogin-app-id>"
       #settings.idp_sso_target_url             = "https://app.onelogin.com/trust/saml2/http-post/sso/<onelogin-app-id>"
       #settings.idp_slo_target_url             = "https://app.onelogin.com/trust/saml2/http-redirect/slo/<onelogin-app-id>"
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
    #settings.idp_cert_fingerprint           = "3B:05:BE:0A:EC:84:CC:D4:75:97:B3:A2:22:AC:56:21:44:EF:59:E6"
    #settings.idp_cert_fingerprint_algorithm = XMLSecurity::Document::SHA1

    #settings.name_identifier_format         = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"

                
    #settings.security[:authn_requests_signed] = false
    #settings.security[:logout_requests_signed] = false
    #settings.security[:logout_responses_signed] = false
    #settings.security[:metadata_signed] = false
    #settings.security[:digest_method] = XMLSecurity::Document::SHA1
    #settings.security[:signature_method] = XMLSecurity::Document::RSA_SHA1

    settings
end


end 

