function send(request) {
	chrome.runtime.sendMessage(request, function(response) {});
}

// update popup.html
function updateContent(d) {
	var data = d.data;
	//send({type:"debug", data:{origin:'updateContent', data:d}});
	if (data && data.length>0) {
		var number = data.length;
		$("#freeword").val(d.query);
		$("#reputation_table").empty();
		for (var i=0; i<number; i++) {
			if (data[i]['error'] == false) {
				$("#reputation_table").append("<tr><td><a href='#' data-url='"+data[i]['url']+"'>"+data[i]['title']+"</a></td><td>"+data[i]['rep']+"</td></tr>");
			}
			else {
				$("#reputation_table").append("<tr><td>"+data[i]['title']+"</td><td>"+data[i]['rep']+"</td></tr>");
			}
		}
		if (d.type=="content" && number>0) {
			chrome.browserAction.setBadgeText({text: String(number)});
			chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 100]});
		}
		else {
			chrome.browserAction.setBadgeText({text: ""});
		}
		$("a").click(function () {
			chrome.tabs.create({active:false, url:$(this).attr("data-url")});
		});
	}
}

// retry 5 times
function waitDataFetch(key) {
	//send({type:"debug", data:{origin:'waitDataFetch', data:{key:key}}});
	var isset = false;
	var count = 0;
	var timer = setInterval(function(){
		isset = dataFetch(key);
		count++;
		if (isset || count>=5) {
			clearInterval(timer);
		}
	}, 1000);
}
function dataFetch(key) {
	var dd = localStorage.getItem(key);
	//send({type:"debug", data:{origin:'dataFetch', data:{key:key, data:dd}}});
	if (dd) {
		updateContent(JSON.parse(dd));
		return true;
	}
	return false;
}


// run per popup-click
$(function(){
	$("#search").click(function () {
		var q = $("#freeword").val();
		var dd = localStorage.getItem("popup");
		if (q!="" && (!dd || dd["query"]!=q)) {
			// popup -> background
			$("#reputation_table").html("<tr><td style='text-align:center'><img alt='loading' src='icon/loading.gif' /></td><td></td></tr>");
			chrome.runtime.sendMessage({ type:"popup", query:q }, function (response) {
				var dd = localStorage.getItem("popup");
				if (dd) updateContent(JSON.parse(dd));
				else waitDataFetch("popup");
			});
		}
	});

	$("#reputation_table").html("<tr><td style='text-align:center'><img alt='loading' src='icon/loading.gif' /></td><td></td></tr>");
	var bk = chrome.extension.getBackgroundPage();
	var dd = localStorage.getItem(bk.thisTabId);
	if (dd) updateContent(JSON.parse(dd));
	else waitDataFetch(bk.thisTabId);
});


