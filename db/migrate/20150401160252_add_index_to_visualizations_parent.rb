Sequel.migration do
  up do

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX visualizations_parent_id_idx ON visualizations (parent_id)
    })

  end
end
