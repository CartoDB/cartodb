# parent factory class to manage 
module CartoDB
  module Import
    class Loader
      include CartoDB::Import::Util
      
      @@subclasses = {}      
              
      def initialize opts 
        update_self opts
      end
      
      # this is an abstract method to be implemented in subclasses
      def process!
      end  

      def self.create type, data = {}, options = {}
        type = type.downcase.gsub(/(\.|\s)/,"").to_sym if type.is_a? String
        c = @@subclasses[type]
        c ? c.new(data) : false
        c ? c.new(options) : false
      end

      # Call "register_loader :my_loader" 
      # in subclass to register                    
      def self.register_loader name
        @@subclasses[name] = self
      end      
    end
  end    
end