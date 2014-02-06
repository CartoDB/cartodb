Sequel.migration do
  up do
    add_column :geocodings, :cache_hits, :integer
  end

  down do
    drop_column :geocodings, :cache_hits, :integer
  end
end
