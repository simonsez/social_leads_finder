'use strict';

let LinkedInScraper = (function() {
    let _profileTimer = null;
    const parseUrls = () => {
        let profiles = $("ul.results-list li.search-result");
        let employees = [];

        for (let i = 0; i < profiles.length; i ++) {
            let url = (profiles.eq(i).find(".search-result__result-link")[0] || {}).href;
            let name = profiles.eq(i).find(".actor-name").text();
            let headline = profiles.eq(i).find(".subline-level-1").text();
            let location = profiles.eq(i).find(".subline-level-2").text().trim();
            let current = profiles.eq(i).find(".search-result__snippets").text().replace("Current:", "").trim();
            let employee = {
                url: url,
                name: name,
                headline: headline,
                location: location,
                current: current
            };
            console.log("Pushing employee " + name);
            employees.push(employee);
        }

        chrome.runtime.sendMessage({
            from: "linkedin",
            action: "employees",
            employees: employees
        }, () => {
            //
        })
    }

    const parseProfile = () => {
        let name = $("h1.pv-top-card-section__name").text().trim();
        let headline = $("h2.pv-top-card-section__headline").text().trim();
        let location = $("h3.pv-top-card-section__location").text().trim();
        let $webSites = $(".ci-websites .pv-contact-info__ci-container a.pv-contact-info__action");
        let webSites = [];
        for (let i = 0; i < $webSites.length; i ++) {
            webSites.push($webSites.eq(i)[0].href);
        }
        webSites = webSites.join("|");
        let $emails = $(".ci-email .pv-contact-info__contact-item");
        let emails = [];
        for (let i = 0; i < $emails.length; i ++) {
            emails.push($emails.eq(i).text().trim());
        }
        emails = emails.join("|");
        // ci-phone
        let $phones = $(".ci-phone .pv-contact-info__contact-item");
        let phones = [];
        for (let i = 0; i < $phones.length; i ++) {
            phones.push($phones.eq(i).text().trim());
        }
        phones = phones.join("|");
        
        chrome.runtime.sendMessage({
            from: "linkedin",
            action: "profile",
            profile: {
                name, headline, location, webSites, emails, phones
            }
        })
    }

    const init = (step) => {
        if (step == "search" && window.location.pathname.indexOf("/search/results/index") == 0) {
            var scrollBottom = function(loc, callback) {
                $(window).scrollTop(loc);
                if (loc >= $(document).height()) {
                    if (callback != undefined) {
                        callback();
                    }
                } else {
                    window.setTimeout(() => {
                        scrollBottom(loc+200, callback);
                    }, 400);
                }
            }

            scrollBottom(0, () => {
                parseUrls();
            })
        } else if (step == "profile" && window.location.pathname.indexOf("/in/") == 0) {
            $(window).scrollTop($(document).height());
            
            // document.querySelector("button.contact-see-more-less").click()

            _profileTimer = window.setInterval(() => {
                if ($(".contact-see-more-less").length > 0) {
                    clearInterval(_profileTimer);
                    _profileTimer = null;
                    $(".contact-see-more-less").click();
                    parseProfile();
                }
            }, 1000);
        }
    }

    return {
        init: init
    }
})();

(function(window, jQuery) {
    chrome.extension.sendMessage({
        from: "linkedin",
        action: "status"
    }, function(response) {
        if (response.started) {
            LinkedInScraper.init(response.step);
        }
    })
})(window, $);