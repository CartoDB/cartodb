class SamlAuthenticator

  def self.get_user_info(params)
    
     puts "getting the user info"

     response = OneLogin::RubySaml::Response.new(params[:SAMLResponse])

     response.settings = get_saml_settings

     if response.is_valid? 
      puts "this is a valid user"

       user_data = UserInfo.where(uuid: response.nameid).first
       return user_data

     else

       puts "Response Invalid. Errors: #{response.errors}"

     end

     return nil

  end

  def self.get_saml_settings
    puts "get_saml_settings"
    
    settings = OneLogin::RubySaml::Settings.new

    settings.soft = true
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

    settings
  end


  def self.check_user(user_data)
    existing_user = User.where("email = '#{user_data.email}' OR username = '#{user_data.username}'").first
    puts "inside check user"

    if (existing_user != nil)
        puts "found an existing user"
        return existing_user
    end

    user = User.new
    set_user_attributes(user, user_data)

    user.save(raise_on_failure: true)
    user.create_in_central

    puts "A new user is created."

    user
  end


  def self.set_user_attributes(user, data)
    user.username = data.username
    user.email = data.email
    user.password = "123456"
    user.password_confirmation = user.password
  end

end


