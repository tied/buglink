(function($) {
    var baseUrl, regex, urlPattern;

    window.episerver = window.episerver || {};
    window.episerver.buglink = episerver.buglink || {};
    window.episerver.buglink.getBugs = function(context) {
        loadConfiguration();
        var pr = require('model/page-state').getPullRequest(),
            project = require('model/page-state').getProject(),
            repository = require('model/page-state').getRepository(),
            links = [];

        if (pr && pr.attributes
            && project && project.attributes
            && repository && repository.attributes) {

            if (pr.attributes.title) {
                links = links.concat(getLinks(pr.attributes.title));
            }
            if (pr.attributes.description) {
                links = links.concat(getLinks(pr.attributes.description));
            }
            if (pr.attributes.fromRef && pr.attributes.fromRef.attributes
                && pr.attributes.fromRef.attributes.displayId) {
                links = links.concat(getLinks(pr.attributes.fromRef.attributes.displayId));
            }

            var url = baseUrl + "/rest/api/1.0/projects/"+project.attributes.key
                        +"/repos/"+repository.attributes.slug
                        +"/pull-requests/"+pr.attributes.id
                        +"/commits?withCounts=true";
            $.ajax({
                url: url,
                success: function(data) {
                    $.each(data.values, function(i, commit) {
                        links = links.concat(getLinks(commit.message));
                    })
                },
                async: false // TODO: Consider async: true, when find how to render SOY template with async data
            });
        }

        var seen = {}, uniqueLinks = $.grep(links, function(l) {
            if (seen[l.title]) {
                return false;
            }
            seen[l.title] = true;
            return true;
        });
        return {links: uniqueLinks};
    };
    function getLinks(text) {
        var match = [], result = [];
        if (regex && urlPattern) {
            while(match = regex.exec(text)) {
                var href = urlPattern.replace("{$id}", match[1]);
                var title = "#"+match[1];
                result.push({href: href, title: title});
            }
        }
        return result;
    };

    function loadConfiguration() {
        baseUrl = AJS.contextPath();
        if (baseUrl) {
            AJS.$.ajax({
                url: baseUrl + "/rest/buglink-admin/1.0/",
                dataType: "json",
                async: false,
                success: function(config) {
                    regex = new RegExp(config.regex, "g");
                    urlPattern = config.urlTemplate;
              }
            });
        }
    }


})(AJS.$)