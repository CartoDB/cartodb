Sequel.migration do
  up do
    add_column :organizations, :viewer_seats, :integer, null: false, default: 0
  end

  down do
    drop_column :organizations, :viewer_seats
  end
end
