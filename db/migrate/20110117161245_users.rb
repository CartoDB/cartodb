class UsersMigration < Sequel::Migration

  def up
    create_table :users do
      primary_key :id
      String :email, :null => false, :unique => true
      String :crypted_password, :null => false
      String :salt, :null => false
      String :database_name
    end
  end

  def down
    drop_table :users
  end

end
