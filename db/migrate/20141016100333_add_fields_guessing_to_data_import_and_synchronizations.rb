Sequel.migration do
  up do
    add_column :data_imports, :type_guessing,           :boolean, null: false, default: true
    add_column :data_imports, :quoted_fields_guessing,  :boolean, null: false, default: true

    add_column :synchronizations, :type_guessing,           :boolean, null: false, default: true
    add_column :synchronizations, :quoted_fields_guessing,  :boolean, null: false, default: true
  end

  down do
    drop_column :data_imports, :type_guessing
    drop_column :data_imports, :quoted_fields_guessing

    drop_column :synchronizations, :type_guessing
    drop_column :synchronizations, :quoted_fields_guessing
  end
end
