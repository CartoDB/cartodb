Sequel.migration do
  up do
    add_column :data_imports, :user_defined_limits, :text, default: '{}'
  end

  down do
    drop_column :data_imports, :user_defined_limits
  end
end
