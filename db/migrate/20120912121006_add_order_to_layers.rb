Sequel.migration do
  change do
    alter_table :layers do
      add_column :order, :integer
    end
  end
end
