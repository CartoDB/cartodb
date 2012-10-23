Sequel.migration do
  up do
    require Rails.root.join('lib/cartodb/migrator')

    Migrator.new.migrate!
  end

  down do
  end
end
