# encoding: utf-8

module TrackRecord
  class Entry
    attr_reader :timestamp, :text

    def initialize(text)
      @text       = text
      @timestamp  = Time.now.to_f.to_s
    end #initialize

    def <=>(other)
      timestamp <=> other.timestamp
    end #<=>

    def to_s
      [utc_for(timestamp), text].join(' :: ')
    end #to_s

    private

    def utc_for(timestamp)
      Time.at(timestamp.to_f).utc
    end #utc_for
  end # Entry
end # TrackRecord

