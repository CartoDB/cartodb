namespace :cartodb do
  namespace :metrics do
    # service provider names
    PROVIDERS = ['heremaps', 'google', 'mapzen', 'mapbox', 'tomtom', 'geocodio'].freeze
    SERVICES = {
      geocoder: { method: :get_geocoding_calls, column: 'geocoder_provider' },
      isolines: { method: :get_here_isolines_calls, column: 'isolines_provider' },
      routing: { method: :get_mapzen_routing_calls, column: 'routing_provider' }
    }.freeze

    # e.g. bundle exec rake cartodb:metrics:ds_provider_metrics['heremaps','2018-01-01','2018-01-31']
    #      bundle exec rake cartodb:metrics:ds_provider_metrics['heremaps','2018-01-01','2018-01-31','/tmp/test.csv']
    desc 'Get DS provider metrics in a defined period of time'
    task :ds_provider_metrics, [:provider, :from, :to, :output_file] => :environment do |_t, args|
      provider = args[:provider]
      from = args[:from].blank? ? nil : args[:from].to_date
      to = args[:to].blank? ? nil : args[:to].to_date
      if provider.nil? || from.nil? || to.nil?
        raise "Either the provider or one of the dates is not provided as argument"
      end
      unless PROVIDERS.include?(provider)
        raise "The provider passed as argument is not correct. The accepted values are #{DS_PROVIDERS}"
      end
      default_output_file = "/tmp/ds_metrics_#{provider}_#{from.strftime('%Y%m%d')}_#{to.strftime('%Y%m%d')}.csv"
      output_file = args[:output_file].blank? ? default_output_file : args[:output_file]
      date_from = from.strftime('%Y-%m-%d')
      date_to = to.strftime('%Y-%m-%d')
      CSV.open(output_file, "wb") do |csv|
        SERVICES.each do |service, data|
          Carto::User.where(data[:column] => provider).find_each do |user|
            usage = nil
            organization_name = nil
            if user.organization_owner?
              usage = user.organization.public_send(data[:method], to: to, from: from)
              organization_name = user.organization.name
            elsif not user.organization_user?
              usage = user.public_send(data[:method], {to: to, from: from})
            end
            if !usage.nil? and usage > 0
              csv << [provider, service, date_from, date_to, organization_name, user.username, usage]
            end
          end
        end
      end
    end

    # e.g. bundle exec rake cartodb:metrics:ds_user_metrics['rtorre','2019-01-01','2019-01-31']
    #      bundle exec rake cartodb:metrics:ds_user_metrics['rtorre','2019-01-01','2019-01-31','/tmp/test.csv']
    desc 'Get DS daily usage metrics for a user within a period of time'
    task :ds_user_metrics, [:username, :from, :to, :output_file] => :environment do |_t, args|
      username = args[:username]
      from = args.from.to_date
      to = args.to.to_date
      default_output_file = "/tmp/ds_metrics_#{username}_#{from.strftime('%Y%m%d')}_#{to.strftime('%Y%m%d')}.csv"
      args.with_defaults(output_file: default_output_file)
      user = Carto::User.where(username: username).first
      CSV.open(args.output_file, "wb") do |csv|
        SERVICES.each do |service, data|
          provider = user[data[:column]]
          from.upto(to) do |date|
            usage = user.public_send(data[:method], from: date, to: date, orgwise: false)
            if !usage.nil? && usage > 0
              csv << [username, service, provider, date.strftime('%Y-%m-%d'), usage]
            end
          end
        end
      end
    end

    # e.g. bundle exec rake cartodb:metrics:ds_org_metrics['team','2019-01-01','2019-01-31']
    #      bundle exec rake cartodb:metrics:ds_org_metrics['team','2019-01-01','2019-01-31','/tmp/test.csv']
    desc 'Get DS daily usage metrics for a user within a period of time'
    task :ds_org_metrics, [:orgname, :from, :to, :output_file] => :environment do |_t, args|
      orgname = args[:orgname]
      from = args.from.to_date
      to = args.to.to_date
      default_output_file = "/tmp/ds_metrics_#{orgname}_#{from.strftime('%Y%m%d')}_#{to.strftime('%Y%m%d')}.csv"
      args.with_defaults(output_file: default_output_file)
      organization_id = Carto::Organization.where(name: orgname).first.id
      CSV.open(args.output_file, "wb") do |csv|
        Carto::User.where(organization_id: organization_id).find_each do |user|
          SERVICES.each do |service, data|
            provider = user[data[:column]]
            from.upto(to) do |date|
              usage = user.public_send(data[:method], from: date, to: date, orgwise: false)
              if !usage.nil? && usage > 0
                csv << [user.username, service, provider, date.strftime('%Y-%m-%d'), usage]
              end
            end
          end
        end
      end
    end
  end
end
