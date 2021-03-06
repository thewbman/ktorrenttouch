
KTorrentTouch = {};

KTorrentTouch.hostsList = [];

debug = true;

enyo.kind({
	name: "KTorrentTouch.main",
	kind: enyo.VFlexBox,
	className: "KTorrentTouch",
	published: {
		currentview: "kttHostsList",
		phonePixels: 500,					//switch from phone mode to tablet
		currentMode: "torrents",
		currentUrl: "http://www.google.com/",
	},
	components: [
		{kind: "AppMenu", components: [
			{caption: "About", onclick: "openAbout"},
			{caption: "Preferences", onclick: "openPreferences"},
			{caption: "Open in browser", onclick: "openWebpage"},
			{caption: "Help", components: [
				{caption: "Help", onclick: "openHelp"},
				{caption: "Email developer", onclick: "emailDeveloper"},
				{caption: "Leave review", onclick: "openCatalog"},
			]},
		]},
		
		{name: "aboutPopup", kind: "Popup", scrim: true, components: [
			{content: "KTorrentTouch", style: "text-align: center; font-size: larger;"},
			{content: "<hr />", allowHtml: true},
			{name: "aboutPopupText", content: "KTorrentTouch is an app for controlling a KTorrent program.  You should already have a KTorrent program setup and running on your computer for this app to work.   The torrents are downloaded to the computer and not to this device.  ", style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{content: '<a href="http://code.google.com/p/ktorrenttouch/">App homepage</a>', allowHtml: true, style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{content: '<a href="http://ktorrent.org/">KTorrent homepage</a>', allowHtml: true, style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{kind: "Button", caption: "OK", onclick:"closeAboutPopup"},
			{kind: "Button", caption: "Help", onclick:"openHelp"}
		]},
		
		{name: "preferencesPopup", kind: "Popup", scrim: true, showKeyboardWhenOpening: false, onBeforeOpen: "beforeOpenPreferencesPopup", components: [
			{content: "KTorrentTouch", style: "text-align: center; font-size: larger;"},
			{content: "<hr />", allowHtml: true},			
			{kind: "HFlexBox", components: [
				{name: "theme", kind: "ListSelector", label: "Theme", onChange: "themeSelect", flex: 1, items: [
					{caption: "Dark", value: "dark"},
					{caption: "Light", value: "light"},
				]},
			]},
			{content: "<hr />", allowHtml: true},
			{kind: "HFlexBox", components: [
				{content: 'Allow annonymous developer feedback using <a href="http://metrix.webosroundup.com/privacy">Metrix</a>', allowHtml: true, style: "font-size: smaller;", flex: 1},
				{name: "metrixToggle", kind: "ToggleButton"},
			]},
			{content: "<hr />", allowHtml: true},
			{kind: "HFlexBox", components: [
				{content: "Debug mode", allowHtml: true, style: "font-size: smaller;", flex: 1},
				{name: "debugToggle", kind: "ToggleButton"},
			]},
			{content: "<hr />", allowHtml: true},
			{kind: "Button", caption: "OK", onclick:"closePreferencesPopup"}
		]},
		
		{name: "messagePopup", kind: "Popup", scrim: true, onBeforeOpen: "beforeBannerMessageOpen", components: [
			{name: "messagePopupText", style: "text-align: center;"},
			{kind: "Button", caption: "OK", onclick:"closeMessagePopup"}
		]},
		
		{flex: 1, kind: "Pane", className: "pane", onSelectView: "viewSelected", transitionKind: "enyo.transitions.Simple", components: [
			{name: "slidingPane", kind: "SlidingPane", flex: 1, wideWidth: this.phonePixels, onChange: "slidingChanged", components: [	
				{name: "left", dragAnywhere: false, width: "33%", components: [
					{kind: "kttHostsList", onHostSelected: "gotHostSelected", onPreferences: "openPreferences", onOpenAboutPopup: "openAbout", onSavePreferences: "savePreferences", onBannerMessage: "bannerMessage"},
				]},
				{name: "middle", dragAnywhere: false, width: "50%", components: [
					{kind: "kttTorrentsList", onTorrentSelected: "gotTorrentSelected", onTorrentDetailsUpdate: "gotTorrentDetailsUpdate", onDisconnected: "gotDisconnected"},
				]},
				{name: "right", dragAnywhere: false, flex: 1, components: [
					{kind: "kttTorrentDetails", onNotifyChangedTorrent: "gotTorrentChanged", flex: 1},
				]},
			]},
			{name: "help", kind: "Help", onCloseHelp: "showTorrents"},
		]}
	],
	
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
		
		//enyo.keyboard.setResizesWindow(false);
		
		KTorrentTouch.Metrix = new Metrix();
		
		var prefsCookieString = enyo.getCookie("KTorrentTouch-prefs");
		
		if(prefsCookieString) {
			if(debug) this.log("we have preferences");
			KTorrentTouch.prefsCookie = enyo.json.parse(prefsCookieString);
			
			if(!KTorrentTouch.prefsCookie.theme) KTorrentTouch.prefsCookie.theme = "dark";
			
			debug = KTorrentTouch.prefsCookie.debug;
			
			if(KTorrentTouch.prefsCookie.allowMetrix) setTimeout(enyo.bind(this,"submitMetrix"),500);
			
		} else {
			if(debug) this.log("we don't have any preferences");
			KTorrentTouch.prefsCookie = defaultCookie();
			
			setTimeout(enyo.bind(this,"doOpenAboutPopup",500));
		}
		
		this.addClass(KTorrentTouch.prefsCookie.theme);
		
		this.savePreferences();
		
		
		KTorrentTouch.hostsList = [];
		
		//var myHostsStorage = localStorage["KTorrentTouch.hosts"];
		var myHostsStorage = enyo.getCookie("KTorrentTouch-hosts");
		
		if(myHostsStorage) {
			//if(debug) this.log("we have hosts: "+myHostsStorage);
			if(debug) this.log("we have hosts");
			KTorrentTouch.hostsList.length = 0;
			KTorrentTouch.hostsList = enyo.json.parse(myHostsStorage);
		} else {
			if(debug) this.log("we don't have any saved hosts");
			//KTorrentTouch.hostsList.push({hostname: "192.168.1.105", port: 8052, username: "ktorrent", password: "ktorrent"});
		}
		
		this.$.kttHostsList.render();
	},
	
	submitMetrix: function() {
		if(debug) this.log("submitMetrix");
		
		if(window.PalmSystem) KTorrentTouch.Metrix.postDeviceData();
		
		if(window.PalmSystem) KTorrentTouch.Metrix.checkBulletinBoard(1, false);
		
	},
	
	openAbout: function() {
		if(debug) this.log("openAbout");
		
		this.$.aboutPopup.openAtCenter();
	},
	closeAboutPopup: function() {
		if(debug) this.log("closeAboutPopup");
		
		this.$.aboutPopup.close();
	},
	openPreferences: function() {
		if(debug) this.log("openPreferences");
		
		this.$.preferencesPopup.openAtCenter();
	},
	openWebpage: function() {
		if(debug) this.log("openWebpage");
		
		window.open(this.currentUrl);
	},
	beforeOpenPreferencesPopup: function() {
		if(debug) this.log("beforeOpenPreferencesPopup");
		
		this.$.theme.setValue(KTorrentTouch.prefsCookie.theme);
		this.$.metrixToggle.setState(KTorrentTouch.prefsCookie.allowMetrix);
		this.$.debugToggle.setState(KTorrentTouch.prefsCookie.debug);
	},
	themeSelect: function(inSender, inValue, inOldValue) {
		if(debug) this.log("themeSelect from "+inOldValue+" to "+inValue);
		
		this.removeClass(inOldValue);
		this.addClass(inValue);
	},
	closePreferencesPopup: function() {
		if(debug) this.log("closePreferencesPopup");
		
		this.$.preferencesPopup.close();
		
		KTorrentTouch.prefsCookie.theme = this.$.theme.getValue();
		KTorrentTouch.prefsCookie.allowMetrix = this.$.metrixToggle.getState();
		KTorrentTouch.prefsCookie.debug = this.$.debugToggle.getState();
		
		this.savePreferences();
	},
	savePreferences: function() {
		if(debug) this.log("savePreferences");
		
		debug = KTorrentTouch.prefsCookie.debug;
		
		enyo.setCookie("KTorrentTouch-prefs", enyo.json.stringify(KTorrentTouch.prefsCookie));
	},
	openHelp: function() {
		if(debug) this.log("openHelp");
		
		this.$.aboutPopup.close();
		
		this.currentMode = "help";
		this.$.pane.selectViewByName("help");
	},
	emailDeveloper: function() {
		if(debug) this.log("emailDeveloper");
		
		var appInfo = enyo.fetchAppInfo();
		
		window.open("mailto:webmyth.help@gmail.com?subject=KTorrentTouch Help - v"+appInfo.version);
	},
	openCatalog: function() {
		if(debug) this.log("openCatalog");
		
		var appInfo = enyo.fetchAppInfo();
		
		window.open("http://developer.palm.com/appredirect/?packageid="+appInfo.id);
	},
	headerClick: function() {
		if(debug) this.log("got header click");
		
		this.gotDisconnected();
		
		//this.$.pane.selectViewByName("kttHostsList");
		this.$.slidingPane.selectView(this.$.left);
	},
	viewSelected: function(inSender, inView, inPreviousView) {
		if(debug) this.log("changing panes from "+inPreviousView.name+" to "+inView.name);
		this.currentview = inView.name;
		
		//probably a better way to note activation
		switch(this.currentview) {
			case 'kttTorrentsList':
				this.$.kttTorrentsList.activate();
			  break;
			case 'kttTorrentDetails':
				this.$.kttTorrentDetails.activate();
			  break;
		}
	},
	slidingChanged: function(inSender, inSliding, inLastSliding) {
		if(debug) this.log("changing slider from "+inSliding.id+" to "+inLastSliding.id);
		this.$.kttTorrentsList.activate();
		this.$.kttTorrentDetails.activate();
	},
	
	bannerMessage: function(inSender, inMessage, forcePopup) {
		if(debug) this.log("bannerMessage: "+inMessage);
		
		if((forcePopup)||(!window.PalmSystem)){
			this.messageText = inMessage;
			this.$.messagePopup.openAtCenter();
		} else {
			enyo.windows.addBannerMessage(inMessage, "{}");
		} 
		
	},
	beforeBannerMessageOpen: function() {
		if(debug) this.log("beforeBannerMessageOpen");
		
		this.$.messagePopupText.setContent(this.messageText);
	},
	closeMessagePopup: function() {
		if(debug) this.log("messagePopupClick");
		
		this.$.messagePopup.close();
		
	},		
	
	gotHostSelected: function(inSender, inObject) {
		if(debug) this.log("gotHostSelected: "+enyo.json.stringify(inObject));
		//this.$.pane.selectViewByName("kttTorrentsList");
		
		this.currentUrl = "http://"+inObject.hostname+":"+inObject.port;
		
		this.$.kttTorrentsList.gotHostnameData(inObject);
		this.$.kttTorrentDetails.gotHostnameData(inObject);
		this.$.kttTorrentsList.activate();
		
		this.$.slidingPane.selectView(this.$.middle);
		
	},
	gotTorrentSelected: function(inSender, inObject) {
		//if(debug) this.log("gotTorrentSelected: "+enyo.json.stringify(inObject));
		//this.$.pane.selectViewByName("kttTorrentDetails");
		
		this.$.kttTorrentDetails.gotTorrentData(inObject);
		this.$.kttTorrentDetails.activate();
		
		if(document.body.clientWidth < this.phonePixels) {
			this.$.slidingPane.selectView(this.$.right);
		}
	},
	gotTorrentDetailsUpdate: function(inSender, inObject) {
		this.$.kttTorrentDetails.gotTorrentData(inObject);
	},
	gotDisconnected: function() {
		this.$.kttHostsList.gotDisconnected();
		this.$.kttTorrentsList.gotDisconnected();
		this.$.kttTorrentDetails.gotDisconnected();
		
		this.$.slidingPane.selectView(this.$.left);
	},
	gotTorrentChanged: function() {
		this.$.kttTorrentsList.gotTorrentChanged();
		
		if(document.body.clientWidth < this.phonePixels) {
			this.$.slidingPane.selectView(this.$.middle);
		}
	},
	showTorrents: function() {
		if(debug) this.log("showTorrents");
		
		this.currentMode = "torrents";
		this.$.pane.selectViewByName("slidingPane");
	},
	
	
	backHandler: function(inSender, e) {
		if(debug) this.log("backHandler");
		/*
		switch(this.currentview) {
			case 'kttTorrentsList':
				this.$.pane.selectViewByName("kttHostsList");
			  break;
			case 'kttTorrentDetails':
				this.$.pane.selectViewByName("kttTorrentsList");
			  break;
		}
		*/
		
		e.preventDefault();
		
		if(this.currentMode == "torrents") {
			this.$.slidingPane.back(e);
		} 
		
		return true;
	},
	forwardHandler: function(inSender, e) {
		if(debug) this.log("forwardHandler");
		
		forwardHandler
		
	},
	resizeHandler: function() {
		//if(debug) this.log("doing resize to "+document.body.clientWidth+"x"+document.body.clientHeight);
		this.$.slidingPane.resize();
		
		this.$.kttHostsList.render();
		this.$.kttTorrentsList.render();
		this.$.kttTorrentDetails.render();
	}

});





enyo.kind({ name: "kttHostsList",
	kind: "VFlexBox",
	flex: 1,
	style: "", 
	className: "kttHostsListWrapper",
	events: {
		onHostSelected: "",
		onPreferences: "",
		onOpenAboutPopup: "",
		onSavePreferences: "",
		onBannerMessage: "",
	},
	
	selectedRow: -1,
	
	components: [
		{name: "addPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, showKeyboardWhenOpening: true, components: [
			{content: "Add a new KTorrent server", className: "popup-title"},
			{name: "hostnameInput", kind: "Input", hint: "Hostname or IP", autoCapitalize: "lowercase", selection: false, },
			{name: "portInput", kind: "Input", hint: "Port", autoCapitalize: "lowercase", selection: false, },
			{name: "usernameInput", kind: "Input", hint: "Username", autoCapitalize: "lowercase", selection: false, },
			{name: "passwordInput", kind: "PasswordInput", hint: "Password", selection: false, },
			{name: "confirmRemove", kind: "Button", caption: "Add", flex: 1, onclick: "validateHost"},
		]},
		{name: "searchPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{content: "Searching for hosts is not supported at this time", className: "popup-title"},
			{name: "confirmsearch", kind: "Button", caption: "OK", flex: 1, onclick: "doCloseSearch"},
		]},
		
		{name: "header", kind: "Toolbar", className: "mainHeaderHFlexBox", components: [
			{ content: "KTorrentTouch", kind: "Control", flex2: 1, onclick: "revealTop"},
			
		]},
		
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			
			{name: "list", kind: "VirtualRepeater", className: "hostsList", flex: 1, onSetupRow: "getItem", components: [
					{kind: "Divider"},
					{name: "hostItem", kind: "SwipeableItem", onConfirm: "removeItem", confirmCaption: "Delete", components: [
						{kind: "HFlexBox", components: [
							{name: "fullhostname", onclick: "hostSelected", flex: 1, className: "fullhostname"}
						]},
						{kind: "HFlexBox", components: [
							{name: "fullusername", onclick: "hostSelected", flex: 1, className: "fullusername"}
						]},
					]}
				]},
				
			{content: "&nbsp;"}
		]},
		{kind: "Toolbar", components: [
			{kind: "Spacer"},
			{caption: "Add Host", onclick: "addHostPopup"},
			{kind: "Spacer"},
		]}
	],

	
	gotDisconnected: function() {
		if(debug) this.log("gotDisconnected");
		
		this.selectedRow = -1;
		this.refreshList();
	},
	
	getItem: function(inSender, inIndex) {
		//if(debug) this.log("running setuprow index of "+inIndex);
		var row = KTorrentTouch.hostsList[inIndex];
		
		if(row) {
			this.setupDivider(inIndex);
			
			this.$.fullhostname.setContent(row.hostname+":"+row.port);
						
			var usernameText = row.username + ":";
			
			usernameText += "********";
			
			/*
			for(var i = 0; i < row.password.length; i++) {
				usernameText += "*";
			}
			*/
			
			if(inIndex == this.selectedRow) {
				this.$.hostItem.addClass("selected");
			} else {
				this.$.hostItem.removeClass("selected");
			}
			
			this.$.fullusername.setContent(usernameText);
			
			return true;
		}
	},
	setupDivider: function(inIndex) {
	
		if(inIndex == 0) {
			this.$.hostItem.applyStyle("border-top", "none;");
		} else {
			this.$.hostItem.applyStyle("border-top", "1px solid silver;");
		}
		
		this.$.divider.canGenerate = false;
		this.$.hostItem.applyStyle("border-bottom", "none;");
	},

	revealTop: function() {
		this.$.scroller.scrollIntoView(0,0);
		//this.$.list.reset();
		//this.$.list.render();
	},

	refreshList: function() {
		this.$.list.render();
	},

	hostSelected: function(inSender, inEvent) {
		//if(debug) this.log("hostSelected of: "+enyo.json.stringify(KTorrentTouch.hostsList[inEvent.rowIndex]));
		//this.$.list.select(inEvent.rowIndex);		//only for virtuallist
		
		this.doHostSelected(KTorrentTouch.hostsList[inEvent.rowIndex]);
		
		this.selectedRow = inEvent.rowIndex;
		this.refreshList();
	},
	removeItem: function(inSender, inEvent) {
		if(debug) this.log("removeItem of: "+enyo.json.stringify(KTorrentTouch.hostsList[inEvent.rowIndex]));
		
		KTorrentTouch.hostsList.splice(inEvent);
		
		this.refreshList();
		
		this.doSaveHosts();
	},
	
	addHostPopup: function() {
		//this.$.hostnameInput.setValue("");
		//this.$.portInput.setValue("");
		//this.$.usernameInput.setValue("");
		//this.$.passwordInput.setValue("");
	
		enyo.keyboard.setManualMode(true);
		enyo.keyboard.show();
		
		this.$.addPopup.openAtCenter();
		this.$.hostnameInput.forceFocus();
	},
	validateHost: function() {
	
		var problem = false;
		var problemMessage = "";
	
		if(this.$.hostnameInput.getValue() == "") {
			problem = true;
			problemMessage = "You must give a hostname or IP address";
		} else if(this.$.portInput.getValue() == "") {
			problem = true;
			problemMessage = "You must give a port";
		} else if(this.$.usernameInput.getValue() == "") {
			problem = true;
			problemMessage = "You must give a username";
		} else if(this.$.passwordInput.getValue() == "") {
			problem = true;
			problemMessage = "You must give a password";
		} else {
			//
		}
		
		if(problem) {
			this.doBannerMessage(problemMessage, true);
		} else {
			this.addHost();
		}
	
	},
	addHost: function() {
		KTorrentTouch.hostsList.push({hostname: this.$.hostnameInput.getValue(), port: this.$.portInput.getValue(), username: this.$.usernameInput.getValue(), password: this.$.passwordInput.getValue()});
		
		this.$.addPopup.close();
		
		this.$.hostnameInput.setValue("");
		this.$.portInput.setValue("");
		this.$.usernameInput.setValue("");
		this.$.passwordInput.setValue("");
		
		this.$.hostnameInput.forceBlur();
		this.$.portInput.forceBlur();
		this.$.usernameInput.forceBlur();
		this.$.passwordInput.forceBlur();
		
		document.activeElement.blur();
	
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		
		this.refreshList();
		
		this.doSaveHosts();
	},
	doSearchHostPopup: function() {
		this.$.searchPopup.openAtCenter();
	},
	doCloseSearch: function() {
		this.$.searchPopup.close();
	},
	
	doSaveHosts: function() {
		//localStorage["KTorrentTouch.hosts"] = enyo.json.stringify(KTorrentTouch.hostsList);
		enyo.setCookie("KTorrentTouch-hosts", enyo.json.stringify(KTorrentTouch.hostsList));
	},

});






enyo.kind({ name: "kttTorrentsList",
	kind: "VFlexBox",
	flex: 1,
	style: "", 
	className: "kttTorrentsListWrapper",
	events: {
		onTorrentSelected: "",
		onTorrentDetailsUpdate: "",
		onDisconnected: ""
	},
	
	settings: {},
	globals: {},
	torrents: [],
	timer: "",
	
	selectedId: -1,
	selectedRow: -1,
	
	components: [
		{name: "getLoginPage", kind: "WebService", handleAs: "text", onSuccess: "loginPageResponse", onFailure: "loginPageFail"},
		{name: "getChallenge", kind: "WebService", handleAs: "text", onSuccess: "challengeResponse", onFailure: "challengeFail"},
		{name: "actualLoginPage", kind: "WebService", handleAs: "text", method: "post", onSuccess: "actualLoginResponse", onFailure: "actualLoginFail"},
		{name: "getSettings", kind: "WebService", handleAs: "text", onSuccess: "settingsResponse", onFailure: "settingsFail"},
		{name: "getGlobals", kind: "WebService", handleAs: "text", onSuccess: "globalsResponse", onFailure: "globalsFail"},
		{name: "getTorrents", kind: "WebService", handleAs: "text", onSuccess: "torrentsResponse", onFailure: "torrentsFail"},
		{name: "addTorrentService", kind: "WebService", handleAs: "text", onSuccess: "addResponse", onFailure: "addFail"},
		
		{name: "addPopup", kind: "Popup", scrim: true, showKeyboardWhenOpening: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{content: "Add a new torrent by URL", className: "popup-title"},
			{name: "urlInput", kind: "Input", hint: "Paste URL here", selection: false, },
			{name: "confirmRemove", kind: "Button", caption: "Add", flex: 1, onclick: "doAddTorrent"},
		]},
		{name: "errorPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{name: "errorPopupContent", content: "Error message", className: "popup-title"},
			{name: "errorPopupButton", kind: "Button", caption: "OK", flex: 1, onclick: "closeErrorPopup"},
		]},
		{name: "connectingPopup", kind: "Popup", lazy: false, scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{kind: "HFlexBox", components: [
				{kind: "Spacer"},
				{kind: "SpinnerLarge"},
				{kind: "Spacer"},
			]},
			{name: "connectingText", content: "Connecting...", style: "text-align: center;"},
		]},
		
		
		{name: "header", kind: "Toolbar", content: "Torrents", className: "header2", onclick: "revealTop"},
		
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			
			{kind: "HFlexBox", align: "center", pack: "center", components: [
					{name: "globalsDownData", content: ""},
				]},
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					{name: "globalsUpData", content: ""},
				]},
				{name: "list", kind: "VirtualRepeater", className: "torrentsList", onSetupRow: "getItem", components: [
					{kind: "Divider"},
					{name: "torrentItem", kind: "Item", layoutKind: "HFlexLayout", onclick: "torrentselected", components: [
						{name: "fulltorrentname", className: "torrentname", flex: 1}
					]}
				]},
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					{name: "updateSpinner", kind: "Spinner", className: "updateSpinner"},	
				]},
				
			{content: "&nbsp;"}
		]},
		{kind: "Toolbar", components: [
			{kind: "GrabButton"},
			{kind: "Spacer"},
			{ name: "addTorrentButton", caption: "Add Torrent", onclick: "openAddTorrentPopup"},
			{kind: "Spacer"},
			
		]}
	],

	create: function() {
		if(debug) this.log("creating torrents list");
		this.inherited(arguments);
		
		this.$.addTorrentButton.setShowing(false);
		
	},
	activate: function() {
		if(debug) this.log("activating kttTorrentsList");
		
		this.$.scroller.scrollIntoView(0,0);
		
		this.selectedRow = -1;
		this.selectedId = -1;
		
		this.$.connectingText.setContent("Getting login page...");
		this.$.connectingPopup.openAtCenter();
		this.$.spinnerLarge.show();
		
		this.$.getLoginPage.setUrl("http://"+this.hostname+":"+this.port+"/login.html");
		this.$.getLoginPage.call();
	},
	
	
	gotHostnameData: function(inObject) {
		if(debug) this.log("gotHostnameData");
		
		this.hostname = inObject.hostname;
		this.port = inObject.port;
		this.username = inObject.username;
		this.password = inObject.password;
				
	},
	gotTorrentChanged: function() {
		if(debug) this.log("gotTorrentChanged");
		
		this.doTorrentDetailsUpdate({name: "", total_bytes: "", bytes_downloaded: "", bytes_uploaded: "", download_rate: "", upload_rate: "", seeders: "", leechers: "", files: 0, status: ""});
		
		this.selectedRow = -1;
		this.selectedId = -1;
		
		/*
		this.torrents.sort(double_sort_by('status', 'name', false));
		this.$.list.render();
		*/
		try {
			clearTimeout(this.timer);
			
			this.delayedGlobalsCall();
			
		} catch (e) {
			console.error(e);
		}
	},
	gotDisconnected: function() {
		if(debug) this.log("gotDisconnected");
		
		this.$.globalsDownData.setContent("");
		this.$.globalsUpData.setContent("");
		
		this.$.updateSpinner.hide();
		
		this.torrents.length = 0;
		this.selectedRow = -1;
		this.selectedId = -1;
		
		this.refreshList();
		
		this.$.addTorrentButton.setShowing(false);
	},
	
	
	loginPageResponse: function(inSender, inResponse) {
		if(debug) this.log("loginPageResponse");
		
		this.$.connectingText.setContent("Got login page...");
		
		this.formObject = { Login: "", username: "", password: "", challenge: "" };
		
		this.$.connectingText.setContent("Getting challenge...");
		
		this.$.getChallenge.setUrl("http://"+this.hostname+":"+this.port+"/login/challenge.xml");
		this.$.getChallenge.call();
	
	},
	challengeResponse: function(inSender, inResponse) {
		if(debug) this.log("challengeResponse");
		
		this.$.connectingText.setContent("Got challenge response...");
		
		//should be able to get back as xml - asdf
		var xmlstring = inResponse.trim();
		var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
		
		//start parsing
		var challengeNode;
		challengeNode = xmlobject.getElementsByTagName("challenge")[0];
		this.challengeText = challengeNode.childNodes[0].nodeValue;
		//if(debug) this.log("challenge text: "+this.challengeText);
		
		this.formObject.Login = "Sign+in";
		this.formObject.username = this.username;
		this.formObject.password = "";
		this.formObject.challenge = hex_sha1(this.challengeText + this.password);
		
		this.$.actualLoginPage.setUrl("http://"+this.hostname+":"+this.port+"/login?page=interface.html");
		this.$.actualLoginPage.call(this.formObject);
		
	},
	actualLoginResponse: function(inSender, inResponse) {
		if(debug) this.log("actualLoginResponse");
		
		this.$.connectingText.setContent("Logged in...");
		
		this.$.getSettings.setUrl("http://"+this.hostname+":"+this.port+"/data/settings.xml");
		this.$.getSettings.call();
	},
	settingsResponse: function(inSender, inResponse) {
		if(debug) this.log("getSettings");
		
		this.$.connectingText.setContent("Got settings...");
			
		var xmlstring = inResponse.trim();
		var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
		
		//Start parsing
		this.settings.maxDownloads = xmlobject.getElementsByTagName("maxDownloads")[0].childNodes[0].nodeName;
		this.settings.maxSeeds = xmlobject.getElementsByTagName("maxSeeds")[0].childNodes[0].nodeName;
		//add more as needed
		
		this.$.connectingPopup.close();
		enyo.scrim.hide();
		
		this.$.updateSpinner.show();
		
		this.$.getGlobals.setUrl("http://"+this.hostname+":"+this.port+"/data/global.xml");
		this.$.getGlobals.call();
		
	},
	globalsResponse: function(inSender, inResponse) {
		if(debug) this.log("getGlobalsResponse");
		
		try {
			clearTimeout(this.timer);
		} catch (e) {
			console.error(e);
		}
			
		var xmlstring = inResponse.trim();
		var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
		
		//Start parsing
		this.globals.transferred_down = xmlobject.getElementsByTagName("transferred_down")[0].childNodes[0].nodeValue;
		this.globals.transferred_up = xmlobject.getElementsByTagName("transferred_up")[0].childNodes[0].nodeValue;
		
		this.globals.speed_down = xmlobject.getElementsByTagName("speed_down")[0].childNodes[0].nodeValue;
		this.globals.speed_up = xmlobject.getElementsByTagName("speed_up")[0].childNodes[0].nodeValue;
		
		this.globals.dht = xmlobject.getElementsByTagName("dht")[0].childNodes[0].nodeValue;
		this.globals.encryption = xmlobject.getElementsByTagName("encryption")[0].childNodes[0].nodeValue;
		
		this.$.globalsDownData.setContent(this.globals.speed_down+" down"); 
		this.$.globalsUpData.setContent(this.globals.speed_up+" up"); 
		
		this.$.getTorrents.setUrl("http://"+this.hostname+":"+this.port+"/data/torrents.xml");
		this.$.getTorrents.call();
		
	},
	torrentsResponse: function(inSender, inResponse) {
		if(debug) this.log("torrentsResponse");
		
		this.torrents.length = 0;
			
		var xmlstring = inResponse.trim();
		var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
		var singleTorrentNodeArray, singleTorrentChildNode;
		var singleTorrentJson = {};
		
		singleTorrentNodeArray = xmlobject.getElementsByTagName("torrent");
		
		for(var i = 0; i < singleTorrentNodeArray.length; i++){
			
			singleTorrentJson = {};
			
			singleTorrentJson.id = i;
			
			for(var j = 0; j < singleTorrentNodeArray[i].childNodes.length; j++){
			
				singleTorrentChildNode = singleTorrentNodeArray[i].childNodes[j];
				
				switch(singleTorrentChildNode.nodeName) {
					case 'name':
						singleTorrentJson.name = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'info_hash':
						singleTorrentJson.info_hash = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'status':
						singleTorrentJson.status = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'bytes_downloaded':
						singleTorrentJson.bytes_downloaded = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'bytes_uploaded':
						singleTorrentJson.bytes_uploaded = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'total_bytes':
						singleTorrentJson.total_bytes = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'total_bytes_to_download':
						singleTorrentJson.total_bytes_to_download = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'download_rate':
						singleTorrentJson.download_rate = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'upload_rate':
						singleTorrentJson.upload_rate = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'num_peers':
						singleTorrentJson.num_peers = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'seeders':
						singleTorrentJson.seeders = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'seeders_total':
						singleTorrentJson.seeders_total = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'leechers':
						singleTorrentJson.leechers = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'leechers_total':
						singleTorrentJson.leechers_total = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'running':
						singleTorrentJson.running = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'percentage':
						singleTorrentJson.percentage = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					case 'num_files':
						singleTorrentJson.num_files = singleTorrentChildNode.childNodes[0].nodeValue;
					  break;
					  
					default:
						//Mojo.Log.info("Unknown nodename: "+singleTorrentChildNode.nodeName);
					  break;
					  
				}
			
			}
			
			this.torrents.push(singleTorrentJson);
		
		}
		
		
		if(this.torrents.length > 0){
			this.torrents.sort(double_sort_by('status', 'name', false));
		} else {
			this.torrents.push({name: "No torrents", total_bytes: "", bytes_downloaded: "", bytes_uploaded: "", download_rate: "", upload_rate: "", seeders: "", leechers: "", files: 0, status: ""});
		}
		
		this.$.list.render();
		
		
		//Send updated torrent to details
		this.activeTorrentDetails = {name: "", total_bytes: "", bytes_downloaded: "", bytes_uploaded: "", download_rate: "", upload_rate: "", seeders: "", leechers: "", files: 0, status: ""}
		
		if(this.selectedRow > -1) {
			for(var i = 0; i < this.torrents.length; i++){
				if(this.torrents[i].id == this.selectedId) {
					this.activeTorrentDetails = this.torrents[i];
				}
			}
		}
		
		this.doTorrentDetailsUpdate(this.activeTorrentDetails);
		
		
		this.$.addTorrentButton.setShowing(true);
		
		
		this.$.updateSpinner.hide();
		
		this.timer = setTimeout(enyo.bind(this, this.delayedGlobalsCall), 5000);
		
	},
	addResponse: function(inSender, inResponse) {
		if(debug) this.log("addResponse: "+inResponse);
	
	},
	
	
	loginPageFail: function(inSender, inResponse, inRequest) {
		console.error("loginPageFail: "+enyo.json.stringify(inRequest.xhr));
		
		this.doErrorPopup("Failed to connect to KTorrent server.  Check hostname and port.");
	},
	challengeFail: function(inSender, inResponse, inRequest) {
		console.error("challengeFail: "+enyo.json.stringify(inRequest.xhr));
		
		this.doErrorPopup("Failed to connect to KTorrent server.  Check hostname and port.");
	},
	actualLoginFail: function(inSender, inResponse, inRequest) {
		console.error("actualLoginFail: "+enyo.json.stringify(inRequest.xhr));
	},
	settingsFail: function(inSender, inResponse, inRequest) {
		console.error("settingsFail: "+enyo.json.stringify(inRequest.xhr));
		
		this.doErrorPopup("Failed to login.  Check username and password.");
	},
	globalsFail: function(inSender, inResponse, inRequest) {
		console.error("globalsFail: "+enyo.json.stringify(inRequest.xhr));
		
		this.doErrorPopup("You are no longer connected to KTorrent.  Try logging in again.");
	},
	torrentsFail: function(inSender, inResponse, inRequest) {
		console.error("torrentsFail: "+enyo.json.stringify(inRequest.xhr));
		
		this.doErrorPopup("You are no longer connected to KTorrent.  Try logging in again.");
	},
	addFail: function(inSender, inResponse, inRequest) {
		if(debug) this.log("addFail: "+enyo.json.stringify(inRequest.xhr));
	},
	
	
	getItem: function(inSender, inIndex) {
		var row = this.torrents[inIndex];
		
		if(row) {
			//if(debug) this.log("doing getItem for: "+inIndex+" of total length: "+this.torrents.length);
			
			this.setupDivider(inIndex);
			
			this.$.fulltorrentname.setContent(row.name);
			
			
			if(row.id == this.selectedId) {
				this.$.torrentItem.addClass("selected");
			} else {
				this.$.torrentItem.removeClass("selected");
			}
			
			return true;
		}
	},
	setupDivider: function(inIndex) {
		// use group divider at group transition, otherwise use item border for divider
		var group = this.getGroupName(inIndex);
		this.$.divider.setCaption(group);
		this.$.divider.canGenerate = Boolean(group);
		
		if(Boolean(group)) {
			this.$.torrentItem.addClass("labeledListItem");
			this.$.torrentItem.removeClass("unlabeledListItem");
		} else {
			this.$.torrentItem.removeClass("labeledListItem");
			this.$.torrentItem.addClass("unlabeledListItem");
		}
		//this.$.torrentItem.applyStyle("border-top", Boolean(group) ? "none" : "1px solid silver;");
		//this.$.torrentItem.applyStyle("border-bottom", "none;");
	},
	getGroupName: function(inIndex) {
        // get previous record
		var previous = this.torrents[inIndex-1];
		var current = this.torrents[inIndex];
		var curStatus = current.status;
		
		var prevStatus = "";
		
		if(inIndex == 0) {
			prevStatus = "";
		} else {
			prevStatus = previous.status;
		}

        // new group if first letter of last name has changed
        return prevStatus != curStatus ? curStatus : null;
    },

	delayedGlobalsCall: function(inSender) {
		if(debug) this.log("delayedGlobalsCall");
		
		this.$.updateSpinner.show();
		
		this.$.getGlobals.call();
	},
	
	refreshList: function() {
		this.$.list.render();
	},

	revealTop: function() {
		this.$.scroller.scrollIntoView(0,0);
		//this.$.list.reset();
		//this.$.list.render();
	},
	
	torrentselected: function(inSender, inEvent) {
		if(debug) this.log("torrentselected of: "+enyo.json.stringify(this.torrents[inEvent.rowIndex]));
		
		if((this.torrents[inEvent.rowIndex].name == "No torrents")&&(true)) {
			this.error("Cannot select 'No Torrents' item");
		} else {
			this.selectedId = this.torrents[inEvent.rowIndex].id;
			this.selectedRow = inEvent.rowIndex;
			
			this.$.list.render();
			
			this.doTorrentSelected(this.torrents[inEvent.rowIndex]);
		}
	},
	openAddTorrentPopup: function() {
	
		enyo.keyboard.setManualMode(true);
		enyo.keyboard.show();
		
		this.$.addPopup.openAtCenter();
		this.$.urlInput.forceFocus();
	},
	doAddTorrent: function() {
		if(debug) this.log("trying to add: "+this.$.urlInput.getValue());
		
		this.$.addTorrentService.setUrl("http://"+this.hostname+":"+this.port+"/action?load_torrent="+this.$.urlInput.getValue());
		this.$.addTorrentService.call();
		
		this.$.urlInput.setValue("");
		
		this.$.urlInput.forceBlur();
	
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		
		document.activeElement.blur();
		
		this.$.addPopup.close("", "doAddTorrent");
		
	},
	
	doErrorPopup: function(errorMessage) {
		if(debug) this.log("doErrorPopup: "+errorMessage);
		
		this.doDisconnected();
		
		this.$.errorPopupContent.setContent(errorMessage);
		this.$.errorPopup.openAtCenter();
		
	},
	closeErrorPopup: function() {
		
		this.$.errorPopup.close("", "doAddTorrent");
	
	},

});





enyo.kind({ name: "kttTorrentDetails",
	kind: "VFlexBox",
	flex: 1,
	style: "", 
	className: "kttTorrentDetailsWrapper",
	events: {
		onNotifyChangedTorrent: "",
		onTorrentFileSelected: ""
	},
	
	published: {
		total_bytes: "",
		bytes_downloaded: "",
		bytes_uploaded: "",
		download_rate: "",
		upload_rate: "",
		seeders: "",
		leechers: "",
		status: ""
	},
	
	torrentDetails: {},
	files: [],
	
	components: [
		{name: "getFiles", kind: "WebService", handleAs: "text", onSuccess: "filesResponse", onFailure: "filesFail"},
		{name: "alterTorrent", kind: "WebService", handleAs: "text", onSuccess: "alterTorrentResponse", onFailure: "alterTorrentFail"},
		
		{kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{content: "Are you you sure you want to remove this torrent?", className: "popup-title"},
			{kind: "HFlexBox", components: [
				{name: "confirmRemove", kind: "Button", caption: "Yes", flex: 1, className: "enyo-button-affirmative", onclick: "doRemove"},
				{name: "cancelRemove", kind: "Button", caption: "No", flex: 1, className: "enyo-button-negative", onclick: "closePopup"},
			]}
		]},
		
		{name: "header", kind: "Toolbar", content: "Details", className: "header2", onclick: "revealTop"},
		
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			
			{kind: "RowGroup", showing: false, caption: "Details", components: [
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{content: "", flex: 1},
					{name: "name", className: "name"},
					{content: "", flex: 1},
				]},
				
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "status", className: "value"},
					{kind: "Spacer"},
					{content: "Status", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "total_bytes", className: "value"},
					{kind: "Spacer"},
					{content: "Total Size", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "bytes_downloaded", className: "value"},
					{kind: "Spacer"},
					{content: "Downloaded", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "bytes_uploaded", className: "value"},
					{kind: "Spacer"},
					{content: "Uploaded", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "download_rate", className: "value"},
					{kind: "Spacer"},
					{content: "Download Rate", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "upload_rate", className: "value"},
					{kind: "Spacer"},
					{content: "Upload Rate", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "seeders", className: "value"},
					{kind: "Spacer"},
					{content: "Seeders", className: "label"}
				]},
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{name: "leechers", className: "value"},
					{kind: "Spacer"},
					{content: "Leechers", className: "label"}
				]},
			]},
			
				{name: "fileslist", kind: "VirtualRepeater", onSetupRow: "getItem", components: [
					{kind: "Divider"},
					{kind: "Item", className: "filenames", layoutKind: "HFlexLayout", components: [
						{name: "filename", flex: 1, className: "value"},
						{name: "percentage", className: "label"},
					]}
				]},
				{content: "&nbsp"},
				
		]},
		{name: "footer", kind: "Toolbar", components: [
			{kind: "GrabButton"},
			{kind: "Spacer"},
			{name: "startbutton", caption: "Start", onclick: "doStart"},
			{kind: "Spacer"},
			{name: "stopbutton", caption: "Stop", onclick: "doStop"},
			{kind: "Spacer"},
			{name: "removebutton", caption: "Remove", onclick: "confirmRemove"},
			{kind: "Spacer"},
		]}
	],

	create: function() {
		if(debug) this.log("creating torrent details");
		this.inherited(arguments);
		
		this.$.startbutton.setShowing(false);
		this.$.stopbutton.setShowing(false);
		this.$.removebutton.setShowing(false);
		
	},
	activate: function() {
		if(debug) this.log("activating kttTorrentDetails");
		
		this.$.scroller.scrollIntoView(0,0);
	},
	
	
	gotHostnameData: function(inObject) {
	
		this.hostname = inObject.hostname;
		this.port = inObject.port;
		this.username = inObject.username;
		this.password = inObject.password;
				
	},
	gotTorrentData: function(inObject) {
		if(debug) this.log("gotTorrentData");
		
		this.torrentDetails = inObject;
		
		this.updateDisplay();
				
	},
	gotDisconnected: function() {
		if(debug) this.log("gotDisconnected");
		
		this.$.rowGroup.hide();
		
		this.torrentDetails.name = "";
		this.torrentDetails.status = "";
		this.torrentDetails.total_bytes = "";
		this.torrentDetails.bytes_downloaded = "";
		this.torrentDetails.bytes_uploaded = "";
		this.torrentDetails.download_rate = "";
		this.torrentDetails.upload_rate = "";
		this.torrentDetails.seeders = "";
		this.torrentDetails.leechers = "";
		this.torrentDetails.status = "";
		
		this.files.length = 0;
		
		this.updateDisplay();
	},
	
	
	
	getItem: function(inSender, inIndex) {
		var row = this.files[inIndex];
		
		if(row) {
			this.setupDivider(inIndex);
			this.$.filename.setContent(row.path);
			this.$.percentage.setContent(row.percentage+"%");
			
			return true;
		}
		
	},
	setupDivider: function(inIndex) {
		
		if(inIndex == 0) {
			this.$.divider.setCaption("Files");
			this.$.divider.canGenerate = true;
			this.$.item.addClass("labeledListItem");
			this.$.item.removeClass("unlabeledListItem");
		} else {
			this.$.divider.canGenerate = false;
			this.$.item.removeClass("labeledListItem");
			this.$.item.addClass("unlabeledListItem");
		}
	},

	
	
	filesResponse: function(inSender, inResponse) {
		if(debug) this.log("filesResponse");
		
		var xmlstring = inResponse.trim();
		var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
		var singleFileNodeArray, singleFileChildNode;
		var singleTorrentFile = {};
	
		singleFileNodeArray = xmlobject.getElementsByTagName("file");
		
		for(var i = 0; i < singleFileNodeArray.length; i++){
			
			singleTorrentFile = {};
			
			singleTorrentFile.id = i;
			
			for(var j = 0; j < singleFileNodeArray[i].childNodes.length; j++){
			
				singleFileChildNode = singleFileNodeArray[i].childNodes[j];
				
				switch(singleFileChildNode.nodeName) {
					case 'path':
						singleTorrentFile.path = singleFileChildNode.childNodes[0].nodeValue;
					  break;
					case 'priority':
						singleTorrentFile.priority = singleFileChildNode.childNodes[0].nodeValue;
					  break;
					case 'percentage':
						singleTorrentFile.percentage = singleFileChildNode.childNodes[0].nodeValue;
					  break;
					case 'size':
						singleTorrentFile.size = singleFileChildNode.childNodes[0].nodeValue;
					  break;
					  
					default:
						//Mojo.Log.info("Unknown nodename: "+singleFileChildNode.nodeName);
					  break;
					  
				}
			
			}
			
			this.files.push(singleTorrentFile);
		
		}
		
		this.$.fileslist.render();
		
	
	},
	alterTorrentResponse: function(inSender, inResponse) {
		if(debug) this.log("alterTorrentResponse: "+inResponse);
	},
	
	
	filesFail: function(inSender, inResponse, inRequest) {
		console.error("filesFail: "+enyo.json.stringify(inRequest.xhr));
	},
	alterTorrentFail: function(inSender, inResponse, inRequest) {
		console.error("alterTorrentFail: "+enyo.json.stringify(inRequest.xhr));
	},
	
	
	updateDisplay: function() {
		if(debug) this.log("updateDisplay: "+enyo.json.stringify(this.torrentDetails));
		
		if(this.torrentDetails.name == "")	{
			this.$.rowGroup.hide();
		} else {
			this.$.rowGroup.show();
		}
		
		try{
			this.$.name.setContent(this.torrentDetails.name);
			this.$.status.setContent(this.torrentDetails.status);
			this.$.total_bytes.setContent(this.torrentDetails.total_bytes);
			this.$.bytes_downloaded.setContent(this.torrentDetails.bytes_downloaded);
			this.$.bytes_uploaded.setContent(this.torrentDetails.bytes_uploaded);
			this.$.download_rate.setContent(this.torrentDetails.download_rate);
			this.$.upload_rate.setContent(this.torrentDetails.upload_rate);
			this.$.seeders.setContent(this.torrentDetails.seeders);
			this.$.leechers.setContent(this.torrentDetails.leechers);
			
			if((this.torrentDetails.status == "Stopped")||(this.torrentDetails.status == "Download completed")) {
				this.$.startbutton.setShowing(true);
				this.$.stopbutton.setShowing(true);
				this.$.removebutton.setShowing(true);
			} else if((this.torrentDetails.status == "")||(this.torrentDetails.status == "None")){
				this.$.startbutton.setShowing(false);
				this.$.stopbutton.setShowing(false);
				this.$.removebutton.setShowing(false);
				
				this.revealTop();
			} else {
				this.$.startbutton.setShowing(true);
				this.$.stopbutton.setShowing(true);
				this.$.removebutton.setShowing(true);
			}
			
			this.doFiles();
			
		} catch(e){
			this.error(e);
		}
	},
	doFiles: function() {
		this.files.length = 0
		
		if(this.torrentDetails.status == "") {
			//we don't have an active torrent so dont try to get data
			this.$.fileslist.render();
		
		} else if(this.torrentDetails.num_files == 0) {
			//Just a single file, don't try to get list
		
			var singleObject = {};
		
			singleObject.path = this.torrentDetails.name;
			singleObject.priority = "N/A";
			singleObject.percentage = this.torrentDetails.percentage;
			singleObject.size = this.torrentDetails.total_bytes;
		
			//this.files.push(singleObject);
		
			this.$.fileslist.render();
		
		} else {

			this.$.getFiles.setUrl("http://"+this.hostname+":"+this.port+"/data/torrent/files.xml?torrent="+this.torrentDetails.id);
			this.$.getFiles.call();

		}
		
	},
	revealTop: function() {
		this.$.scroller.scrollIntoView(0,0);
		//this.$.list.reset();
		//this.$.list.render();
	},
	
	doStart: function() {
		this.$.alterTorrent.setUrl("http://"+this.hostname+":"+this.port+"/action?start="+this.torrentDetails.id);
		
		this.$.alterTorrent.call();
		
		this.doNotifyChangedTorrent();
		
	},
	doStop: function() {
		this.$.alterTorrent.setUrl("http://"+this.hostname+":"+this.port+"/action?stop="+this.torrentDetails.id);
		this.$.alterTorrent.call();
		
		this.doNotifyChangedTorrent();
		
	},
	doRemove: function() {
		this.$.alterTorrent.setUrl("http://"+this.hostname+":"+this.port+"/action?remove="+this.torrentDetails.id);
		this.$.alterTorrent.call();
		
		this.$.popup.close("", "doRemove");
		
		this.doNotifyChangedTorrent();
	},
	
	confirmRemove: function() {
		this.$.popup.openAtCenter(this.$.removebutton);
	},
	closePopup: function() {
		this.$.popup.close("", "closePopup");
	},
	
});



enyo.kind({ name: "Help",
	kind: "VFlexBox",
	flex: 1,
	className: "Help",
	events: {
		onCloseHelp: "",
	},
	
	
	components: [
		{name: "header", kind: "Toolbar", content: "KtorrentTouch Help", onclick: "revealTop"},
		
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			{className: "helpContent", components: [
				{content: "KTorrentTouch is an app for controlling a KTorrent program running on a seperate computer.  This app can help manage the torrents that KTorrent is downloading/seeding.  This app does not download anything to this device."},
				{content: "<hr />", allowHtml: true},
				{content: 'In order for this app to work you need to enable the "Web Interface" plugin inside the KTorrent App.'},
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					//kind: "Image", src: "images/plugins.png", width: "300px"},
					{name: "pluginsImageView", kind: "ImageView", flex: 1, height: "300px", centerSrc: "images/plugins.png"},
				]},
				{content: "<hr />", allowHtml: true},
				{content: 'Once the plugin is enabled, you can set the port, username and password under Settings --> Configure KTorrent.'},
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					//kind: "Image", src: "images/settings.png", width: "300px"},
					{name: "settingsImageView", kind: "ImageView", flex: 1, height: "300px", centerSrc: "images/settings.png"},
				]},
				{content: "<hr />", allowHtml: true},
				{content: 'If you have any problems you can try emailing the developer <a href="mailto:webmyth.help@gmail.com&subject=KTorrentTouch Help"> here</a>.'},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			{kind: "Spacer"},
			{caption: "Go Back", onclick: "doCloseHelp"},
			{kind: "Spacer"},
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		var appInfo = enyo.fetchAppInfo();
		
		this.$.header.setContent("KTorrentTouch v"+appInfo.version+" help");
		
		this.revealTop();
		
		this.$.pluginsImageView.setCenterSrc("images/plugins.png");
		this.$.settingsImageView.setCenterSrc("images/settings.png");
		this.$.pluginsImageView.render();
		this.$.settingsImageView.render();
		
	},
	
	revealTop: function() {
		if(debug) this.log("revealtop");
		
		this.$.scroller.scrollIntoView(0,0);
	},
	
	
});
		
