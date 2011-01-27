class UsersMigration < Sequel::Migration

  def up
    create_table :users do
      primary_key :id
      String :email, :null => false, :unique => true
      String :crypted_password, :null => false
      String :salt, :null => false
      String :database_name
      String :username, :unique => true, :null => false
      Integer :tables_count, :null => false
    end

    alter_table(:users) do
      set_column_default :tables_count, 0
    end
  end

  def down
    drop_table :users
  end

end
