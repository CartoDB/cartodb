Sequel.migration do
  up do
    add_column :data_imports, :service_item_id, :text
  end

  down do
    drop_column :data_imports, :service_item_id
  end
end
