Sequel.migration do

  up do
    Rails::Sequel.connection.run(%q{
        ALTER TABLE "external_sources"
        ADD COLUMN geometry_types text[]
    })
    add_column :external_sources, :rows_counted, :integer, null: false
    add_column :external_sources, :size, :integer, null: false
  end

  down do
    drop column :external_sources, :size
    drop column :external_sources, :rows_counted
    drop column :external_sources, :geometry_types
  end

end
