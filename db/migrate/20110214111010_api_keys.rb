class ApiKeysMigration < Sequel::Migration

  def up
    create_table :api_keys do
      primary_key :id
      String :api_key, :null => false, :unique => true, :index => true
      Integer :user_id, :null => false
      String :domain, :null => false
    end
  end

  def down
    drop_table :api_keys
  end

end
