# parent factory class to manage 
module CartoDB
  module Import
    class Decompressor
      include CartoDB::Import::Util
      
      @@subclasses = {}      
              
      def initialize opts 
        update_self opts
      end
      
      # this is an abstract method to be implemented in subclasses
      def process!
      end  

      def self.create type, options = {}
        type = type.downcase.gsub(/(\.|\s)/,"").to_sym if type.is_a? String
        c = @@subclasses[type]
        c ? c.new(options) : false
      end

      # Call "register_decompressor :my_decompressor" 
      # in subclass to register                    
      def self.register_decompressor name
        @@subclasses[name] = self
      end      
    end
  end    
end