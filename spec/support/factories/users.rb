module CartoDB
  @default_test_user = nil
  module Factories
    def default_user(attributes={})
      user = nil
      unless @default_test_username.nil?
        user = User.find(:username => @default_test_username)
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
            :enable_remote_db_user => nil,
            :after_create => nil,
            :create_schema => nil,
            :create_public_db_user => nil,
            :set_database_search_path => nil,
            :load_cartodb_functions => nil,
            :set_user_privileges => nil,
            :monitor_user_notification => nil,
            :grant_user_in_database => nil,
            :set_statement_timeouts => nil,
            :set_user_as_organization_member => nil,
            :cartodb_extension_version_pre_mu? => false,
            :rebuild_quota_trigger => nil
        )
      end

      # INFO: commented because rspec doesn't allow to stub in a before:each
      # user_class.any_instance.stubs(:enable_remote_db_user).returns(true)

      attributes = attributes.dup
      user = user_class.new
      user.username              = attributes[:username] || String.random(5).downcase
      user.email                 = attributes[:email]    || String.random(5).downcase + '@' + String.random(5).downcase + '.com'
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
      user.sync_tables_enabled   = attributes[:sync_tables_enabled] || false
      user.organization          = attributes[:organization] || nil
      user.twitter_datasource_enabled = attributes[:twitter_datasource_enabled] || false
      user.avatar_url            = user.default_avatar
      user.dynamic_cdn_enabled   = attributes[:dynamic_cdn_enabled] || false

      user
    end

    def create_user(attributes = {})
      user = new_user(attributes)
      user.valid?.should eq true
      # INFO: avoiding enable_remote_db_user
      Cartodb.config[:signups] = nil
      user.save
      load_user_functions(user)
      user
    end

    def create_test_user(attributes = {})
      rand_user = rand(999999)
      create_user({
          username: "test#{rand_user}-1",
          email: "client#{rand_user}@cartodb.com",
          password: 'clientex',
          private_tables_enabled: false
      }.merge(attributes))
    end

    def create_admin(attributes = {})
      attributes[:username] = 'Admin'
      attributes[:email]    = 'admin@example.com'
      attributes[:admin]    = true
      user = new_user(attributes)
      user.save
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
      CartoDB::Visualization::Collection.new.fetch(user_id: user.id).each { |v|
        # INFO: no need for explicit children deletion, parent will delete it
        v.delete unless v.parent_id
      }
    end

    def load_user_functions(user)
      user.load_cartodb_functions
      user.rebuild_quota_trigger
    end

  end
end
