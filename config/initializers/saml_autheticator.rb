require "base64"

class SamlAuthenticator

  def self.get_user_info(params)
    
     puts "getting the user info"

     response = OneLogin::RubySaml::Response.new(params[:SAMLResponse])

     puts "SAML decoded:#{Base64.decode64(params[:SAMLResponse])}";

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
MIIDgjCCAmqgAwIBAgIGAVDZ0PdZMA0GCSqGSIb3DQEBCwUAMIGBMQswCQYDVQQGEwJVUzELMAkG
A1UECBMCTlkxETAPBgNVBAcTCE5ldyBZb3JrMSIwIAYDVQQKExlCbG9vbWJlcmcgU3lzdGVtIFNl
Y3VyaXR5MQ0wCwYDVQQLEwRORElTMR8wHQYDVQQDExZic3NvLWlkcC5ibG9vbWJlcmcuY29tMB4X
DTE1MTEwNTIyNDI0MloXDTIwMTEwMzIyNDI0MlowgYExCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJO
WTERMA8GA1UEBxMITmV3IFlvcmsxIjAgBgNVBAoTGUJsb29tYmVyZyBTeXN0ZW0gU2VjdXJpdHkx
DTALBgNVBAsTBE5ESVMxHzAdBgNVBAMTFmJzc28taWRwLmJsb29tYmVyZy5jb20wggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDAm8cWAVrpr5giRNWBabmQSaigfoQb0ge5jtH6b7JrGmP9
qJ7yhoZro39i0IslWxQp71afY/cgtyiJJFjWoultMvt0Tgv1eKLxuKo0kXwhfcFM2UWQ0f9YbyFs
YL3+CPFdH0H58mjNwEm6fddEFw2+pML776dZ9XUdrAx/RDT2aotCEd2QlAYBc1rlc1uHcSrVYP/y
R664Pck7R07qEiy5/yt9A7xZ82UOiC5JJzpFxJgkgUqS9UFc6WJ1uos5AaSlaVWrBdGV9X43dp4N
RKoFPsEBrqqXPhLRkb91K9FVAKJ6vllg5hUcSfycKiueJLAVu/my17Y3yL5uH/uemXrVAgMBAAEw
DQYJKoZIhvcNAQELBQADggEBABa9UYS65bcl1KSyTsTqobSzqKHT9oVdativVxGVMROMmw1GuOrY
5bsKSVl5mVniU1fUnCS0mlXUycCc8P520Jr1tKWyOziRqOCwc3ero6/vi4WZ8EtU/rJRU/2zIyh7
oM8Cz6t9cSJvBwPW2A250bUDRAOsXvjRPxiwc9s6Au0yp+cKvm5iCZy2Er/XWAApVU1ZR2E1lLBY
i0oq900hbNzxCwX9q9ZTr/Jpvi3ok49So/PLztyASHGPkI+bsW4xq+DwIEA7crtN72BFXGufeBNX
gVEekuJmDOOd5oZJY/arqTYnD880ZG6EYfJgTc+EFmaQOA6GgiNJ1Pv8FP1+M94=
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


