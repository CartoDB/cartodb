namespace :cartodb do
  namespace :ldap do
    desc "Tests an LDAP connection"
    task :test_ldap_connection, [] => :environment do |t, args|

      raise "Missing HOST" if ENV['HOST'].blank?
      host = ENV['HOST']

      raise "Missing PORT" if ENV['PORT'].blank?
      port = ENV['PORT']

      encryption = ENV['ENCRYPTION'].blank? ? nil : ENV['ENCRYPTION']

      ssl_version = ENV['SSL_VERSION'].blank? ? nil : ENV['SSL_VERSION']

      raise "Missing CONNECTION_USER" if ENV['CONNECTION_USER'].blank?
      connection_user = ENV['CONNECTION_USER']

      raise "Missing CONNECTION_PASSWORD" if ENV['CONNECTION_PASSWORD'].blank?
      connection_password = ENV['CONNECTION_PASSWORD']

      ldap = Carto::Ldap::Configuration.new({
          host:                 host,
          port:                 port,
          encryption:           encryption,
          ssl_version:          ssl_version,
          connection_user:      connection_user,
          connection_password:  connection_password,
        })

      result = ldap.test_connection

      if result[:success]
        puts "OK"
      else
        puts "ERROR:\n#{result[:error]}"
      end
    end

    # INFO: Separate multiple domain names by commas
    desc "Creates an LDAP Configuration entry"
    task :create_ldap_configuration, [] => :environment do |t, args|

      raise "Missing ORGANIZATION_ID" if ENV['ORGANIZATION_ID'].blank?
      organization_id = ENV['ORGANIZATION_ID']

      raise "Missing HOST" if ENV['HOST'].blank?
      host = ENV['HOST']

      raise "Missing PORT" if ENV['PORT'].blank?
      port = ENV['PORT']

      encryption = ENV['ENCRYPTION'].blank? ? nil : ENV['ENCRYPTION']

      ssl_version = ENV['SSL_VERSION'].blank? ? nil : ENV['SSL_VERSION']

      raise "Missing CONNECTION_USER" if ENV['CONNECTION_USER'].blank?
      connection_user = ENV['CONNECTION_USER']

      raise "Missing CONNECTION_PASSWORD" if ENV['CONNECTION_PASSWORD'].blank?
      connection_password = ENV['CONNECTION_PASSWORD']

      raise "Missing USER_ID_FIELD" if ENV['USER_ID_FIELD'].blank?
      user_id_field = ENV['USER_ID_FIELD']

      raise "Missing USERNAME_FIELD" if ENV['USERNAME_FIELD'].blank?
      username_field = ENV['USERNAME_FIELD']

      email_field = ENV['EMAIL_FIELD'].blank? ? nil : ENV['EMAIL_FIELD']

      raise "Missing DOMAIN_BASES" if ENV['DOMAIN_BASES'].blank?
      domain_bases = ENV['DOMAIN_BASES'].split(',')

      raise "Missing USER_OBJECT_CLASS" if ENV['USER_OBJECT_CLASS'].blank?
      user_object_class = ENV['USER_OBJECT_CLASS']

      raise "Missing GROUP_OBJECT_CLASS" if ENV['GROUP_OBJECT_CLASS'].blank?
      group_object_class = ENV['GROUP_OBJECT_CLASS']

      ldap = Carto::Ldap::Configuration.create({
          organization_id:      organization_id,
          host:                 host,
          port:                 port,
          encryption:           encryption,
          ssl_version:          ssl_version,
          connection_user:      connection_user,
          connection_password:  connection_password,
          user_id_field:        user_id_field,
          username_field:       username_field,
          email_field:          email_field,
          domain_bases_list:    domain_bases,
          user_object_class:    user_object_class,
          group_object_class:   group_object_class
        })

      puts "LDAP configuration created with id: #{ldap.id}"
    end

  end
end