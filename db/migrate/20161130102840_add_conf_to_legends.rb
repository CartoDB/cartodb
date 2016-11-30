Sequel.migration do
  up do
    add_column :legends, :conf, :json, null: false, default: '{}'
  end

  down do
    drop_column :legends, :conf
  end
end
