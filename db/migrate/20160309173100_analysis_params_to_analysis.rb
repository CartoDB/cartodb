Sequel.migration do
  up do
    rename_column :analyses, :params, :analysis_definition
    Rails::Sequel.connection.run(%{
      alter index analysis_params_id rename to analyses_analisis_id
    })
  end

  down do
    rename_column :analyses, :analysis_definition, :params
    Rails::Sequel.connection.run(%{
      alter index analyses_analisis_id rename to analysis_params_id
    })
  end
end
