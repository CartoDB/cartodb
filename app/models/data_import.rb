# coding: UTF-8
class DataImport < Sequel::Model
  include CartoDB::MiniSequel
  include ActiveModel::Validations
  
  state_machine :initial => :uploading do
    before_transition :updated_now
    after_transition :log_state_change
    #after_transition  :uploading => :preparing, :preparing => :importing, :importing => :cleaning do
    #end
    after_transition :all => :complete do
      self.success = true
      self.logger << "Success\n"
    end
    event :uploaded do |event| 
      transition any => :preparing
    end
    event :prepared do
      transition any => :importing
    end
    event :imported do
      transition any => :formatting
    end
    event :formatted do
      transition any => :finishing
    end
    event :finished do 
      transition any => :complete
    end
    event :retry do
      transition any => same
    end
  end
  def updated_now(transition)
    self.updated_at = Time.now
  end
  def log_update(update_msg)
    self.logger << "update: #{update_msg}\n"
  end
  def log_error(error_msg)
    self.logger << "error: #{error_msg}\n"
  end
  def log_state_change(transition)
    event, from, to = transition.event, transition.from_name, transition.to_name
    if !self.logger
      self.logger = "Begin: \n"
    end
    self.logger << "#{event}: #{from} => #{to}\n"
  end
  def self.find_by_identifier(id)
    dataimport = fetch("SELECT * FROM data_imports WHERE id = ? ", id).first
    raise RecordNotFound if dataimport.nil?
    dataimport
  end
  def self.find_by_user_table(user_id,table_id)
    dataimport = fetch("SELECT * FROM data_imports WHERE user_id = ? AND table_id = ? ", user_id, table_id).first
    raise RecordNotFound if dataimport.nil?
    dataimport
  end
end
