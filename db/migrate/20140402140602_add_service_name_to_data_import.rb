Sequel.migration do
  up do
    add_column :data_imports, :service_name, :text
    alter_table(:data_imports) do
      set_column_default :service_name, 'public_url'
    end
  end

  down do
    drop_column :data_imports, :service_name
  end
end
