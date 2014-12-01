Sequel.migration do
  up do
    add_column :data_imports, :server, :text
    add_column :data_imports, :host, :text
  end

  down do
    drop_column :data_imports, :server
    drop_column :data_imports, :host
  end
end
