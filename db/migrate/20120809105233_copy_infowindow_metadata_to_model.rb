Sequel.migration do
  up do
    # Copy Redis infowindow metadata to the model
    Table.all.each do |t|
      if t.infowindow_without_new_model.blank?
        t.infowindow_with_new_model = t.infowindow_without_new_model
      end
    end
  end
  
  down do
  end
end
