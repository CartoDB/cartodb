module CartoDB
  module UserDecorator
    include AccountTypeHelper
    BUILDER_ACTIVATION_DATE = Date.new(2016, 11, 11).freeze

    # Options:
    # - show_api_calls: load api calls. Default: true.
    # - extended: load real_table_count and last_active_time. Default: false.
    def data(options = {})
      calls = options.fetch(:show_api_calls, true) ? get_api_calls(from: last_billing_cycle, to: Date.today) : []
      calls.fill(0, calls.size..29)

      db_size_in_bytes = self.db_size_in_bytes

      data = {
        id: id,
        email: email,
        name: name,
        last_name: last_name,
        created_at: created_at,
        username: username,
        account_type: account_type,
        account_type_display_name: plan_name(account_type),
        table_quota: table_quota,
        table_count: table_count,
        public_visualization_count: public_visualization_count,
        all_visualization_count: all_visualization_count,
        visualization_count: visualization_count,
        owned_visualization_count: owned_visualizations_count,
        failed_import_count: failed_import_count,
        success_import_count: success_import_count,
        import_count: import_count,
        last_visualization_created_at: last_visualization_created_at,
        quota_in_bytes: quota_in_bytes,
        db_size_in_bytes: db_size_in_bytes,
        db_size_in_megabytes: db_size_in_bytes.present? ? (db_size_in_bytes / (1024.0 * 1024.0)).round(2) : nil,
        remaining_table_quota: remaining_table_quota,
        remaining_byte_quota: remaining_quota(false, db_size_in_bytes).to_f,
        api_calls: calls,
        api_calls_quota: organization_user? ? organization.map_view_quota : map_view_quota,
        api_calls_block_price: organization_user? ? organization.map_view_block_price : map_view_block_price,
        geocoding: {
          quota:       organization_user? ? organization.geocoding_quota : geocoding_quota,
          block_price: organization_user? ? organization.geocoding_block_price : geocoding_block_price,
          monthly_use: organization_user? ? organization.get_geocoding_calls : get_geocoding_calls,
          hard_limit:  hard_geocoding_limit?
        },
        here_isolines: {
          quota:       organization_user? ? organization.here_isolines_quota : here_isolines_quota,
          block_price: organization_user? ? organization.here_isolines_block_price : here_isolines_block_price,
          monthly_use: organization_user? ? organization.get_here_isolines_calls : get_here_isolines_calls,
          hard_limit:  hard_here_isolines_limit?
        },
        geocoder_provider: geocoder_provider,
        isolines_provider: isolines_provider,
        routing_provider: routing_provider,
        obs_snapshot: {
          quota:       organization_user? ? organization.obs_snapshot_quota : obs_snapshot_quota,
          block_price: organization_user? ? organization.obs_snapshot_block_price : obs_snapshot_block_price,
          monthly_use: organization_user? ? organization.get_obs_snapshot_calls : get_obs_snapshot_calls,
          hard_limit:  hard_obs_snapshot_limit?
        },
        obs_general: {
          quota:       organization_user? ? organization.obs_general_quota : obs_general_quota,
          block_price: organization_user? ? organization.obs_general_block_price : obs_general_block_price,
          monthly_use: organization_user? ? organization.get_obs_general_calls : get_obs_general_calls,
          hard_limit:  hard_obs_general_limit?
        },
        twitter: {
          enabled:     organization_user? ? organization.twitter_datasource_enabled : twitter_datasource_enabled,
          quota:       organization_user? ? organization.twitter_datasource_quota : twitter_datasource_quota,
          block_price: organization_user? ? organization.twitter_datasource_block_price : twitter_datasource_block_price,
          block_size:  organization_user? ? organization.twitter_datasource_block_size : twitter_datasource_block_size,
          monthly_use: organization_user? ? organization.get_twitter_imports_count : get_twitter_imports_count,
          hard_limit:  hard_twitter_datasource_limit,
          customized_config: CartoDB::Datasources::DatasourcesFactory.customized_config?(CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME, self)
        },
        mailchimp: {
          enabled: Carto::AccountType.new.mailchimp?(self)
        },
        mapzen_routing: {
          quota:       organization_user? ? organization.mapzen_routing_quota : mapzen_routing_quota,
          block_price: organization_user? ? organization.mapzen_routing_block_price : mapzen_routing_block_price,
          monthly_use: organization_user? ? organization.get_mapzen_routing_calls : get_mapzen_routing_calls,
          hard_limit:  hard_mapzen_routing_limit?
        },
        salesforce: {
          enabled: organization_user? ? organization.salesforce_datasource_enabled : salesforce_datasource_enabled
        },
        billing_period: last_billing_cycle,
        api_key: api_key,
        layers: layers.map(&:public_values),
        trial_ends_at: trial_ends_at,
        upgraded_at: upgraded_at,
        show_trial_reminder: trial_ends_at.present?,
        show_upgraded_message: (account_type.downcase != 'free' && upgraded_at && upgraded_at + 15.days > Date.today ? true : false),
        show_builder_activated_message: created_at < BUILDER_ACTIVATION_DATE,
        actions: {
          private_tables: private_tables_enabled,
          private_maps: private_maps_enabled?,
          remove_logo: remove_logo?,
          sync_tables: sync_tables_enabled,
          google_maps_geocoder_enabled: google_maps_geocoder_enabled?,
          google_maps_enabled: google_maps_enabled?,
          engine_enabled: engine_enabled?,
          builder_enabled: builder_enabled?,
          mobile_sdk_enabled: mobile_sdk_enabled?
        },
        limits: {
          concurrent_syncs: CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount::MAX_SYNCS_PER_USER,
          concurrent_imports: max_concurrent_import_count,
          import_file_size: max_import_file_size,
          import_table_rows: max_import_table_row_count,
          max_layers: max_layers
        },
        notification: notification,
        avatar_url: avatar,
        feature_flags: feature_flags,
        base_url: public_url,
        needs_password_confirmation: needs_password_confirmation?,
        viewer: viewer,
        org_admin: organization_admin?,
        description: description,
        website: website,
        twitter_username: twitter_username,
        disqus_shortname: disqus_shortname,
        available_for_hire: available_for_hire,
        location: location,
        industry: industry,
        company: company,
        phone: phone,
        job_role: job_role
      }

      if google_maps_geocoder_enabled? && (!organization.present? || organization_owner?)
        data[:google_maps_private_key] = google_maps_private_key
      end

      if organization.present?
        data[:organization] = organization.to_poro
        data[:organization][:available_quota_for_user] = organization.unassigned_quota + quota_in_bytes
      end

      if !groups.nil?
        data[:groups] = groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro }
      end

      if options[:extended]
        data.merge(
          real_table_count: real_tables.size,
          last_active_time: get_last_active_time
        )
      else
        data
      end
    end
  end
end
