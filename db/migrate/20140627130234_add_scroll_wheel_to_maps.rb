Sequel.migration do
  up do
    add_column :maps, :scrollwheel, :bool, :default => true
  end

  down do
    drop_column :maps, :scrollwheel
  end
end
