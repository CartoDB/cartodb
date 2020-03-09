module CartoDB
  module OS
    def self.windows?
      (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM) != nil
    end

    def self.mac?
      (/darwin/ =~ RUBY_PLATFORM) != nil
    end

    def self.unix?
      !windows?
    end

    def self.linux?
      unix? && !mac?
    end
  end

  class RedisTest
    def self.down
    end

    def self.up
    end

  end
end
