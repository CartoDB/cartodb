Sequel.migration do
  change do
    alter_table :user_creations do
      add_column :github_user_id, :bigint
    end
  end
end
