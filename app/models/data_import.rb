# coding: UTF-8
class DataImport < Sequel::Model
  include CartoDB::MiniSequel
  include ActiveModel::Validations 
  
  state_machine :initial => :preprocessing do
    before_transition :updated_now 
    before_transition do
      self.save
    end
    after_transition :log_state_change 
    #after_transition  :uploading => :preparing, :preparing => :importing, :importing => :cleaning do
    #end
    after_transition any => :complete do
      self.success = true
      self.logger << "SUCCESS!\n"
      self.save
    end
    after_transition any => :destroyed do
      self.success = false
      self.logger << "FAILURE!\n"
      self.save
    end
    
    event :upload do |event| 
      #the import is ready to start handling file upload
      transition :preprocessing => :uploading
    end
    event :download do |event| 
      #the import is ready to start handling file download (url)
      transition :preprocessing => :downloading
    end
    event :migrate do |event| 
      #the import is ready to start migration (query, table, other)
      transition :preprocessing => :migrating
    end
    
    event :file_ready do |event| 
      transition [:uploading, :downloading] => :importing
    end
    
    #events for data import
    event :imported do
      transition :importing => :formatting
    end
    
    #events for data migration
    event :migrated do
      transition :migrating => :formatting
    end
    
    event :formatted do
      transition :formatting => :finishing
    end
    event :finished do 
      transition :finishing => :complete
    end
    event :retry do
      transition any => same
    end
  end
  def updated_now(transition)
    self.updated_at = Time.now
  end
  def log_update(update_msg)
    self.logger << "UPDATE: #{update_msg}\n"
    self.save
  end
  def log_error(error_msg)
    self.logger << "ERROR: #{error_msg}\n"
    self.save
  end
  def log_state_change(transition)
    event, from, to = transition.event, transition.from_name, transition.to_name
    if !self.logger 
      self.logger = "BEGIN \n"
    end
    self.logger << "TRANSITION: #{from} => #{to}, #{Time.now}\n"
  end
end
