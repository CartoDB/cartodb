namespace :cartodb do
  # This rake retrieves all sync tables that should get synchronized, and puts the synchronization tasks at Resque
  # NOTE: This version does not mark the tables as "enqueued", should be done if planning to run multiple instances
  desc 'Runs the sync tables process'
  task :sync_tables, [:force_all_arg] => [:environment] do |task, args|
    puts '> Sync tables started' if ENV['VERBOSE']

    require_relative '../../services/synchronizer/lib/synchronizer/collection'
    collection = CartoDB::Synchronizer::Collection.new

    # This fetches and enqueues
    collection.fetch_and_enqueue(args[:force_all_arg].present? ? args[:force_all_arg] : false)

    puts '> Sync tables finished' if ENV['VERBOSE']
  end


  desc 'Adds visualization_id to every Synchronization'
  task :populate_synchronization_visualization_ids => [:environment] do |task, args|
    require_relative '../../services/synchronizer/lib/synchronizer/collection'
    collection = CartoDB::Synchronizer::Collection.new

    collection.fetch_all.each { |record|
      begin
        synchronization = CartoDB::Synchronization::Member.new(id: record[:id]).fetch
      rescue KeyError
        synchronization = nil
      end
      if synchronization
        begin
          table = UserTable.where({
              name: synchronization.name,
              user_id: synchronization.user_id
            }).first
          if table.nil?
            puts "\nSync id '#{record[:id]}' related table not found"
          else
            table = table.service
          end
        rescue StandardError => exception
          table = nil
          puts "\nSync id '#{record[:id]}' errored: #{exception.inspect}"
        end
        unless table.nil?
          if synchronization.visualization_id.nil?
            begin
              synchronization.visualization_id = table.table_visualization.id
            rescue StandardError => exception
              puts "\nSync id '#{record[:id]}' errored, canonical visualization not found"
            end
            begin
              synchronization.store
              printf '.'
            rescue StandardError => exception
              puts "\nSync id '#{record[:id]}' errored: #{exception.inspect}"
            end
          else
            printf 'S'
          end
        end
      else
        puts "\nSync id '#{record[:id]}' errored: missing synchronization entry"
      end
    }
    puts "\nFINISHED"

  end

  def report_incompatible_bq_parameters(parameters)
    valid_params = %w(provider connection table sql_query import_as project dataset billing_project)
    valid_conn_params = %w(billing_project service_account access_token refresh_token default_project default_dataset)
    invalid_params = parameters.keys - valid_params
    invalid_conn_params = (parameters['connection'] || {}).keys - valid_conn_params
    puts "  Invalid parameters: #{invalid_params.inspect}" if invalid_params.present?
    puts "  Invalid connection parameters: #{invalid_conn_params.inspect}" if invalid_conn_params.present?
  end

  def replicate_bq_config
    puts 'Replicating configuration'
    bigquery = Carto::ConnectorProvider.find_by(name: 'bigquery')
    bigquery_beta = Carto::ConnectorProvider.find_by(name: 'bigquery-beta')
    Carto::ConnectorConfiguration.where(connector_provider_id: bigquery.id).find_each do |bq_config|
      unless Carto::ConnectorConfiguration.where(
        connector_provider_id: bigquery_beta.id,
        user_id: bq_config.user_id,
        organization_id: bq_config.organization_id
      ).exists?
        Carto::ConnectorConfiguration.create!(
          connector_provider: bigquery_beta,
          user_id: bq_config.user_id,
          organization_id: bq_config.organization_id,
          enabled: bq_config.enabled,
          max_rows: bq_config.max_rows
        )
        puts "  configuration for #{bq_config.user&.username || bq_config.configuration.name} replicated"
      end
    end
  end

  def bq_syncs_query(user: nil, sync: nil)
    condition = ''
    condition += "AND user_id = '#{user.id}'" if user.present?
    condition += "AND id = '#{sync.id}'" if sync.present?
    %{
      service_name = 'connector'
      #{condition}
      AND (state IN (
            '#{Carto::Synchronization::STATE_SUCCESS}', '#{Carto::Synchronization::STATE_SYNCING}',
            '#{Carto::Synchronization::STATE_QUEUED}', '#{Carto::Synchronization::STATE_CREATED}')
        OR (state = '#{Carto::Synchronization::STATE_FAILURE}'
              AND retried_times < #{CartoDB::Synchronization::Member::MAX_RETRIES}))
      AND ((service_item_id::JSON)#>>'{provider}') = 'bigquery-beta'
    }
  end

  def bq_sync_blocked_states
    [
      Carto::Synchronization::STATE_CREATED,
      Carto::Synchronization::STATE_QUEUED,
      Carto::Synchronization::STATE_SYNCING
    ]
  end

  desc 'Port BQ syncs to beta connector'
  task port_bq_syncs_to_beta: [:environment] do
    dry_mode = ENV['DRY_RUN'] != 'NO'

    if dry_mode
      puts 'running in "dry" mode; set DRY_RUN=NO to make actual changes'
    else
      Rake::Task['cartodb:connectors:create_providers'].invoke
      replicate_bq_config
    end

    number_of_pending_syncs = 0
    Carto::Synchronization.where(bq_syncs_query).find_each do |synchronization|
      next unless synchronization.user.state == 'active'

      sleep 0.2
      synchronization.transaction do
        synchronization.reload
        parameters = JSON.parse(synchronization.service_item_id)
        if synchronization.state.in? bq_sync_blocked_states
          puts "Synchronization #{synchronization.id} could not be modifed; state: #{synchronization.state}"
          number_of_pending_syncs += 1
        elsif dry_mode
          puts "Synchronization #{synchronization.id} would be modified to use bigquery-beta"
          report_incompatible_bq_parameters(parameters)
        else
          begin
            puts "Modifying #{synchronization.id} to use bigquery-beta"
            run_at = synchronization.run_at
            synchronization.update! run_at: nil

            # Change the provider id
            parameters['provider'] = 'bigquery-beta'
            synchronization.update! service_item_id: parameters.to_json
            report_incompatible_bq_parameters(parameters)
          rescue
            raise
          ensure
            synchronization.update! run_at: run_at
          end
        end
      end
    end
    if number_of_pending_syncs.positive?
      puts "#{number_of_pending_syncs} syncs could not be modified. . Please try again later."
    end
  end

  desc 'Port BQ beta syncs to new connector'
  task :port_beta_bq_syncs_to_new, [:username_or_sync_id] => :environment do |_task, args|
    dry_mode = ENV['DRY_RUN'] != 'NO'

    puts 'running in "dry" mode; set DRY_RUN=NO to make actual changes' if dry_mode

    if args.username_or_sync_id != 'all-the-users'
      user = Carto::User.find_by(username: args.username_or_sync_id)
      if user.blank?
        sync = Carto::Synchronization.find_by(id: args.username_or_sync_id)
        raise "User/Sync not found: #{args.username_or_sync_id}" unless sync
      end
    end

    sql = bq_syncs_query(user: user, sync: sync)

    number_of_pending_syncs = 0
    Carto::Synchronization.where(sql).find_each do |synchronization|
      next unless synchronization.user.state == 'active'

      sleep 0.2
      synchronization.transaction do
        synchronization.reload
        parameters = JSON.parse(synchronization.service_item_id)
        if synchronization.state.in? bq_sync_blocked_states
          puts "Synchronization #{synchronization.id} could not be modifed; state: #{synchronization.state}"
          number_of_pending_syncs += 1
        elsif dry_mode
          puts "Synchronization #{synchronization.id} would be modified to use bigquery"
          puts '  parameter billing_project would be moved to connection' if parameters['billing_project'].present?
          report_incompatible_bq_parameters(parameters)
        else
          begin
            puts "Modifying #{synchronization.id} to use bigquery"
            run_at = synchronization.run_at
            synchronization.update! run_at: nil

            # Change the provider id
            parameters['provider'] = 'bigquery'
            # If passing the billing project out of the connection move it inside
            if parameters['billing_project'].present?
              puts '  Moving billing_project inside the connection parameter'
              billing_project = parameters.delete('billing_project')
              parameters['connection'] ||= {}
              parameters['connection']['billing_project'] = billing_project
            end
            synchronization.update! service_item_id: parameters.to_json
            report_incompatible_bq_parameters(parameters)
          rescue
            raise
          ensure
            synchronization.update! run_at: run_at
          end
        end
      end
    end
    if number_of_pending_syncs.positive?
      puts "#{number_of_pending_syncs} syncs could not be modified. . Please try again later."
    end
  end

  desc 'Migrate legacy sync tables to new connections'
  task :migrate_legacy_sync_tables_to_new_connections, [:username, :synchronization_ids, :flexible_password] => :environment do |_task, args|

    # NOTE: Managing user
    user = Carto::User.find_by(username: args[:username])
    if user.blank?
      puts "> ERROR: Missing user with username '#{args[:username]}'"
      next
    end

    # NOTE: Managing synchronizations
    sync_ids = (args[:synchronization_ids].try(:split, ' ') || []).uniq
    synchronizations = user.synchronizations

    if sync_ids.empty?
      puts "> INFO: No synchronizations were provided, so all '#{user.username}' synchronizations will be analyzed"
    else
      synchronizations = synchronizations.where(id: sync_ids)

      if synchronizations.count != sync_ids.count
        puts "> ERROR: #{sync_ids.count} synchronization/s provided, but only #{synchronizations.count} found"
        next
      end
      puts "> INFO: List of #{synchronizations.count} synchronization/s provided"
    end

    # NOTE: Looking for legacy synchronizations
    legacy_syncs = synchronizations.where(url: ['', nil]).select do |sync|
      data = JSON.parse(sync.service_item_id)
      data['provider'].present? && data['connection'].present? && data['connection_id'].blank?
    end

    puts "> INFO: #{legacy_syncs.count} legacy synchronization/s were found"
    next if legacy_syncs.count.zero?

    # NOTE: Finding/creating required connections
    connection_groups = legacy_syncs.group_by do |sync|
      data = JSON.parse(sync.service_item_id)
      [data['provider'], data['connection']]
    end

    puts "> INFO: #{connection_groups.count} unique connections needed"
    if args[:flexible_password] == 'true'
      puts "> INFO: Password parameter will be omitted while looking for existent connections"
    end

    connection_manager = Carto::ConnectionManager.new(user)
    syncs_with_connection = connection_groups.map.with_index do |((provider, connection_info), syncs), index|
      puts "> INFO: Connection #{index} - [#{provider}] #{connection_info}"

      connections = user.db_connections
      connection_info.each do |key, value|
        next if key == 'password' && args[:flexible_password] == 'true'
        connections = connections.where("parameters->>'#{key}' = ?", value)
      end
      connection = connections.find_by(connector: provider)

      if connection.present?
        puts "> INFO: Connection found [#{connection.id}]"
      else
        connection = connection_manager.create_db_connection(
          name: "#{provider} [#{SecureRandom.hex(6)}]",
          provider: provider,
          parameters: connection_info
        )
        puts "> INFO: Connection created [#{connection.id}]"
      end

      {
        connection: connection,
        syncs: syncs,
        password_changed: connection_info['password'] != connection.parameters['password']
      }
    rescue StandardError => exception
      puts "> WARNING: Error finding/creating connection #{index} - #{exception.message}"
      puts "> INFO: Skipping #{syncs.count} synchronization/s - Sample sync [#{syncs.first.id}]"

      { connection: nil, syncs: [] }
    end

    # NOTE: Updating and synchronizations
    syncs_with_connection.each.with_index do |data, index|
      next if data[:connection].nil?

      puts "> INFO: Linking #{data[:syncs].count} synchronization/s to connection #{index}"
      ActiveRecord::Base.transaction do
        data[:syncs].each do |sync|
          service_item_id = JSON.parse(sync.service_item_id).except('connection')
          service_item_id['connection_id'] = data[:connection].id

          sync.update!(service_item_id: service_item_id.to_json)
        end
      end

      # NOTE: Queuing synchronizations
      next unless data[:password_changed]

      data[:syncs].each do |sync|
        next if sync.state != 'failure' || sync.retried_times < CartoDB::Synchronization::Member::MAX_RETRIES

        puts "> INFO: Queueing failed sync [#{sync.id}]"
        CartoDB::Synchronization::Member.new(sync).enqueue
      end
    rescue StandardError => exception
      puts "> WARNING: Error updating synchronizations for connection #{index} - #{exception.message}"
      puts "> INFO: Skipping updating #{syncs.count} synchronization/s - Sample sync [#{data[:syncs].first.id}]"
    end
  rescue StandardError => exception
    puts "> ERROR: Something went wrong while migrating legacy synchronizations | #{exception.inspect}"
  end
end
