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
      attributes = attributes.dup
      user = User.new
      user.username              = attributes[:username] || String.random(5).downcase
      user.email                 = attributes[:email]    || String.random(5).downcase + '@' + String.random(5).downcase + '.com'
      user.password              = attributes[:password] || user.email.split('@').first
      user.password_confirmation = user.password
      user.admin                 = attributes[:admin] == false ? false : true
      user.private_tables_enabled= attributes[:private_tables_enabled] == false ? false : true
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
      user
    end

    def create_user(attributes = {})
      user = new_user(attributes)
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

    def reload_user_data user    
      
      delete_user_data user      

      fixture     = "#{Rails.root}/db/fake_data/import_csv_1.csv"
      data_import = create_import(@user, fixture)
      fixture     = "#{Rails.root}/db/fake_data/twitters.csv"
      data_import = create_import(@user, fixture)
    end

    def create_import user, file_name, name=nil
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
    end

    def load_user_functions(user)
      user.load_cartodb_functions
    end

  end
end
