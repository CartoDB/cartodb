Sequel.migration do
  up do
    require Rails.root.join('lib/cartodb/migrator20')

    Migrator20.new.migrate!
  end

  down do
  end
end
