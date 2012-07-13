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
      user.table_quota           = attributes[:table_quota]    if attributes[:table_quota]
      user.quota_in_bytes        = attributes[:quota_in_bytes] if attributes[:quota_in_bytes]
      user.account_type          = attributes[:account_type]   if attributes[:account_type]
      user
    end

    def create_user(attributes = {})
      user = new_user(attributes)
      user.save
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
      
      # Import basic csv file as table
      import1 = DataImport.create(  :user_id       => user.id,
                                    :table_name    => 'import_csv_1',
                                    :data_source   => "/../db/fake_data/import_csv_1.csv" )
      Table[import1.table_id]    

      # Import tweets file as table
      import2 = DataImport.create(  :user_id       => user.id,
                                    :table_name    => 'twitters',
                                    :data_source   => "/../db/fake_data/twitters.csv" )
      Table[import2.table_id]    
    end

    def delete_user_data user
      user.tables.destroy
    end
  end
end
