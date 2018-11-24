var thisTabId = -1;
var thisWindowId = -1;
function getStorageData(k) { return JSON.parse(localStorage.getItem(k)); }
function setStorageData(k,v) { localStorage.setItem(k, JSON.stringify(v)); }

function getReputationData(key, type, query, sendResponse) {
	//console.log('bg.getReputationData', "type="+type, "q="+query);
	var result = [];
	// search reputations by Google
	$.ajax({
		type: 'GET',
		url: "https://www.google.co.jp/search?q="+encodeURI(query),
		cache: false,
		timeout: 4500,
		dataType: 'html'
	})
	.then((d, textStatus, jqXHR) => {
		var data = [];
		try {
			d = d.replace(/<img /g,"<dummy "); // XXX: prevent image loading
			$(d).find("div.g").each(function(idx, element) {
				var elem = $(element);
				var ttl = "";
				var url = "";
				var rep = "";
				try {
					url = elem.find("a").attr("href");
					if (url.indexOf("https://tabelog.com")==0) ttl = "食べ<br/>ログ";
					else if (url.indexOf("https://ja-jp.facebook.com")==0) ttl = "Facebook";
					else if (url.indexOf("https://retty.me")==0) ttl = "Retty";
					else if (url.indexOf("https://www.ozmall.co.jp")==0) ttl = "Ozmall";
					else if (url.indexOf("https://restaurant.ikyu.com")==0) ttl = "一休";
					else if (url.indexOf("/maps/uv")==0) ttl = "Google";

					if (ttl!=="") {
						rep = elem.find("g-review-stars").parent().text();
						if (ttl=="Google") url = "https://www.google.co.jp/search?q="+encodeURI(query)
						if (rep!="") data.push({title:ttl, url:url, rep:rep, error:false});
					}
				} catch (e) {
					console.error("ERROR: ajax.dom-parse(g-review-stars)", e);
				}
			});
		} catch (e) {
			console.error("ERROR: html replace or ajax.dom-parse(html->div.g)", e);
		}
		if (data.length==0) {
			result.push({title:"Data Not Found", rep:"レビュー結果はありませんでした。", error:true});
		}
		else {
			result = result.concat(data);
		}
	})
	.catch((jqXHR, textStatus, errorThrown) => {
			result.push({title:"Error", rep:"ネットワークエラー", error:true});
	})
	.then(() => {
		setStorageData(key, {query:query, data:result, type:type});
		if (type=="content" && result.length>0) {
			chrome.browserAction.setBadgeText({text: String(result.length)});
			chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 100]});
		}
		else {
			chrome.browserAction.setBadgeText({text: ""});
		}
	});
}

// from contentscript or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var data = [];
	var query = request.query;
	if (request.type === "content") { // from content (automatically)
		if (query=="") {
			localStorage.removeItem(sender.tab.id);
			chrome.browserAction.setBadgeText({text: ""});
		}
		else {
			var _d = getStorageData(sender.tab.id);
			if(!_d || _d.query!=query) {
				//console.log('onMessage', sender.tab.id, request.type, "q="+query);
				localStorage.removeItem(sender.tab.id);
				getReputationData(sender.tab.id, request.type, query, sendResponse);
			}
		}
	}
	else if (request.type === "popup") { // from popup
		localStorage.removeItem("popup");
		if (query=="") {
			chrome.browserAction.setBadgeText({text: ""});
		}
		else {
			getReputationData("popup", request.type, query, sendResponse);
		}
	}
	//else if (request.type === "debug") {
	//	console.log('debug', request.data);
	//}
	sendResponse({});
});

// tab event
chrome.tabs.onActivated.addListener(function (tabId) {
	thisTabId = tabId.tabId;
	var data = [];
	var dd = getStorageData(thisTabId);
	if(dd) data = dd.data;

	if (data.length>0) {
		chrome.browserAction.setBadgeText({text: String(data.length)});
		chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 100]});
	}
	else {
		chrome.browserAction.setBadgeText({text: ""});
	}
});

chrome.tabs.onRemoved.addListener(function (tabId) {
	localStorage.removeItem(tabId.tabId);
});

