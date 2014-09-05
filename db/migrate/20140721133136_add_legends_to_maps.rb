Sequel.migration do
  up do
    add_column :maps, :legends, :bool, :default => true
  end

  down do
    drop_column :maps, :legends
  end
end
