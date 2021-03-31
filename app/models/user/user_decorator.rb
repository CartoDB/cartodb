module CartoDB
  module UserDecorator
    include AccountTypeHelper

    def activity(options = {})
      user = Carto::User.find_by(username: username)

      {
        id: id,
        email: email,
        username: username,
        state: state,
        account_type: account_type,
        table_count: table_count,
        public_map_count: public_privacy_visualization_count + link_privacy_visualization_count +
          password_privacy_visualization_count,
        private_map_count: private_privacy_visualization_count,
        map_count: all_visualization_count,
        map_views: user.map_views_count,
        geocoding_credits_count: organization_user? ? organization.get_geocoding_calls : get_geocoding_calls,
        routing_credits_count: organization_user? ? organization.get_mapzen_routing_calls : get_mapzen_routing_calls,
        isolines_credits_count: organization_user? ? organization.get_here_isolines_calls : get_here_isolines_calls,
        billing_period: last_billing_cycle ? last_billing_cycle.strftime('%Q') : nil,
        regular_api_key_count: api_keys.by_type('regular').count
      }
    end

    # Options:
    # - extended: load real_table_count and last_active_time. Default: false.
    def data(options = {})
      db_size_in_bytes = self.db_size_in_bytes

      data = {
        id: id,
        email: email,
        name: name,
        last_name: last_name,
        created_at: created_at,
        username: username,
        state: state,
        account_type: account_type,
        account_type_display_name: plan_name(account_type),
        table_quota: table_quota,
        public_map_quota: public_map_quota,
        public_dataset_quota: public_dataset_quota,
        private_map_quota: private_map_quota,
        regular_api_key_quota: regular_api_key_quota,
        table_count: table_count,
        public_visualization_count: public_visualization_count,
        public_privacy_map_count: public_privacy_visualization_count,
        link_privacy_map_count: link_privacy_visualization_count,
        password_privacy_map_count: password_privacy_visualization_count,
        private_privacy_map_count: private_privacy_visualization_count,
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
        storage: {}, # Never used here. This line is just for test compatibility
        map_views: 0, # Never used. Only for test compatibility
        map_views_quota: 0, # Never used. Only for test compatibility
        remaining_table_quota: remaining_table_quota,
        remaining_byte_quota: remaining_quota(db_size_in_bytes).to_f,
        unverified: unverified?,
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
        show_trial_reminder: show_trial_reminder?,
        show_upgraded_message: (account_type.downcase != 'free' && upgraded_at && upgraded_at + 15.days > Date.today ? true : false),
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
        email_notifications: decorate_email_notifications,
        avatar_url: avatar,
        feature_flags: feature_flags_names,
        base_url: public_url,
        needs_password_confirmation: needs_password_confirmation?,
        viewer: viewer,
        org_admin: organization_admin?,
        description: description,
        website: website,
        twitter_username: twitter_username,
        disqus_shortname: disqus_shortname,
        role_display: role_display,
        available_for_hire: available_for_hire,
        location: location,
        industry: industry,
        company_employees: company_employees,
        use_case: use_case,
        company: company,
        phone: phone,
        job_role: job_role
      }

      if google_maps_geocoder_enabled? && (!organization.present? || organization_owner?)
        data[:google_maps_private_key] = google_maps_private_key
      end

      if organization.present?
        data[:organization] = ::OrganizationPresenter.new(organization).to_poro
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
