# Contains methods present in ActiveRecord models but not in Sequel,
# providing a light compatibility layer
module ActiveRecordCompatibility

  extend ActiveSupport::Concern

  def new_record?
    new?
  end

  def save!
    save(raise_on_failure: true)
  end

  def attributes
    values.with_indifferent_access
  end

  def model_name
    self.class.model_name
  end

  def set(new_attributes)
    if self.class.ancestors.include?(ActiveRecord::Base)
      new_attributes.each { |attr, value| self[attr] = value }
    else
      super
    end
  end

end
