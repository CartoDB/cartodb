module CartoDB
  module UserDecorator
    def data(options = {})
      calls = self.get_api_calls(from: self.last_billing_cycle, to: Date.today)
      calls.fill(0, calls.size..29)
      data = { 
        id: self.id,
        email: self.email,
        username: self.username,
        account_type: self.account_type,
        table_quota: self.table_quota,
        table_count: self.table_count,
        visualization_count: self.visualization_count,
        failed_import_count: self.failed_import_count,
        success_import_count: self.success_import_count,
        import_count: self.import_count,
        last_visualization_created_at: self.last_visualization_created_at,
        quota_in_bytes: self.quota_in_bytes,
        remaining_table_quota: self.remaining_table_quota,
        remaining_byte_quota: self.remaining_quota.to_f,
        api_calls: calls,
        api_calls_quota: self.map_view_quota,
        api_calls_block_price: self.map_view_block_price,
        geocoding: {
          quota:       self.geocoding_quota,
          block_price: self.geocoding_block_price,
          monthly_use: self.get_geocoding_calls,
          hard_limit:  self.hard_geocoding_limit?,
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
          private_maps: self.private_maps_enabled,
          dedicated_support: self.dedicated_support?,
          import_quota: self.import_quota,
          remove_logo: self.remove_logo?,
          sync_tables: self.sync_tables_enabled
        },
        notification: self.notification
      }

      data[:organization] = {
        name:  self.organization.name,
        owner: self.organization_owner,
        email: self.organization.users_dataset.where('organization_owner = true').first.try(:email)
      } if self.organization.present?

      if !options[:extended]
        data
      else
        data.merge({
          :real_table_count => self.real_tables.size,
          :last_active_time => self.get_last_active_time,
          :db_size_in_bytes => self.db_size_in_bytes
        })
      end
    end
  end
end
