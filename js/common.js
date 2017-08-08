'use strict';

let LinkedInScraper = (function() {
    let _keyword = JSON.parse(localStorage._keyword || "null") || "";
    let _company = JSON.parse(localStorage._company || "null") || "";
    let _page = JSON.parse(localStorage._page || "1");
    let _searchUrl = `https://www.linkedin.com/search/results/index/?origin=GLOBAL_SEARCH_HEADER&keywords=${_keyword}`

    /**
     * Initialize
     * @return {void}
     */
    const init = () => {
        //
    }

    /**
     * Getter or Setter function of keyword parameter.
     * @param {string} value 
     * @return {string}
     */
    const keyword = (value) => {
        if (!value) {
            return value;
        } else {
            _keyword = value;
            localStorage._keyword = JSON.stringify(value);
        }
    }

    
    /**
     * Open the corresponding search page with page a proper page number
     * @param {number} page 
     * @param {function} callback 
     */
    const openSearchPage = (page, callback) => {
        _page = page;
        localStorage._page = JSON.stringify(page);

        chrome.tabs.update({
            url: getUrl()
        }, (tab) => {
            localStorage._search_tab_id = JSON.stringify(tab.id);

            if (typeof callback == "function") {
                callback(tab.id);
            }
        })
    }

    const openProfile = (url, callback) => {
        chrome.tabs.create({
            url: url
        }, (tab) => {
            if (typeof callback === "function") {
                callback(tab.id);
            }
        });
    }

    /**
     * Getting the search  url made from keyword.
     * @return {string}
     */
    const getUrl = () => {
        _keyword = JSON.parse(localStorage._keyword || "null") || "";
        _company = JSON.parse(localStorage._company || "null") || "";
        _page = JSON.parse(localStorage._page || "null") || 1;
        if (_page == 1) {
            return `https://www.linkedin.com/search/results/index/?origin=GLOBAL_SEARCH_HEADER&keywords=${_keyword}&facetCurrentCompany=${_company}`;
        } else {
            return `https://www.linkedin.com/search/results/index/?origin=GLOBAL_SEARCH_HEADER&keywords=${_keyword}&facetCurrentCompany=${_company}&page=${_page}`;
        }
    }

    return {
        init: init,
        keyword: keyword,
        url: getUrl,
        openSearch: openSearchPage,
        openProfile: openProfile
    }
})();