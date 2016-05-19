require_relative 'group_presenter'

module Carto
  module Api
    class UserPresenter

      # options:
      # - fetch_groups
      # - current_viewer
      def initialize(user, options = {})
        @user = user
        @options = options
      end

      def to_poro
        return {} if @user.nil?
        return to_public_poro unless !@options[:current_viewer].nil? && @user.viewable_by?(@options[:current_viewer])

        poro = {
          id:               @user.id,
          username:         @user.username,
          email:            @user.email,
          avatar_url:       @user.avatar_url,
          base_url:         @user.public_url,
          quota_in_bytes:   @user.quota_in_bytes,
          db_size_in_bytes: @user.db_size_in_bytes,
          table_count:      @user.table_count,
          public_visualization_count: @user.public_visualization_count,
          all_visualization_count: @user.all_visualization_count
        }

        if @options[:fetch_groups] == true
          poro.merge!(groups: @user.groups ? @user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : [])
        end

        poro
      end

      def to_public_poro
        return {} if @user.nil?

        poro = {
          id:               @user.id,
          username:         @user.username,
          avatar_url:       @user.avatar_url,
          base_url:         @user.public_url
        }

        if @options[:fetch_groups] == true
          poro.merge!(groups: @user.groups ? @user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : [])
        end

        if @options[:current_user] && @options[:current_user].organization_owner? && @user.belongs_to_organization?(@options[:current_user].organization)
          poro[:email] = @user.email
          poro[:table_count] = @user.table_count
          poro[:all_visualization_count] = @user.all_visualization_count
        end

        poro
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
          all_visualization_count: @user.all_visualization_count,
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
          here_isolines: {
            quota:       @user.organization_user? ? @user.organization.here_isolines_quota : @user.here_isolines_quota,
            block_price: @user.organization_user? ? @user.organization.here_isolines_block_price : @user.here_isolines_block_price,
            monthly_use: @user.organization_user? ? @user.organization.get_here_isolines_calls : @user.get_here_isolines_calls,
            hard_limit:  @user.hard_here_isolines_limit?
          },
          obs_snapshot: {
            quota:       @user.organization_user? ? @user.organization.obs_snapshot_quota : @user.obs_snapshot_quota,
            block_price: @user.organization_user? ? @user.organization.obs_snapshot_block_price : @user.obs_snapshot_block_price,
            monthly_use: @user.organization_user? ? @user.organization.get_obs_snapshot_calls : @user.get_obs_snapshot_calls,
            hard_limit:  @user.hard_obs_snapshot_limit?
          },
          obs_general: {
            quota:       @user.organization_user? ? @user.organization.obs_general_quota : @user.obs_general_quota,
            block_price: @user.organization_user? ? @user.organization.obs_general_block_price : @user.obs_general_block_price,
            monthly_use: @user.organization_user? ? @user.organization.get_obs_general_calls : @user.get_obs_general_calls,
            hard_limit:  @user.hard_obs_general_limit?
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
            remove_logo: @user.remove_logo?,
            sync_tables: @user.sync_tables_enabled,
            arcgis_datasource: @user.arcgis_datasource_enabled?,
            google_maps_geocoder_enabled: @user.google_maps_geocoder_enabled?,
            google_maps_enabled: @user.google_maps_enabled?
          },
          limits: {
            concurrent_syncs: CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount::MAX_SYNCS_PER_USER,
            concurrent_imports: @user.max_concurrent_import_count,
            import_file_size: @user.max_import_file_size,
            import_table_rows: @user.max_import_table_row_count,
            max_layers: @user.max_layers
          },
          notification: @user.notification,
          avatar_url: @user.avatar,
          feature_flags: @user.feature_flag_names,
          base_url: @user.public_url,
          needs_password_confirmation: @user.needs_password_confirmation?,
        }

        if @user.organization.present?
          data[:organization] = Carto::Api::OrganizationPresenter.new(@user.organization).to_poro
          data[:organization][:available_quota_for_user] = @user.organization.unassigned_quota + @user.quota_in_bytes
        end

        if !@user.groups.nil?
          data[:groups] = @user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro }
        end

        if @user.mobile_sdk_enabled?
          data[:mobile_apps] = { mobile_xamarin: @user.mobile_xamarin,
                                 mobile_custom_watermark: @user.mobile_custom_watermark,
                                 mobile_offline_maps: @user.mobile_offline_maps,
                                 mobile_gis_extension: @user.mobile_gis_extension,
                                 mobile_max_open_users: @user.mobile_max_open_users,
                                 mobile_max_private_users: @user.mobile_max_private_users }
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
