Sequel.migration do

  up do
    add_column :external_sources, :username, :text
  end

  down do
    drop_column :external_sources, :username
  end

end
