# coding: UTF-8

module EmailAddressValidator
  module Regexp
    ATEXT = /[A-Za-z0-9!#\$%&'\*\+\-\/=\?\^_`\{\|\}\~]/
    DOT_ATOM = /(?:#{ATEXT})+(?:\.(?:#{ATEXT})+)*/

    TEXT = /[\x01-\x09\x0B\x0C\x0E-\x7F]/
    QTEXT = /[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7E]/
    QUOTED_PAIR = /\\#{TEXT}/
    QCONTENT = /(?:#{QTEXT}|#{QUOTED_PAIR})/
    QUOTED_STRING = /"(?:\s*#{QCONTENT})*\s*"/

    DTEXT = /[\x01-\x08\x0B\x0C\x0E-\x1F\x21-\x5A\x5E-\x7E]/
    DCONTENT = /(?:#{DTEXT}|#{QUOTED_PAIR})/
    DOMAIN_LITERAL = /\[(?:\s*#{DCONTENT})*\s*\]/
    DOMAIN = /(?:#{DOT_ATOM}|#{DOMAIN_LITERAL})/

    LOCAL_PART = /(?:#{DOT_ATOM}|#{QUOTED_STRING})/

    ADDR_SPEC = /^(#{LOCAL_PART})@(#{DOMAIN})$/
  end
end