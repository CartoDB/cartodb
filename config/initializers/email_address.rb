EmailAddress::Config.configure(local_format: :conventional)

class EmailValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return unless value

    if value.is_a?(Array)
      value.each { |v| validate_value(record, attribute, v) }
    else
      validate_value(record, attribute, value)
    end
  end

  private

  def validate_value(record, attribute, value)
    unless EmailAddress.valid?(value)
      record.errors[attribute] << (options[:message] || "#{value} is not a valid email")
    end
  end
end
