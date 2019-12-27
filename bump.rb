#!/usr/bin/env ruby

require 'date'

Dir.chdir(File.dirname(__FILE__))

NEWS_HEADER_REGEX = /^(\d+)\.(\d+)\.(\d+) \(\d{4}-\d{2}-\d{2}\)$\n-+/
PARTS = ['major', 'minor', 'patch'].freeze
NEWS_HEADER = <<-NEWS
Development
-----------

### NOTICES
- None yet

### Features
- None yet

### Bug fixes / enhancements
- None yet

NEWS

class Version < Array
  def initialize(parts)
    raise "Expected three version parts" unless parts.count == 3
    super(parts.map(&:to_i))
  end

  def bump(pos)
    self[pos] += 1
    (pos + 1..2).each { |p| self[p] = 0 }
  end

  def to_s
    join('.')
  end
end

def version_from_tag(tag)
  m = tag.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  raise "Could not parse tag #{tag}" unless m

  Version.new(m[1..3])
end

def version_from_news(news)
  m = news.match(NEWS_HEADER_REGEX)
  raise "Could not find NEWS version" unless m

  Version.new(m[1..3])
end

def updated_news(news, next_version)
  NEWS_HEADER + tag_header(next_version) + clean_development(news)
end

def tag_header(next_version)
  h = "#{next_version} (#{Date.today})"
  h + "\n#{'-' * h.length}\n\n"
end

def clean_development(news)
  development, header, rest = news.partition(NEWS_HEADER_REGEX)
  development_lines = development.split("\n")
  development_lines.delete('Development')
  development_lines.delete('-----------')

  # Write non-empty sections
  news_sections(development_lines).map { |name, lines|
    if name && lines.any? { |l| !l.strip.empty? }
      "### #{name}\n#{lines.join("\n")}\n"
    end
  }.compact.join('') + "\n#{header}#{rest}"
end

def news_sections(lines)
  sections = []
  section_lines = []
  section_name = nil
  lines.each do |line|
    if line.start_with?('###')
      if section_name
        sections << [section_name, section_lines]
      end
      section_lines = []
      section_name = line[4..-1]
    elsif line != '- None yet'
      # Replace initial `-` for `*`
      section_lines << line.sub(/^(\s*)-/, '\1*')
    end
  end
  sections << [section_name, section_lines] if section_name

  sections
end

def help
  puts 'Usage: '
  puts '  bump.rb [ major | minor | patch ]    (defaults to `patch`)'
  exit(1)
end

ARGV << 'patch' if ARGV.empty?
help unless ARGV.count == 1

# raise 'Not in master branch' unless `git rev-parse --abbrev-ref HEAD`.strip == 'master'

puts 'Pulling and fetching tags...'
`git pull --tags`

news_content = File.read('NEWS.md')

puts 'Calculating current version...'
tag_version = version_from_tag(`git describe --abbrev=0`)
news_version = version_from_news(news_content)

unless tag_version == news_version
  raise "Mismatched versions between git tag (#{tag_version}) and NEWS (#{news_version})"
end

part = PARTS.index(ARGV[0])
help unless part

next_version = tag_version.dup
next_version.bump(part)

puts "Bumping from #{tag_version} to #{next_version}. Enter to confirm, Ctrl+C to cancel"
STDIN.getc

puts 'Updating NEWS...'
File.write('NEWS.md', updated_news(news_content, next_version))

puts 'Committing, tagging and pushing...'
`git add NEWS.md`
`git commit -m "Bump to #{next_version}"`
`git tag -a v#{next_version} -m "Version #{next_version}"`
# `git push origin master --follow-tags`
