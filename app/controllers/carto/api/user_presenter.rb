require_relative 'group_presenter'

module Carto
  module Api
    class UserPresenter
      include AccountTypeHelper

      def initialize(user,
                     fetch_groups: false,
                     current_viewer: nil,
                     fetch_db_size: true,
                     fetch_basemaps: false,
                     fetch_profile: true)
        @user = user
        @fetch_groups = fetch_groups
        @current_viewer = current_viewer
        @fetch_db_size = fetch_db_size
        @fetch_basemaps = fetch_basemaps
        @fetch_profile = fetch_profile
      end

      def to_poro
        return {} if @user.nil?
        return to_public_poro unless current_viewer && @user.viewable_by?(current_viewer)

        poro = {
          id:                         @user.id,
          name:                       @user.name,
          last_name:                  @user.last_name,
          username:                   @user.username,
          email:                      @user.email,
          avatar_url:                 @user.avatar_url,
          website:                    @user.website,
          description:                @user.description,
          location:                   @user.location,
          twitter_username:           @user.twitter_username,
          disqus_shortname:           @user.disqus_shortname,
          available_for_hire:         @user.available_for_hire,
          base_url:                   @user.public_url,
          google_maps_query_string:   @user.google_maps_query_string,
          quota_in_bytes:             @user.quota_in_bytes,
          table_count:                @user.table_count,
          viewer:                     @user.viewer?,
          role_display:               @user.role_display,
          org_admin:                  @user.organization_admin?,
          public_visualization_count: @user.public_visualization_count,
          all_visualization_count:    @user.all_visualization_count,
          org_user:                   @user.organization_id.present?,
          remove_logo:                @user.remove_logo?,
        }

        if fetch_groups
          poro[:groups] = @user.groups ? @user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : []
        end

        poro[:basemaps] = @user.basemaps if fetch_basemaps

        poro[:db_size_in_bytes] = @user.db_size_in_bytes if fetch_db_size

        if fetch_profile
          poro[:industry] = @user.industry
          poro[:company_employees] = @user.company_employees
          poro[:use_case] = @user.use_case
          poro[:company]  = @user.company
          poro[:phone]    = @user.phone
          poro[:job_role] = @user.job_role
        end

        poro
      end

      def to_eumapi_poro
        presentation = to_poro

        presentation.delete(:id)
        presentation[:soft_geocoding_limit] = @user.soft_geocoding_limit
        presentation[:api_key] = @user.api_key

        presentation
      end

      def to_public_poro
        return {} if @user.nil?

        poro = {
          id:               @user.id,
          username:         @user.username,
          name:             @user.name,
          last_name:        @user.last_name,
          avatar_url:       @user.avatar_url,
          base_url:         @user.public_url,
          google_maps_query_string: @user.google_maps_query_string,
          disqus_shortname: @user.disqus_shortname,
          viewer:           @user.viewer?,
          org_admin:        @user.organization_admin?,
          org_user:         @user.organization_id.present?,
          remove_logo:      @user.remove_logo?
        }

        if fetch_groups
          poro[:groups] = @user.groups ? @user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : []
        end

        poro
      end

      def data(options = {})
        return {} if @user.nil?
        db_size_in_bytes = @user.db_size_in_bytes

        data = {
          id: @user.id,
          email: @user.email,
          name: @user.name,
          last_name: @user.last_name,
          created_at: @user.created_at,
          username: @user.username,
          state: @user.state,
          account_type: @user.account_type,
          account_type_display_name: plan_name(@user.account_type),
          table_quota: @user.table_quota,
          public_map_quota: @user.public_map_quota,
          public_dataset_quota: @user.public_dataset_quota,
          private_map_quota: @user.private_map_quota,
          regular_api_key_quota: @user.regular_api_key_quota,
          table_count: @user.table_count,
          viewer: @user.viewer?,
          role_display: @user.role_display,
          industry: @user.industry,
          company_employees: @user.company_employees,
          use_case: @user.use_case,
          company: @user.company,
          phone: @user.phone,
          job_role: @user.job_role,
          org_admin: @user.organization_admin?,
          public_visualization_count: @user.public_visualization_count,
          public_privacy_map_count: @user.public_privacy_visualization_count,
          link_privacy_map_count: @user.link_privacy_visualization_count,
          password_privacy_map_count: @user.password_privacy_visualization_count,
          private_privacy_map_count: @user.private_privacy_visualization_count,
          owned_visualization_count: @user.owned_visualization_count,
          all_visualization_count: @user.all_visualization_count,
          visualization_count: @user.visualization_count,
          failed_import_count: failed_import_count,
          success_import_count: success_import_count,
          import_count: import_count,
          last_visualization_created_at: last_visualization_created_at,
          quota_in_bytes: @user.quota_in_bytes, # TODO: To be deprecated in favor of memory -> quota_in_bytes
          db_size_in_bytes: db_size_in_bytes, # TODO: To be deprecated in favor of memory -> db_size_in_bytes
          db_size_in_megabytes: db_size_in_bytes.present? ? (db_size_in_bytes / (1024.0 * 1024.0)).round(2) : nil,
          remaining_table_quota: @user.remaining_table_quota,
          remaining_byte_quota: @user.remaining_quota(db_size_in_bytes).to_f,
          storage: {
            # Total quota, including premium subscriptions addons:
            quota_in_bytes: @user.quota_in_bytes,
            # Total DB storage used, including premium and public synchronized datasets:
            db_size_in_bytes: db_size_in_bytes,
            # DB storage used by public subscriptions:
            subscriptions_public_size_in_bytes: @user.subscriptions_public_size_in_bytes,
            # DB storage used by premium subscriptions:
            subscriptions_premium_size_in_bytes: @user.subscriptions_premium_size_in_bytes,
            # Estimated premium datasets size:
            subscriptions_premium_estimated_size_in_bytes: @user.subscriptions_premium_estimated_size_in_bytes
          },
          map_views: @user.organization_user? ? @user.organization.map_views_count : @user.map_views_count,
          map_views_quota: @user.organization_user? ? @user.organization.map_views_quota : @user.map_views_quota,
          unverified: @user.unverified?,
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
          mapzen_routing: {
            quota:       @user.organization_user? ? @user.organization.mapzen_routing_quota : @user.mapzen_routing_quota,
            block_price: @user.organization_user? ? @user.organization.mapzen_routing_block_price : @user.mapzen_routing_block_price,
            monthly_use: @user.organization_user? ? @user.organization.get_mapzen_routing_calls : @user.get_mapzen_routing_calls,
            hard_limit:  @user.hard_mapzen_routing_limit?
          },
          geocoder_provider: @user.geocoder_provider,
          isolines_provider: @user.isolines_provider,
          routing_provider: @user.routing_provider,
          twitter: {
            enabled:     @user.twitter_datasource_enabled,
            quota:       @user.organization_user? ? @user.organization.twitter_datasource_quota           :  @user.twitter_datasource_quota,
            block_price: @user.organization_user? ? @user.organization.twitter_datasource_block_price     : @user.twitter_datasource_block_price,
            block_size:  @user.organization_user? ? @user.organization.twitter_datasource_block_size      : @user.twitter_datasource_block_size,
            monthly_use: @user.organization_user? ? @user.organization.twitter_imports_count          : @user.twitter_imports_count,
            hard_limit:  @user.hard_twitter_datasource_limit,
            customized_config: CartoDB::Datasources::DatasourcesFactory.customized_config?(CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME, @user)
          },
          salesforce: {
            enabled:     @user.organization_user? ? @user.organization.salesforce_datasource_enabled : @user.salesforce_datasource_enabled
          },
          mailchimp: {
            enabled: Carto::AccountType.new.mailchimp?(@user)
          },
          billing_period: @user.last_billing_cycle,
          next_billing_period: @user.next_billing_cycle,
          api_key: @user.api_key,
          layers: @user.layers.map { |layer|
              Carto::Api::LayerPresenter.new(layer).to_poro
          },
          trial_ends_at: @user.trial_ends_at,
          upgraded_at: @user.upgraded_at,
          show_trial_reminder: @user.show_trial_reminder?,
          show_upgraded_message: (@user.account_type.downcase != 'free' && @user.upgraded_at && @user.upgraded_at + 15.days > Date.today ? true : false),
          actions: {
            private_tables: @user.private_tables_enabled,
            private_maps: @user.private_maps_enabled?,
            remove_logo: @user.remove_logo?,
            sync_tables: @user.sync_tables_enabled,
            google_maps_geocoder_enabled: @user.google_maps_geocoder_enabled?,
            google_maps_enabled: @user.google_maps_enabled?,
            engine_enabled: @user.engine_enabled?,
            builder_enabled: @user.builder_enabled?,
            mobile_sdk_enabled: @user.mobile_sdk_enabled?
          },
          limits: {
            concurrent_syncs: CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount::MAX_SYNCS_PER_USER,
            concurrent_imports: @user.max_concurrent_import_count,
            import_file_size: @user.max_import_file_size,
            import_table_rows: @user.max_import_table_row_count,
            max_layers: @user.max_layers
          },
          notification: @user.notification,
          email_notifications: @user.decorate_email_notifications,
          avatar_url: @user.avatar,
          feature_flags: @user.feature_flags_names,
          base_url: @user.public_url,
          needs_password_confirmation: @user.needs_password_confirmation?,
          description: @user.description,
          website: @user.website,
          twitter_username: @user.twitter_username,
          disqus_shortname: @user.disqus_shortname,
          available_for_hire: @user.available_for_hire,
          location: @user.location,
          mfa_configured: @user.multifactor_authentication_configured?,
          is_enterprise: @user.enterprise?,
          do_enabled: @user.do_enabled?,
          do_bq_project: @user&.gcloud_settings&.[](:bq_project),
          do_bq_dataset: @user&.gcloud_settings&.[](:bq_dataset),
        }

        if @user.google_maps_geocoder_enabled? && (!@user.organization.present? || @user.organization_owner?)
          data[:google_maps_private_key] = @user.google_maps_private_key
        end

        if @user.organization.present?
          data[:organization] = Carto::Api::OrganizationPresenter.new(@user.organization).to_poro
          data[:organization][:available_quota_for_user] = @user.organization.unassigned_quota + @user.quota_in_bytes
        end

        if !@user.groups.nil?
          data[:groups] = @user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro }
        end

        if @user.mobile_sdk_enabled?
          data[:mobile_apps] = {
            mobile_xamarin: @user.mobile_xamarin,
            mobile_custom_watermark: @user.mobile_custom_watermark,
            mobile_offline_maps: @user.mobile_offline_maps,
            mobile_gis_extension: @user.mobile_gis_extension,
            mobile_max_open_users: @user.mobile_max_open_users,
            mobile_max_private_users: @user.mobile_max_private_users
          }
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

      attr_reader :current_viewer, :current_user, :fetch_groups, :fetch_db_size, :fetch_basemaps, :fetch_profile

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
