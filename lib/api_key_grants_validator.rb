class ApiKeyGrantsValidator < ActiveModel::EachValidator

  def validate_each(record, attribute, value)
    return record.errors[attribute] = ['grants has to be an array'] unless value.is_a?(Array)

    record.errors[attribute] << 'only one apis section is allowed' unless value.count { |v| v[:type] == 'apis' } == 1

    max_one_sections = ['database', 'dataservices', 'user', 'data-observatory']
    max_one_sections.each do |section|
      if value.count { |v| v[:type] == section } > 1
        record.errors[attribute] << "only one #{section} section is allowed"
      end
    end
  end

end
