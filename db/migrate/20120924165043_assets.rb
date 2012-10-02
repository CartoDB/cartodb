Sequel.migration do
  up do
    create_table :assets do
      primary_key :id
      Integer     :user_id, :null => false, :index => true
      String      :public_url, :text => true
    end
  end
  
  down do
    drop_table :assets
  end
end
