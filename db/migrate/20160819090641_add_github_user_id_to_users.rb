Sequel.migration do
  change do
    alter_table :users do
      add_column :github_user_id, :bigint
      add_index  :github_user_id
    end
  end
end
