class UsersMigration < Sequel::Migration

  def up
    create_table :users do
      primary_key :id
      String :email, :null => false, :unique => true
      String :crypted_password, :null => false
    end
  end

  def down
    drop_table :users
  end

end
