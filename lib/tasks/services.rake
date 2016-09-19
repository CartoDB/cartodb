namespace :cartodb do
  namespace :services do

    # usage example:
    #   bundle exec rake cartodb:service:set_user_provider['username','geocoder','mapzen']
    desc 'Set the provider for a service'
    task :set_user_provider, [:username, :service, :provider] => [:environment] do |task, args|
      SERVICES=['geocoder', 'routing', 'isolines']
      PROVIDERS=['here', 'google', 'mapzen']

      username = args[:username]
      service = args[:service]
      provider = args[:provider]

      raise 'Please specify the username of the user to be modified' if args[:username].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unkown service. Please use one of the accepted services: #{SERVICES.join(',')}" if not SERVICES.include? args[:service]
      raise 'Please specify the provider to be set' if args[:provider].blank?
      raise "Unkown provider. Please use one of the accepted providers: #{PROVIDERS.join(',')}" if not PROVIDERS.include? args[:provider]

      user = ::User.find(username: username)

      raise "The username '#{username}' does not correspond to any user" if user.nil?

      service_key = "#{service}_provider="
      user.send(service_key, provider)
      user.save

      puts "Changed the user service provider for #{service} to #{provider}."
    end

    # usage example:
    #   bundle exec rake cartodb:service:set_organization_provider['orgname','geocoder','mapzen']
    desc 'Set the provider for a service'
    task :set_organization_provider, [:orgname, :service, :provider] => [:environment] do |task, args|
      SERVICES=['geocoder', 'routing', 'isolines']
      PROVIDERS=['here', 'google', 'mapzen']

      orgname = args[:orgname]
      service = args[:service]
      provider = args[:provider]

      raise 'Please specify the organization to be modified' if args[:orgname].blank?
      raise 'Please specify the service to set the provider' if args[:service].blank?
      raise "Unkown service. Please use one of the accepted services: #{SERVICES.join(',')}" if not SERVICES.include? args[:service]
      raise 'Please specify the provider to be set' if args[:provider].blank?
      raise "Unkown provider. Please use one of the accepted providers: #{PROVIDERS.join(',')}" if not PROVIDERS.include? args[:provider]

      org = ::Organization.find(name: orgname)

      raise "The orgname '#{orgname}' does not correspond to any user" if org.nil?

      service_key = "#{service}_provider="
      org.send(service_key, provider)
      org.save

      puts "Changed the organization service provider for #{service} to #{provider}."
    end
  end
end
