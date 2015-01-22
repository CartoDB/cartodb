Sequel.migration do
  up do
    add_column :visualizations, :slide_transition_options, :text, null: false, default: '{}'
  end
  down do
    drop_column :visualizations, :slide_transition_options
  end
end
