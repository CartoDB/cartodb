Sequel.migration do
  change do
    alter_table :organizations do
      add_column :auth_github_enabled, :boolean, null: false, default: false
    end
  end
end
