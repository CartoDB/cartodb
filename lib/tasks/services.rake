namespace :cartodb do
  namespace :services do

    # Prefixes corresponding to User columns names/REDIS keys that store providers
    DS_PROVIDED_SERVICES = ['geocoder', 'routing', 'isolines'].freeze

    # service provider names
    DS_PROVIDERS = ['heremaps', 'google', 'mapzen', 'mapbox', 'tomtom'].freeze

    # Prefixes/infixes corresponding to User columns names/REDIS keys that store quotas / soft limits
    # note that there's a couple of naming incosistence due to historical reasons:
    # * here_isolines refers to isolines in general, not only those provided by here
    # * mapzen_routing refers to routing in general
    DS_SERVICES = ['geocoding', 'here_isolines', 'obs_snapshot', 'obs_general', 'mapzen_routing'].freeze

    def assert_valid_arg(args, parameter, accepted_values: nil)
      value = args[parameter]
      if value.blank?
        raise "Please specify the #{parameter}"
      end
      case accepted_values
      when Array
        if !accepted_values.include?(value)
          values_sentence = accepted_values.to_sentence(last_word_connector: ' or ', two_words_connector: ' or ')
          raise "Unknown #{parameter}: #{value.inspect}. Please use one of #{values_sentence}"
        end
      when Proc, Hash
        if !accepted_values[value]
          raise "Invalid #{parameter} value: #{value.inspect}."
        end
      end
    end

    # usage example:
    #   bundle exec rake cartodb:services:set_user_provider['username','geocoder','mapzen']
    desc 'Assign the provider for a service to a user'
    task :set_user_provider, [:username, :service, :provider] => [:environment] do |_task, args|
      username = args[:username]
      service = args[:service]
      provider = args[:provider]
      user = username && ::User.find(username: username)

      assert_valid_arg args, :username, accepted_values: proc { user.present? }
      assert_valid_arg args, :service,  accepted_values: DS_PROVIDED_SERVICES
      assert_valid_arg args, :provider, accepted_values: DS_PROVIDERS

      service_key = "#{service}_provider="
      user.send(service_key, provider)
      user.save

      puts "Changed the user service provider for #{service} to #{provider}."
    end

    # usage example:
    #   bundle exec rake cartodb:services:set_organization_provider['orgname','geocoder','mapzen']
    desc 'Assign the provider for a service to an organization'
    task :set_organization_provider, [:orgname, :service, :provider] => [:environment] do |_task, args|
      orgname = args[:orgname]
      service = args[:service]
      provider = args[:provider]
      org = orgname && ::Organization.find(name: orgname)

      assert_valid_arg args, :orgname,  accepted_values: proc { org.present? }
      assert_valid_arg args, :service,  accepted_values: DS_PROVIDED_SERVICES
      assert_valid_arg args, :provider, accepted_values: DS_PROVIDERS

      service_key = "#{service}_provider="
      org.send(service_key, provider)
      org.save

      puts "Changed the organization service provider for #{service} to #{provider}."
    end


    # usage example:
    #   bundle exec rake cartodb:services:set_user_quota['username','geocoding',900]
    desc 'Assign the quota for a service to a user'
    task :set_user_quota, [:username, :service, :quota] => [:environment] do |_task, args|
      username = args[:username]
      service = args[:service]
      quota = args[:quota]
      user = username && ::User.find(username: username)

      assert_valid_arg args, :username, accepted_values: proc { user.present? }
      assert_valid_arg args, :service,  accepted_values: DS_SERVICES
      assert_valid_arg args, :quota,    accepted_values: ->(value) { value.to_i >= 0 }

      service_quota_key = "#{service}_quota="
      user.send(service_quota_key, quota)
      user.save

      puts "Changed the user quota for service #{service} to #{quota}."
    end

    # usage example:
    #   bundle exec rake cartodb:services:set_org_quota['orgname','geocoding',900]
    desc 'Assign the quota for a service to an organization'
    task :set_org_quota, [:orgname, :service, :quota] => [:environment] do |_task, args|
      orgname = args[:orgname]
      service = args[:service]
      quota = args[:quota]
      org = orgname && ::Organization.find(name: orgname)

      assert_valid_arg args, :orgname, accepted_values: proc { org.present? }
      assert_valid_arg args, :service, accepted_values: DS_SERVICES
      assert_valid_arg args, :quota,   accepted_values: ->(value) { value.to_i >= 0 }

      service_quota_key = "#{service}_quota="
      org.send(service_quota_key, quota)
      org.save

      puts "Changed the organization quota for service #{service} to #{quota}."
    end

    # usage example: (valid values are true or false)
    #   bundle exec rake cartodb:services:set_user_soft_limit['username','geocoding',true]
    desc 'Assign the soft limit flag for a service to a user'
    task :set_user_soft_limit, [:username, :service, :soft_limit] => [:environment] do |_task, args|
      username = args[:username]
      service = args[:service]
      soft_limit = args[:soft_limit] == 'false' ? false : true
      user = username && ::User.find(username: username)

      assert_valid_arg args, :username,   accepted_values: proc { user.present? }
      assert_valid_arg args, :service,    accepted_values: DS_SERVICES
      assert_valid_arg args, :soft_limit, accepted_values: ['true', 'false']

      service_quota_key = "soft_#{service}_limit="
      user.send(service_quota_key, soft_limit)
      user.save

      puts "Changed the user soft limit for service #{service} to #{soft_limit}."
    end
  end
end
