Sequel.migration do
  up do
    add_column :data_imports, :stats, :text, null: false, default: '{}'
  end
  down do
    drop_column :data_imports, :stats
  end
end
