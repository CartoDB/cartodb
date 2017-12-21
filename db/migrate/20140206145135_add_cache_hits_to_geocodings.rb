Sequel.migration do
  up do
    add_column :geocodings, :cache_hits, :integer, default: 0
  end

  down do
    drop_column :geocodings, :cache_hits, :integer
  end
end
