namespace :cartodb do
  namespace :connectors do

    desc "Create Connector Providers for Provider Classes"
    task create_providers: :environment do
      Carto::Connector.providers(all: true).keys.each do |provider_name|
        unless Carto::ConnectorProvider.where(name: provider_name).exists?
          puts "Creating ConnectorProvider #{provider_name}"
          Carto::ConnectorProvider.create! name: provider_name
        end
      end
      providers = Carto::Connector.providers(all: true).keys
      Carto::ConnectorProvider.where.not(name: providers).each do |provider|
        puts "Provider #{provider.name} is not configured in the code!"
      end
    end

    def find_by_uuid_or_name(id_or_name, klass, name_attribute = :name)
      include Carto::UUIDHelper
      if uuid?(id_or_name)
        klass.find(id_or_name)
      else
        klass.where(name_attribute => id_or_name).first
      end
    end

    def with_provider_user_config(args)
      provider = find_by_uuid_or_name(args.provider, Carto::ConnectorProvider)
      user     = find_by_uuid_or_name(args.user, Carto::User, :username)
      puts "Provider not found: #{args.provider}" if provider.blank?
      puts "User not found: #{args.user}" if user.blank?
      if provider.present? && user.present?
        active_config = user.connector_configuration(provider.name)
        user_config = Carto::ConnectorConfiguration.where(
          connector_provider_id: provider.id, user_id: user.id
        ).first
        if user.organization.present?
          org_config = Carto::ConnectorConfiguration.where(
            connector_provider_id: provider.id, organization_id: user.organization.id
          ).first
        end
        provider_config = Carto::ConnectorConfiguration.default(provider)
        yield provider, user, active_config, user_config, org_config, provider_config
      end
    end

    def with_provider_org_config(args)
      provider = find_by_uuid_or_name(args.provider, Carto::ConnectorProvider)
      org      = find_by_uuid_or_name(args.org, Carto::Organization)
      puts "Provider not found: #{args.provider}" if provider.blank?
      puts "Organization not found: #{args.org}" if org.blank?
      if provider.present? && org.present?
        org_config = Carto::ConnectorConfiguration.where(
          connector_provider_id: provider.id, organization_id: org.id
        ).first
        provider_config = Carto::ConnectorConfiguration.default(provider)
        yield provider, org, org_config, provider_config
      end
    end

    def with_provider_config(args)
      provider = find_by_uuid_or_name(args.provider, Carto::ConnectorProvider)
      puts "Provider not found: #{args.provider}" if provider.blank?
      if provider.present?
        provider_config = Carto::ConnectorConfiguration.default(provider)
        yield provider, provider_config
      end
    end

    def max_rows_description(max_rows)
      max_rows.to_i == 0 ? '(unlimited)' : max_rows.to_s
    end

    desc "Check user connector configuration"
    task :show_user_config, [:provider, :user] => :environment do |_task, args|
      with_provider_user_config(args) do |provider, user, config, user_config, org_config, provider_config|
        puts "Connector #{provider.name} configuration for user #{user.username}:"
        puts "  Enabled: #{config.enabled?}"
        puts "  Max. Rows: #{max_rows_description config.max_rows}"
        if user_config
          puts "Using user-specific configuration"
        elsif org_config
          puts "Using organization #{org_config.organization.name} configuration"
        elsif provider_config
          puts "Using #{provider_config.connector_provider.name} defaults"
        else
          puts "Using default configuration"
        end
      end
    end

    desc "Set user connector configuration"
    task :set_user_config, [:provider, :user, :enabled, :max_rows] => :environment do |_task, args|
      with_provider_user_config(args) do |provider, user, _config, user_config, _org_config, _provider_config|
        if args.enabled.casecmp('default').zero? && !args.max_rows
          # rake cartodb:connectors:user_config[provider,user,default] will reset to the default configuration
          puts "Will reset configuration for #{provider.name} and user #{user.username}"
          if user_config
            puts "  Removing existing configuration:"
            puts "    Enabled: #{user_config.enabled.inspect}"
            puts "    Max. Rows: #{max_rows_description user_config.max_rows}"
            user_config.destroy
          else
            puts "  User didn't have specific configuration"
          end
        else
          enabled = args.enabled.casecmp('true').zero?
          max_rows = args.max_rows.to_i
          max_rows = nil if max_rows == 0
          if user_config
            puts "Will update configuration for #{provider.name} and user #{user.username}"
            puts "  New configuration:"
            puts "    Enabled: #{enabled.inspect}"
            puts "    Max. Rows: #{max_rows_description max_rows}"
            puts "  Existing configuration:"
            puts "    Enabled: #{user_config.enabled.inspect}"
            puts "    Max. Rows: #{max_rows_description user_config.max_rows}"
            user_config.update_attributes! enabled: enabled, max_rows: max_rows
          else
            puts "Will create a new configuration for #{provider.name} and user #{user.username}"
            puts "  New configuration: enabled:"
            puts "    Enabled: #{enabled.inspect}"
            puts "    Max. Rows: #{max_rows_description max_rows}"
            Carto::ConnectorConfiguration.create!(
              connector_provider: provider,
              user: user,
              enabled: enabled,
              max_rows: max_rows
            )
          end
        end
      end
    end

    desc "Check organization connector configuration"
    task :show_org_config, [:provider, :org] => :environment do |_task, args|
      with_provider_org_config(args) do |provider, org, org_config, provider_config|
        puts "Connector #{provider.name} configuration for organization #{org.name}:"
        if org_config
          puts "Using organization-specific configuration:"
          puts "  Enabled: #{org_config.enabled?}"
          puts "  Max. Rows: #{max_rows_description org_config.max_rows}"
        elsif provider_config
          puts "Using #{provider_config.connector_provider.name} defaults:"
          puts "  Enabled: #{provider_config.enabled?}"
          puts "  Max. Rows: #{max_rows_description provider_config.max_rows}"
        else
          puts "Using default configuration"
        end
      end
    end

    desc "Set organization connector configuration"
    task :set_org_config, [:provider, :org, :enabled, :max_rows] => :environment do |_task, args|
      with_provider_org_config(args) do |provider, org, org_config, provider_config|
        if args.enabled.casecmp('default').zero? && !args.max_rows
          # rake cartodb:connectors:org_config[provider,org,default] will reset to the default configuration
          puts "Will reset configuration for #{provider.name} and user #{org.name}"
          if org_config
            puts "  Removing existing configuration:"
            puts "    Enabled: #{org_config.enabled?}"
            puts "    Max. Rows: #{max_rows_description org_config.max_rows}"
            org_config.destroy
          else
            puts "  Organization didn't have specific configuration"
          end
        else
          enabled = args.enabled.casecmp('true').zero?
          max_rows = args.max_rows.to_i
          max_rows = nil if max_rows == 0
          if org_config
            puts "Will update configuration for #{provider.name} and org. #{org.name}"
            puts "  New configuration: enabled:"
            puts "    Enabled: #{enabled.inspect}"
            puts "    Max. Rows: #{max_rows_description max_rows}"
            puts "  Existing configuration: enabled:"
            puts "    Enabled: #{org_config.enabled?}"
            puts "    Max. Rows: #{max_rows_description org_config.max_rows}"
            org_config.update_attributes! enabled: enabled, max_rows: max_rows
          else
            puts "Will create a new configuration for #{provider.name} and org. #{org.name}"
            puts "  New configuration: enabled:"
            puts "    Enabled: #{enabled.inspect}"
            puts "    Max. Rows: #{max_rows_description max_rows}"
            Carto::ConnectorConfiguration.create!(
              connector_provider: provider,
              organization: org,
              enabled: enabled,
              max_rows: max_rows
            )
          end
        end
      end
    end

    desc "Check connector configuration"
    task :show_config, [:provider] => :environment do |_task, args|
      with_provider_config(args) do |provider, provider_config|
        puts "Connector #{provider.name} configuration:"
        if provider_config
          puts "Using #{provider_config.connector_provider.name} defaults:"
          puts "  Enabled: #{provider_config.enabled?}"
          puts "  Max. Rows: #{max_rows_description provider_config.max_rows}"
        else
          puts "Using default configuration"
        end
      end
    end

    desc 'Adapt connector synchronizations to the new API'
    task adapt_api: :environment do

      def get_ignoring_case(hash, key)
        _k, v = hash.find { |k, _v| k.to_s.casecmp(key.to_s) == 0 }
        v
      end

      # This is meant to be run before deploying the new API (#9674).
      # Some syncs may fail before deployment is done (because they expect the newer API),
      # but deployment will be hopefully done before they're retried, so they should succeed then.
      # No attempt is done to avoid changing 'dead' syncs (left 'created' or retried too many times).
      # This is idempotent and will do no harm to connectors that use the new API.
      Carto::Synchronization.where(service_name: 'connector').find_each do |sync|
        parameters = JSON.load(sync.service_item_id) rescue nil
        if parameters
          provider = get_ignoring_case(parameters, 'provider')
          if !provider
            puts "Adapting #{sync.id}"
            parameters['provider'] = 'odbc'
            sync.service_item_id = parameters.to_json
            sync.save!
          end
        end
      end
    end
  end
end
