# encoding: UTF-8

module CartoDB

  # This class is intended to represent privacy as a value object
  class Privacy

    private_class_method :new

    # Valid values
    VALID = {
      private: 0,
      public: 1,
      link: 2
    }


    def initialize(value)
      @value = value
      raise InvalidPrivacyValue, sym unless self.valid?
      self
    end

    # Factory methods
    def self.from_int_value(i)
      new(i)
    end

    def self.from_symbol(sym)
      value = VALID[sym] || raise InvalidPrivacyValue, sym
      new(value)
    end

    def self.from_str(str)
      value = VALID[str.downcase.to_sym] || InvalidPrivacyValue, str
      new(value)
    end

    def self.from_anything(anything)
      case anything
      when Privacy
        anything
      when Fixnum
        self.from_int(anything)
      when Symbol
        self.from_sym(anything)
      when String
        self.from_str(anything)
      when NilClass
        nil
      else
        raise InvalidPrivacyValue(anything)
      end
    end


    # Conversions
    def to_s
      to_sym.to_s.upcase
    end

    def to_sym
      VALID.invert[@value]
    end

    def to_i
      @value.to_i
    end

    # Validity check
    def valid?
      VALID.has_value? @value
    end

    # Convenience checks
    def private?
      self.to_sym == :private
    end

    def public?
      self.to_sym == :public
    end

    def link?
      self.to_sym == :link
    end


    # Equality operators
    def ==(another)
      self.value == another.value
    end

    def eql?(another)
      self == another
    end

    # used in Array#uniq and other operations
    def hash
      self.value
    end

    # Convenience constants
    PRIVATE = self.from_symbol(:private)
    PUBLIC = self.from_symbol(:public)
    LINK = self.from_symbol(:link)

    private

    def value
      @value
    end

  end

  class InvalidPrivacyValue < ArgumentError
    def initialize(value)
      super("Invalid privacy value '#{value}'")
    end
  end

end
