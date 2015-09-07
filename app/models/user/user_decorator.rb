module CartoDB
  module UserDecorator
    # Options:
    # - show_api_calls: load api calls. Default: true.
    # - extended: load real_table_count and last_active_time. Default: false.
    def data(options = {})
      calls = options.fetch(:show_api_calls, true) ? self.get_api_calls(from: self.last_billing_cycle, to: Date.today) : []
      calls.fill(0, calls.size..29)

      db_size_in_bytes = self.db_size_in_bytes

      data = {
        id: self.id,
        email: self.email,
        name: self.name,
        username: self.username,
        account_type: self.account_type,
        table_quota: self.table_quota,
        table_count: self.table_count,
        maps_count: self.maps_count,
        public_visualization_count: self.public_visualization_count,
        visualization_count: self.visualization_count,
        failed_import_count: self.failed_import_count,
        success_import_count: self.success_import_count,
        import_count: self.import_count,
        last_visualization_created_at: self.last_visualization_created_at,
        quota_in_bytes: self.quota_in_bytes,
        db_size_in_bytes: db_size_in_bytes,
        db_size_in_megabytes: db_size_in_bytes.present? ? (db_size_in_bytes / (1024.0 * 1024.0)).round(2) : nil,
        remaining_table_quota: self.remaining_table_quota,
        remaining_byte_quota: self.remaining_quota(false, db_size_in_bytes).to_f,
        api_calls: calls,
        api_calls_quota: self.organization_user? ? self.organization.map_view_quota : self.map_view_quota,
        api_calls_block_price: self.organization_user? ? self.organization.map_view_block_price : self.map_view_block_price,
        geocoding: {
          quota:       self.organization_user? ? self.organization.geocoding_quota : self.geocoding_quota,
          block_price: self.organization_user? ? self.organization.geocoding_block_price : self.geocoding_block_price,
          monthly_use: self.organization_user? ? self.organization.get_geocoding_calls : self.get_geocoding_calls,
          hard_limit:  self.hard_geocoding_limit?
        },
        twitter: {
          enabled:     self.organization_user? ? self.organization.twitter_datasource_enabled         : self.twitter_datasource_enabled,
          quota:       self.organization_user? ? self.organization.twitter_datasource_quota           :  self.twitter_datasource_quota,
          block_price: self.organization_user? ? self.organization.twitter_datasource_block_price     : self.twitter_datasource_block_price,
          block_size:  self.organization_user? ? self.organization.twitter_datasource_block_size      : self.twitter_datasource_block_size,
          monthly_use: self.organization_user? ? self.organization.get_twitter_imports_count          : self.get_twitter_imports_count,
          hard_limit:  self.hard_twitter_datasource_limit
        },
        billing_period: self.last_billing_cycle,
        max_layers: self.max_layers,
        api_key: self.api_key,
        layers: self.layers.map(&:public_values),
        trial_ends_at: self.trial_ends_at,
        upgraded_at: self.upgraded_at,
        show_trial_reminder: self.trial_ends_at.present?,
        show_upgraded_message: (self.account_type.downcase != 'free' && self.upgraded_at && self.upgraded_at + 15.days > Date.today ? true : false),
        actions: {
          private_tables: self.private_tables_enabled,
          private_maps: self.private_maps_enabled?,
          dedicated_support: self.dedicated_support?,
          import_quota: self.import_quota,
          remove_logo: self.remove_logo?,
          sync_tables: self.sync_tables_enabled,
          arcgis_datasource: self.arcgis_datasource_enabled?,
          google_maps_geocoder_enabled: self.google_maps_geocoder_enabled?,
          google_maps_enabled: self.google_maps_enabled?
        },
        limits: {
          concurrent_syncs: CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount::MAX_SYNCS_PER_USER,
          concurrent_imports: self.max_concurrent_import_count,
          import_file_size: self.max_import_file_size,
          import_table_rows: self.max_import_table_row_count
        },
        notification: self.notification,
        avatar_url: self.avatar,
        feature_flags: self.feature_flags,
        base_url: self.public_url,
        needs_password_confirmation: self.needs_password_confirmation?
      }

      data[:organization] = self.organization.to_poro if self.organization.present?

      if options[:extended]
        data.merge({
          :real_table_count => self.real_tables.size,
          :last_active_time => self.get_last_active_time
        })
      else
        data
      end
    end
  end
end
