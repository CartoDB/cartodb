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
        byte_quota: self.quota_in_bytes,
        remaining_table_quota: self.remaining_table_quota,
        remaining_byte_quota: self.remaining_quota.to_f,
        api_calls: calls,
        api_calls_quota: self.map_view_quota,
        api_calls_block_price: self.map_view_block_price,
        geocoding_quota: self.geocoding_quota,
        billing_period: self.last_billing_cycle,
        max_layers: self.max_layers,
        api_key: self.get_map_key,
        layers: self.layers.map(&:public_values),
        trial_ends_at: self.trial_ends_at,
        upgraded_at: self.upgraded_at,
        show_trial_reminder: self.trial_ends_at.present?,
        show_upgraded_message: (self.account_type.downcase != 'free' && self.upgraded_at && self.upgraded_at + 15.days > Date.today ? true : false),
        actions: {
          private_tables: self.private_tables_enabled,
          dedicated_support: self.dedicated_support?,
          import_quota: self.import_quota,
          remove_logo: self.remove_logo?,
          sync_tables: self.sync_tables_enabled
        }
      }

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
