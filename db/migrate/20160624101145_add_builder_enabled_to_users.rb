Sequel.migration do
  change do
    alter_table :users do
      # True and false automatically redirect the user to the builder/editor respectively
      # Null is allowed to deactivate redirection, so the user can choose editor by changing the URL
      add_column :builder_enabled, :boolean, null: true, default: true
    end
  end
end
