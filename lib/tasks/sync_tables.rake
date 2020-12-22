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

  desc 'Port BQ syncs to beta connector'
  task port_bq_syncs_to_beta: [:environment] do |task, args|
    def report_incompatible_parameters(parameters)
      valid_params = %w(provider connection table sql_query import_as project dataset billing_project)
      valid_conn_params = %w(billing_project service_account access_token refresh_token default_project default_dataset)
      invalid_params = parameters.keys - valid_params
      invalid_conn_params = (parameters['connection'] || {}).keys - valid_conn_params
      puts "  Invalid parameters: #{invalid_params.inspect}" if invalid_params.present?
      puts "  Invalid connection parameters: #{invalid_conn_params.inspect}" if invalid_conn_params.present?
    end

    def replicate_bq_config(user)
      # Rake::Task["cartodb:connectors:set_user_config"].invoke('bigquery-beta',user.username,true,1000000)
      bigquery = Carto::ConnectorProvider.find_by(name: 'bigquery')
      bigquery_beta = Carto::ConnectorProvider.find_by(name: 'bigquery-beta')
      bigquery_config = user.connector_configuration(bigquery.name)
      bigquery_beta_config = user.connector_configuration(bigquery_beta.name)
      # FIXME: configuration could be at organization level or default configuration
      if bigquery_config.present? && bigquery_beta_config.blank?
        Carto::ConnectorConfiguration.create!(
          connector_provider: bigquery_beta,
          user: user,
          enabled: bigquery_config.enabled,
          max_rows: bigquery_config.max_rows
        )
      end
    end

    dry_mode = ENV['DRY_RUN'] != 'NO'

    unless dry_mode
      Rake::Task["cartodb:connectors:create_providers"].invoke
    end
    sync_users = []

    number_of_pending_syncs = 0
    Carto::Synchronization.where(%{
        service_name = 'connector'
        AND (state IN ('#{Carto::Synchronization::STATE_SUCCESS}', '#{Carto::Synchronization::STATE_SYNCING}', '#{Carto::Synchronization::STATE_QUEUED}', '#{Carto::Synchronization::STATE_CREATED}')
          OR (state = '#{Carto::Synchronization::STATE_FAILURE}' AND retried_times < #{CartoDB::Synchronization::Member::MAX_RETRIES}))
        AND ((service_item_id::JSON)#>>'{provider}') = 'bigquery'
    }).find_each do |synchronization|
      next unless synchronization.user.state == 'active'

      sleep 0.2
      synchronization.transaction do
        synchronization.reload
        parameters = JSON.parse(synchronization.service_item_id)
        if synchronization.state.in? [
          Carto::Synchronization::STATE_CREATED,
          Carto::Synchronization::STATE_QUEUED,
          Carto::Synchronization::STATE_SYNCING
        ]
          puts "Synchronization #{synchronization.id} could not be modifed because its state was #{synchronization.state}"
          number_of_pending_syncs += 1
        elsif dry_mode
          puts "Synchronization #{synchronization.id} would be modified to use bigquery-beta"
          puts '  parameter billing_project would be moved to connection' if parameters['billing_project'].present?
          report_incompatible_parameters(parameters)
        else
          user = synchronization.user
          unless user.username.in?(sync_users)
            sync_users << user.username
            replicate_bq_config(user)
          end
          begin
            puts "Modifying #{synchronization.id} to use bigquery-beta"
            run_at = synchronization.run_at
            synchronization.update_attributes! run_at: nil

            # Change the provider id
            parameters['provider'] = 'bigquery-beta'
            # If passing the billing project out of the connection move it inside
            if parameters['billing_project'].present?
              puts "  Moving billing_project inside the connection parameter"
              billing_project = parameters.delete('billing_project')
              parameters['connection'] ||= {}
              parameters['connection']['billing_project'] = billing_project
            end
            synchronization.update! service_item_id: parameters.to_json
            report_incompatible_parameters(parameters)
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
end
