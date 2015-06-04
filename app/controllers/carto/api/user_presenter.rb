
module Carto
  module Api
    class UserPresenter

      def initialize(user)
        @user = user
      end

      def to_poro
        return {} if @user.nil?
        {
            id:         @user.id,
            username:   @user.username,
            email:      @user.email,
            avatar_url: @user.avatar_url,
            base_url:   @user.public_url
        }
      end

      def data(options = {})
        return {} if @user.nil?
        
        calls = @user.get_api_calls(from: @user.last_billing_cycle, to: Date.today)
        calls.fill(0, calls.size..29)

        db_size_in_bytes = @user.db_size_in_bytes

        data = {
          id: @user.id,
          email: @user.email,
          name: @user.name,
          username: @user.username,
          account_type: @user.account_type,
          table_quota: @user.table_quota,
          table_count: @user.table_count,
          public_visualization_count: @user.public_visualization_count,
          visualization_count: @user.visualization_count,
          failed_import_count: failed_import_count,
          success_import_count: success_import_count,
          import_count: import_count,
          last_visualization_created_at: last_visualization_created_at,
          quota_in_bytes: @user.quota_in_bytes,
          db_size_in_bytes: db_size_in_bytes,
          db_size_in_megabytes: db_size_in_bytes.present? ? (db_size_in_bytes / (1024.0 * 1024.0)).round(2) : nil,
          remaining_table_quota: @user.remaining_table_quota,
          remaining_byte_quota: @user.remaining_quota(false, db_size_in_bytes).to_f,
          api_calls: calls,
          api_calls_quota: @user.organization_user? ? @user.organization.map_view_quota : @user.map_view_quota,
          api_calls_block_price: @user.organization_user? ? @user.organization.map_view_block_price : @user.map_view_block_price,
          geocoding: {
            quota:       @user.organization_user? ? @user.organization.geocoding_quota : @user.geocoding_quota,
            block_price: @user.organization_user? ? @user.organization.geocoding_block_price : @user.geocoding_block_price,
            monthly_use: @user.organization_user? ? @user.organization.get_geocoding_calls : @user.get_geocoding_calls,
            hard_limit:  @user.hard_geocoding_limit?
          },
          twitter: {
            enabled:     @user.organization_user? ? @user.organization.twitter_datasource_enabled         : @user.twitter_datasource_enabled,
            quota:       @user.organization_user? ? @user.organization.twitter_datasource_quota           :  @user.twitter_datasource_quota,
            block_price: @user.organization_user? ? @user.organization.twitter_datasource_block_price     : @user.twitter_datasource_block_price,
            block_size:  @user.organization_user? ? @user.organization.twitter_datasource_block_size      : @user.twitter_datasource_block_size,
            monthly_use: @user.organization_user? ? @user.organization.twitter_imports_count          : @user.twitter_imports_count,
            hard_limit:  @user.hard_twitter_datasource_limit
          },
          billing_period: @user.last_billing_cycle,
          max_layers: @user.max_layers,
          api_key: @user.api_key,
          layers: @user.layers.map { |layer|
              Carto::Api::LayerPresenter.new(layer).to_poro
            },
          trial_ends_at: @user.trial_ends_at,
          upgraded_at: @user.upgraded_at,
          show_trial_reminder: @user.trial_ends_at.present?,
          show_upgraded_message: (@user.account_type.downcase != 'free' && @user.upgraded_at && @user.upgraded_at + 15.days > Date.today ? true : false),
          actions: {
            private_tables: @user.private_tables_enabled,
            private_maps: @user.private_maps_enabled?,
            dedicated_support: @user.dedicated_support?,
            import_quota: @user.import_quota,
            remove_logo: @user.remove_logo?,
            sync_tables: @user.sync_tables_enabled,
            arcgis_datasource: @user.arcgis_datasource_enabled?
          },
          notification: @user.notification,
          avatar_url: @user.avatar,
          new_dashboard_enabled: @user.new_dashboard_enabled,
          feature_flags: @user.feature_flag_names,
          base_url: @user.public_url
        }

        if @user.organization.present?
          data[:organization] = Carto::Api::OrganizationPresenter.new(@user.organization).to_poro
        end

        if options[:extended]
          # TODO: This fields are pending migration
          data.merge({
            :real_table_count => @user.real_tables.size,
            :last_active_time => @user.get_last_active_time
          })
        else
          data
        end
      end

      private

      def failed_import_count
        Carto::DataImport.where(user_id: @user.id, state: 'failure').count
      end

      def success_import_count
        Carto::DataImport.where(user_id: @user.id, state: 'complete').count
      end

      def import_count
        DataImport.where(user_id: @user.id).count
      end

      def last_visualization_created_at
        row_data = Carto::VisualizationQueryBuilder.new
                                                   .with_user_id(@user.id)
                                                   .with_order(:created_at, :desc)
                                                   .build_paged(1, 1)
                                                   .pluck(:created_at)
        row_data.nil? ? nil : row_data[0]
      end

    end
  end
end
