Sequel.migration do
  change do
    alter_table :groups do
      add_column :auth_token, :text
    end
  end
end
