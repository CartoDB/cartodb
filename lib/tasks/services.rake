namespace :cartodb do
  namespace :services do

    # Prefixes corresponding to User columns names/REDIS keys that store providers
    DS_PROVIDED_SERVICES = ['geocoder', 'routing', 'isolines']

    # service provider names
    DS_PROVIDERS = ['here', 'google', 'mapzen']

    # Prefixes/infixes corresponding to User columns names/REDIS keys that store quotas / soft limits
    # note that there's a couple of naming incosistence due to historical reasons:
    # * here_isolines refers to isolines in general, not only those provided by here
    # * mapzen_routing refers to routing in general
    DS_SERVICES = ['geocoding', 'here_isolines', 'obs_snapshot', 'obs_general', 'mapzen_routing']

    # usage example:
    #   bundle exec rake cartodb:services:set_user_provider['username','geocoder','mapzen']
    desc 'Assign the provider for a service to a user'
    task :set_user_provider, [:username, :service, :provider] => [:environment] do |task, args|
      username = args[:username]
      service = args[:service]
      provider = args[:provider]

      raise 'Please specify the username of the user to be modified' if args[:username].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unknown service. Please use one of the accepted services: #{DS_PROVIDED_SERVICES.join(',')}" if not DS_PROVIDED_SERVICES.include? args[:service]
      raise 'Please specify the provider to be set' if args[:provider].blank?
      raise "Unknown provider. Please use one of the accepted providers: #{DS_PROVIDERS.join(',')}" if not DS_PROVIDERS.include? args[:provider]

      user = ::User.find(username: username)

      raise "The username '#{username}' does not correspond to any user" if user.nil?

      service_key = "#{service}_provider="
      user.send(service_key, provider)
      user.save

      puts "Changed the user service provider for #{service} to #{provider}."
    end

    # usage example:
    #   bundle exec rake cartodb:services:set_organization_provider['orgname','geocoder','mapzen']
    desc 'Assign the provider for a service to an organization'
    task :set_organization_provider, [:orgname, :service, :provider] => [:environment] do |task, args|
      orgname = args[:orgname]
      service = args[:service]
      provider = args[:provider]

      raise 'Please specify the organization to be modified' if args[:orgname].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unknown service. Please use one of the accepted services: #{DS_PROVIDED_SERVICES.join(',')}" if not DS_PROVIDED_SERVICES.include? args[:service]
      raise 'Please specify the provider to be set' if args[:provider].blank?
      raise "Unknown provider. Please use one of the accepted providers: #{DS_PROVIDERS.join(',')}" if not DS_PROVIDERS.include? args[:provider]

      org = ::Organization.find(name: orgname)

      raise "The orgname '#{orgname}' does not correspond to any user" if org.nil?

      service_key = "#{service}_provider="
      org.send(service_key, provider)
      org.save

      puts "Changed the organization service provider for #{service} to #{provider}."
    end


    # usage example:
    #   bundle exec rake cartodb:services:set_user_quota['username','geocoding',900]
    desc 'Assign the quota for a service to a user'
    task :set_user_quota, [:username, :service, :quota] => [:environment] do |task, args|
      username = args[:username]
      service = args[:service]
      quota = args[:quota]

      raise 'Please specify the user to be modified' if args[:username].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unknown service. Please use one of the accepted services: #{DS_SERVICES.join(',')}" if not DS_SERVICES.include? args[:service]
      raise 'Please specify a valid quota' if args[:quota].to_i < 0

      user = ::User.find(username: username)

      raise "The name '#{username}' does not correspond to any user" if user.nil?

      service_quota_key = "#{service}_quota="
      user.send(service_quota_key, quota)
      user.save

      puts "Changed the user quota for service #{service} to #{quota}."
    end

    # usage example:
    #   bundle exec rake cartodb:services:set_org_quota['orgname','geocoding',900]
    desc 'Assign the quota for a service to an organization'
    task :set_org_quota, [:orgname, :service, :quota] => [:environment] do |task, args|
      orgname = args[:orgname]
      service = args[:service]
      quota = args[:quota]

      raise 'Please specify the organization to be modified' if args[:orgname].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unknown service. Please use one of the accepted services: #{DS_SERVICES.join(',')}" if not DS_SERVICES.include? args[:service]
      raise 'Please specify a valid quota' if args[:quota].to_i < 0

      org = ::Organization.find(name: orgname)

      raise "The name '#{orgname}' does not correspond to any organization" if org.nil?

      service_quota_key = "#{service}_quota="
      org.send(service_quota_key, quota)
      org.save

      puts "Changed the organization quota for service #{service} to #{quota}."
    end

    # usage example: (valid values are true or false)
    #   bundle exec rake cartodb:services:set_user_soft_limit['username','geocoding',true]
    desc 'Assign the soft limit flag for a service to a user'
    task :set_user_soft_limit, [:username, :service, :soft_limit] => [:environment] do |task, args|
      username = args[:username]
      service = args[:service]
      soft_limit = args[:soft_limit] == 'false' ? false : true

      raise 'Please specify the user to be modified' if args[:username].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unknown service. Please use one of the accepted services: #{DS_SERVICES.join(',')}" if not DS_SERVICES.include? args[:service]
      raise 'Please specify a soft limit (true or false)' if not ['true', 'false'].include? args[:soft_limit]

      user = ::User.find(username: username)

      raise "The name '#{username}' does not correspond to any user" if user.nil?

      service_quota_key = "soft_#{service}_limit="
      user.send(service_quota_key, soft_limit)
      user.save

      puts "Changed the user soft limit for service #{service} to #{soft_limit}."
    end

    # usage example: (valid values are true or false)
    #   bundle exec rake cartodb:services:set_org_soft_limit['orgname','geocoding',true]
    desc 'Assign the soft limit flag for a service to an organization'
    task :set_org_soft_limit, [:orgname, :service, :soft_limit] => [:environment] do |task, args|
      orgname = args[:orgname]
      service = args[:service]
      soft_limit = args[:soft_limit] == 'false' ? false : true

      raise 'Please specify the organization to be modified' if args[:orgname].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unknown service. Please use one of the accepted services: #{DS_SERVICES.join(',')}" if not DS_SERVICES.include? args[:service]
      raise 'Please specify a soft limit (true or false)' if not ['true', 'false'].include? args[:soft_limit]

      org = ::Organization.find(name: orgname)

      raise "The name '#{orgname}' does not correspond to any organization" if org.nil?

      service_quota_key = "soft_#{service}_limit="
      user.send(service_quota_key, soft_limit)
      org.save

      puts "Changed the organization soft limit for service #{service} to #{soft_limit}."
    end
  end
end
