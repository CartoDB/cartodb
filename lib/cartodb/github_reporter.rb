# encoding: utf-8
require 'json'
require 'github_api'

module CartoDB
  class GitHubReporter
    REPORTABLE_ERRORS = %w{ 99999 2001 }

    def github
      Github.new({
          user: Cartodb.config[:github]['org'], 
          basic_auth: Cartodb.config[:github]['auth'], 
          repo: Cartodb.config[:github]['repo'], 
          org: Cartodb.config[:github]['org']
      })
    end #github

    def report_failed_import(result)
      return self unless REPORTABLE_ERRORS.include?(result.fetch(:error, 0))

      if Cartodb.config[:github].present?
        github.issues.create(failed_import_body(result))
      end
    end #report_failed_import

    def failed_import_body(result)
      {
        "title" => "[Importer] [Autoreport] #{result[:name]}.#{result[:extension]} failed",
        "body" => "File importing failed:" +
        "\n\`\`\`#{::JSON::pretty_generate(result)}\`\`\`"
      }
    end #failed_import_body
  end
end
