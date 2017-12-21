Sequel.migration do
  change do
    alter_table :geocodings do
      add_column :kind,          :text
      add_column :country_code,  :text
      add_column :geometry_type, :text
    end
  end
end
