Sequel.migration do
  change do
    alter_table :visualizations do
      add_column :legend_style, :text, :default => ''
    end
  end
end
