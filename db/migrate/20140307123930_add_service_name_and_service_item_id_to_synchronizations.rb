Sequel.migration do
  #alter_table :synchronizations do
  up do
    add_column :synchronizations, :service_name, String
    add_column :synchronizations, :service_item_id, String
  end

  down do
    drop_column :synchronizations, :service_name
    drop_column :synchronizations, :service_item_id
  end
end
