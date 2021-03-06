'use strict';

let Background = (function() {
	let _searchTabId = null;
	let _profileTabId = null;
	let _step = null;
	let _urls = [];
	let _profiles = [];
	let _employees = [];
	/**
	 * Start the automatic process. This will be executed by "Start" button on popup screen.
	 * @param {string} keyword 
	 * @return {void}
	 */
	const start = (data, callback) => {
		let keyword = data.keyword;
		let company = data.company;
		localStorage._page = JSON.stringify(1);
		localStorage._started = JSON.stringify(true);
		localStorage._keyword = JSON.stringify(keyword);
		localStorage._company = JSON.stringify(company);
		LinkedInScraper.openSearch(1, (tabId) => {
			_searchTabId = tabId;
			_step = "search";
			if (typeof callback === "function") {
				callback();
			}
		});
	}

	const downloadToCSV = () => {
        const toLine = arr => arr.map(x => `"${(x + "").replace(/"/g, '""')}"`).join(",");
        let data = null;
		let keyword = JSON.parse(localStorage._keyword || "null") || "No-keyword";
        let employees = _employees;
        
        let header = ["company", "url", "name", "location", "headline", "current"];
		if (employees.length > 0) {
			data = employees.map(e => toLine([
					keyword,
					e.url,
					e.name,
					e.location,
					e.headline,
					e.current
			]));
			
			data.unshift(toLine(header))

			downloadPlaintext(data.join("\n"), `${keyword}-${new Date().toISOString()}.csv`)
		}
		_employees = [];
    }


    const downloadPlaintext = function(data, filename) {
        let blob = new Blob([data], { type: "text/plain" })

        let el = document.createElement("a")
        el.href = URL.createObjectURL(blob)
        el.download = filename
        document.body.appendChild(el)
        el.click()
        document.body.removeChild(el)
    }


	const stop = (callback) => {
		localStorage._started = JSON.stringify(false);
		downloadToCSV();
		
		if (typeof callback === "function") {
			callback();
		}
	}

	const openSearchPage = (page, callback) => {
		_step = "search";
		LinkedInScraper.openSearch(page, (tabId) => {
			_searchTabId = tabId;
			if (typeof callback === "function") {
				callback();
			}
		});
	}

	const visitProfile = (url) => {
		_step = "profile";
		LinkedInScraper.openProfile(url, (tabId) => {
			_profileTabId = tabId;
		})
	}

	const nextPage = () => {
		let page = JSON.parse(localStorage._page);
		let maxPages = JSON.parse(localStorage._max_pages || "null") || Number.POSITIVE_INFINITY;

        if (page > maxPages) {
            alert("Hit max pages: " + page);
            downloadToCSV();
            return false;
        }

        setTimeout(function() {
        	openSearchPage(page + 1);
        }, 500);
	}

	const checkUrls = () => {
		if (_urls.length > 0) {
			let url = _urls.pop();
			if (url.match(/\/search\/results\/index\//g)) {
				checkUrls();
			} else {
				visitProfile(url);
			}
		} else {
			nextPage();
		}
	}

	/**
	 * Getter and Setter of state.
	 * @param {object} params 
	 * @return {object}
	 */
	const state = (params) => {
		if (!params) {
			return {
				started: JSON.parse(localStorage._started || "false")
			}
		} else {
			for (let p in params) {
				localStorage[p] = JSON.stringify(params[p]);
			}
		}
	}

	const profiles = () => {
		return _profiles;
	}

	const employees = () => {
		return _employees;
	}

	/**
	 * Initializer.
	 */
	const init = () => {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			switch(request.from) {
				case "popup":
					//	To do 
					break;

				case "linkedin":
					if (request.action == "status") {
						sendResponse({
							started: JSON.parse(localStorage._started || "false"),
							step: _step,
							searchTabId: _searchTabId,
							profileTabId: _profileTabId
						});
					} else if (request.action == "urls") {
						if (_searchTabId == sender.tab.id) {
							_urls = request.urls;
							chrome.tabs.remove(_searchTabId, () => {
								_searchTabId = null;
								checkUrls();
							})
						}
					} else if (request.action == "employees") {
						let employees = request.employees;
						Array.prototype.push.apply(_employees, employees);

						if (employees.length > 0) {
							nextPage();
						} else {
							downloadToCSV();
						}
					} else if (request.action == "profile") {
						/*
						if (_profileTabId == sender.tab.id) {
							let profile = request.profile;
							_profiles.push(profile);
							if (_profiles.length > 20) {
								downloadToCSV();
								_profiles = [];
							}
							if (_profileTabId) {
								chrome.tabs.remove(_profileTabId, () => {
									_profileTabId = null;
									checkUrls();
								});
							}
						}
						*/
					}
					break;

				default:
					console.log("Unknown message arrived.");
					break;
			}
		});
	}

	return {
		init: init,
		start: start,
		stop: stop,
		state: state,
		profiles: profiles,
		toCSV: downloadToCSV
	};
})();

(function(window, jQuery) {
	window.Background = Background;
	window.Background.init();
})(window, $);