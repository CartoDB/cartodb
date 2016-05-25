namespace :cartodb do
  namespace :ldap do
    desc "Tests an LDAP connection. Returns a summary of all tests ran, with success status and error messages."
    task :test_ldap_connection, [:from_database] => :environment do |_t, args|
      args.with_defaults(from_database: false)

      test_user     = ENV['TEST_USER']
      test_password = ENV['TEST_PASSWORD']
      ldap = args.from_database ? Carto::Ldap::Configuration.first : ldap_configuration_from_environment

      # Test configuration
      config_result = if ldap.valid?
                        { success: true }
                      else
                        { success: false, error: ldap.errors.to_h }
                      end

      result = { config: config_result }

      REQUIRED_FIELDS = [:host, :port, :connection_user, :connection_password].freeze
      if !config_result[:success] && config_result[:error].keys.any? { |k| REQUIRED_FIELDS.include?(k) }
        result[:connection] = { success: false, error: 'Configuration not valid' }
      end

      # Test connection
      result[:connection] = ldap.test_connection unless result[:connection]

      CONNECTION_DEPENDENT_TESTS = [:login, :user_search, :group_search].freeze
      if result[:connection][:success]
        result[:connection].delete(:connection)
        if ldap.domain_bases
          result[:login] = if ldap.user_id_field && test_user && test_password
                             if ldap.authenticate(test_user, test_password)
                               { success: true }
                             else
                               { success: false, error: 'Cannot log in with test credentials' }
                             end
                           else
                             { success: false, error: 'Test credentials not provided' }
                           end

          result[:user_search] = if ldap.user_object_class
                                   user_count = ldap.users.count
                                   { success: user_count > 0, count: user_count }
                                 else
                                   { success: false, error: 'User class not provided' }
                                 end

          result[:group_search] = if ldap.group_object_class
                                    group_count = ldap.groups.count
                                    { success: group_count > 0, count: group_count }
                                  else
                                    { success: false, error: 'Group class not provided' }
                                  end
        else
          CONNECTION_DEPENDENT_TESTS.each do |test|
            result[test] = { success: false, error: 'Domain bases not provided' }
          end
        end
      else
        CONNECTION_DEPENDENT_TESTS.each do |test|
          result[test] = { success: false, error: 'Connection failed' }
        end
      end
      puts JSON.pretty_generate(result)
    end

    # INFO: Separate multiple domain names by commas
    desc "Creates an LDAP Configuration entry"
    task :create_ldap_configuration, [] => :environment do |t, args|

      if ENV['ORGANIZATION_ID'].blank?
        if ENV['ORGANIZATION_NAME'].blank?
          raise "Missing ORGANIZATION_ID and ORGANIZATION_NAME. Must provide one of both"
        else
          organization_id = ::Organization.where(name: ENV['ORGANIZATION_NAME']).first.id
        end
       else
        organization_id = ENV['ORGANIZATION_ID']
       end

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
      domain_bases = ENV['DOMAIN_BASES'].split(Carto::Ldap::Configuration::DOMAIN_BASES_SEPARATOR)

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

    desc "Deletes existing LDAP Configuration entries"
    task :reset_ldap_configuration, [] => :environment do |_t, _args|
      Carto::Ldap::Configuration.delete_all
    end
  end

  private

  def ldap_configuration_from_environment
    # Mandatory: connection parameters
    host = ENV['HOST']
    port = ENV['PORT']
    ssl_version = ENV['SSL_VERSION'].blank? ? nil : ENV['SSL_VERSION']
    encryption = ENV['ENCRYPTION'].blank? ? nil : ENV['ENCRYPTION']
    connection_user = ENV['CONNECTION_USER']
    connection_password = ENV['CONNECTION_PASSWORD']

    # Optional: for testing auth/searches
    user_id_field = ENV['USER_ID_FIELD']
    domain_bases  = ENV['DOMAIN_BASES']

    # Optional: for testing searches
    username_field     = ENV['USERNAME_FIELD']
    email_field        = ENV['EMAIL_FIELD']
    user_object_class  = ENV['USER_OBJECT_CLASS']
    group_object_class = ENV['GROUP_OBJECT_CLASS']

    Carto::Ldap::Configuration.new(
      organization:         Carto::Organization.new,
      host:                 host,
      port:                 port,
      encryption:           encryption,
      ssl_version:          ssl_version,
      connection_user:      connection_user,
      connection_password:  connection_password,
      user_id_field:        user_id_field,
      username_field:       username_field,
      email_field:          email_field,
      domain_bases:         domain_bases,
      user_object_class:    user_object_class,
      group_object_class:   group_object_class
    )
  end
end
