require 'helpers/unique_names_helper'

module CartoDB
  @default_test_user = nil
  module Factories
    include UniqueNamesHelper
    def default_user(attributes = {})
      user = nil
      unless @default_test_username.nil?
        user = ::User.find(username: @default_test_username)
      end
      if user.nil?
        user = new_user(attributes)
        @default_test_username = user.username
      end
      user
    end

    def new_user(attributes = {})
      # To allow transitional classes without breaking any existing test
      user_class = attributes.fetch(:class, ::User)

      if attributes[:fake_user]
        user_class.any_instance.stubs(
          after_create: nil
        )

        CartoDB::UserModule::DBService.any_instance.stubs(
          grant_user_in_database: nil,
          set_user_privileges_at_db: nil,
          set_statement_timeouts: nil,
          set_user_as_organization_member: nil,
          rebuild_quota_trigger: nil,
          set_database_search_path: nil,
          cartodb_extension_version_pre_mu?: false,
          load_cartodb_functions: nil,
          create_schema: nil,
          create_public_db_user: nil,
          enable_remote_db_user: nil,
          monitor_user_notification: nil
        )
      end

      attributes = attributes.dup
      user = user_class.new
      user.username              = attributes[:username] || unique_name('user')
      user.email                 = attributes[:email]    || unique_email
      user.password              = attributes[:password] || user.email.split('@').first
      user.password_confirmation = user.password
      user.admin                 = attributes[:admin] == false ? false : true
      user.private_tables_enabled = attributes[:private_tables_enabled] == true ? true : false
      user.private_maps_enabled  = attributes[:private_maps_enabled] == true ? true : false
      user.enabled               = attributes[:enabled] == false ? false : true
      user.table_quota           = attributes[:table_quota]     if attributes[:table_quota]
      user.quota_in_bytes        = attributes[:quota_in_bytes]  if attributes[:quota_in_bytes]
      user.account_type          = attributes[:account_type]    if attributes[:account_type]
      user.map_view_quota        = attributes[:map_view_quota]  if attributes.has_key?(:map_view_quota)
      user.map_view_block_price  = attributes[:map_view_block_price]  if attributes.has_key?(:map_view_block_price)
      user.period_end_date       = attributes[:period_end_date] if attributes.has_key?(:period_end_date)
      user.user_timeout          = attributes[:user_timeout] || 300000
      user.database_timeout      = attributes[:database_timeout] || 300000
      user.geocoding_quota       = attributes[:geocoding_quota] || 1000
      user.geocoding_block_price = attributes[:geocoding_block_price] || 1500
      user.here_isolines_quota   = attributes[:here_isolines_quota] || 1000
      user.here_isolines_block_price = attributes[:here_isolines_block_price] || 1500
      user.obs_snapshot_quota = attributes[:obs_snapshot_quota] || 1000
      user.obs_snapshot_block_price = attributes[:obs_snapshot_block_price] || 1500
      user.obs_general_quota = attributes[:obs_general_quota] || 1000
      user.obs_general_block_price = attributes[:obs_general_block_price] || 1500
      user.sync_tables_enabled   = attributes[:sync_tables_enabled] || false
      user.organization          = attributes[:organization] || nil
      if attributes[:organization_id]
        user.organization_id = attributes[:organization_id]
      end
      user.twitter_datasource_enabled = attributes[:twitter_datasource_enabled] || false
      user.avatar_url            = user.default_avatar

      user
    end

    def create_user(attributes = {})
      user = new_user(attributes)
      raise "User not valid: #{user.errors}" unless user.valid?
      # INFO: avoiding enable_remote_db_user
      Cartodb.config[:signups] = nil
      user.save
      load_user_functions(user)
      user
    end

    def create_admin(attributes = {})
      attributes[:username] = 'Admin'
      attributes[:email]    = 'admin@example.com'
      attributes[:admin]    = true
      user = new_user(attributes)
      user.save
    end

    def create_owner(organization)
      org_user_owner = create_test_user(unique_name('user'))
      user_org = CartoDB::UserOrganization.new(organization.id, org_user_owner.id)
      user_org.promote_user_to_admin
      organization.reload
      org_user_owner.reload
      org_user_owner
    end

    def create_test_user(username = nil, organization = nil)
      username ||= unique_name('user')
      user = create_user(
        username: username,
        email: "#{username}@example.com",
        password: username,
        private_tables_enabled: true,
        organization: organization
      )
      user.save.reload
      organization.reload if organization
      user
    end

    def create_mocked_user(user_id = UUIDTools::UUID.timestamp_create.to_s, user_name = 'whatever', user_apikey = '123')
      user_mock = mock
      user_mock.stubs(:id).returns(user_id)
      user_mock.stubs(:username).returns(user_name)
      user_mock.stubs(:api_key).returns(user_apikey)
      user_mock.stubs(:invalidate_varnish_cache).returns(nil)
      user_mock.stubs(:has_feature_flag?).returns(false)
      user_mock
    end

    def reload_user_data(user)
      delete_user_data user
      create_import(@user, "#{Rails.root}/db/fake_data/import_csv_1.csv")
      create_import(@user, "#{Rails.root}/db/fake_data/twitters.csv")
    end

    def create_import(user, file_name, name=nil)
      data_import  = DataImport.create(
        user_id:      user.id,
        data_source:  file_name,
        table_name:   name
      )
      def data_import.data_source=(filepath)
        self.values[:data_type] = 'file'
        self.values[:data_source] = filepath
      end

      data_import.data_source = file_name
      data_import.send :new_importer
      data_import
    end

    def delete_user_data user
      user.tables.destroy
      user.maps_dataset.destroy
      user.layers_dataset.destroy
      user.assets_dataset.destroy
      user.data_imports_dataset.destroy
      user.geocodings_dataset.destroy
      user.delete_external_data_imports
      user.delete_external_sources
      CartoDB::Visualization::Collection.new.fetch(user_id: user.id).each do |v|
        # INFO: no need for explicit children deletion, parent will delete it
        v.delete unless v.parent_id
      end
    end

    def load_user_functions(user)
      user.db_service.load_cartodb_functions
      user.db_service.rebuild_quota_trigger
    end
  end
end
