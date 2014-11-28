Sequel.migration do
  up do
    add_column :synchronizations, :content_guessing, :boolean, null: false, default: false
  end

  down do
    drop_column :synchronizations, :content_guessing
  end
end
