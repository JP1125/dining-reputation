function send(request) {
	chrome.runtime.sendMessage(request, function(response) {});
}
// heuristic
var url = location.href;
var query = "";
if (url.indexOf("https://tabelog.com/")!==-1) {
	query = $("h2.display-name").text().trim();
}
else if (url.indexOf("https://retty.me/")!==-1) {
	query = $("span.restaurant-summary__display-name").text().trim();
}
else if (url.indexOf("https://restaurant.ikyu.com/")!==-1) {
	query = $("h1.guide-HeroBox_name").text().trim();
	//query = $("span.guide-HeroBox_name_kana").text().trim();
}
else if (url.indexOf("https://www.ozmall.co.jp/restaurant/")!==-1) {
	query = $("h1.shop-name").text().trim();
	//query = $("spam.shop-name__ruby").text().trim();
}
send({type:"content", query:query});

