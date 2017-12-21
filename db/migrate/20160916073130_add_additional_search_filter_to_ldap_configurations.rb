Sequel.migration do
  change do
    alter_table :ldap_configurations do
      add_column :additional_search_filter, :text
    end
  end
end
