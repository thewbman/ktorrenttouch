
debug = false;

enyo.kind({
	name: "KTorrentTouch.main",
	kind: enyo.VFlexBox,
	className: "KTorrentTouch",
	published: {
		currentview: "kttHostsList",
		phonePixels: 500,					//switch from phone mode to tablet
		currentMode: "torrents"
	},
	components: [
		{kind: "AppMenu", components: [
			{caption: "Preferences", onclick: "openPreferences"}
		]},
		
		/*{name: "header", kind: "Toolbar", content: "KTorrentTouch Header", className: "header2", onclick: "headerClick"},*/
		/*
		{flex: 1, kind: "Pane", className: "pane", onSelectView: "viewSelected", components: [
			{kind: "kttHostsList", onHostSelected: "gotHostSelected"},
			{kind: "kttTorrentsList", onTorrentSelected: "gotTorrentSelected", onTorrentDetailsUpdate: "gotTorrentDetailsUpdate"},
			{kind: "kttTorrentDetails"},
			{kind: "kttAddHost", lazy: true}
		]}
		*/
		{flex: 1, kind: "Pane", className: "pane", onSelectView: "viewSelected", components: [
			{name: "slidingPane", kind: "SlidingPane", flex: 1, wideWidth: this.phonePixels, onChange: "slidingChanged", components: [	
				{name: "left", dragAnywhere: false, width: "33%", components: [
					{kind: "kttHostsList", onHostSelected: "gotHostSelected", onPreferences: "openPreferences"},
				]},
				{name: "middle", dragAnywhere: false, width: "33%", components: [
					{kind: "kttTorrentsList", onTorrentSelected: "gotTorrentSelected", onTorrentDetailsUpdate: "gotTorrentDetailsUpdate", onDisconnected: "gotDisconnected"},
				]},
				{name: "right", dragAnywhere: false, flex: 1, components: [
					{kind: "kttTorrentDetails", onNotifyChangedTorrent: "gotTorrentChanged", flex: 1},
				]},
			]},
			{kind: "kttPreferences", onDonePreferences: "gotDonePreferences"},
		]}
	],
	
	openPreferences: function() {
		if(debug) this.log("openPreferences");
		
		this.currentMode = "preferences";
		this.$.pane.selectViewByName("kttPreferences");
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
	
	gotHostSelected: function(inSender, inObject) {
		if(debug) this.log("gotHostSelected: "+enyo.json.stringify(inObject));
		//this.$.pane.selectViewByName("kttTorrentsList");
		
		this.$.kttTorrentsList.gotHostnameData(inObject);
		this.$.kttTorrentDetails.gotHostnameData(inObject);
		this.$.kttTorrentsList.activate();
		
		if((document.body.clientWidth < this.phonePixels)) {
			this.$.slidingPane.selectView(this.$.middle);
		}
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
	gotDonePreferences: function() {
		if(debug) this.log("gotDonePreferences");
		
		this.currentMode = "torrents";
		this.$.pane.selectViewByName("slidingPane");
	},
	
	openAppMenuHandler: function() {
		this.$.appMenu.open();
	},
	closeAppMenuHandler: function() {
		this.$.appMenu.close();
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
		} else if(this.currentMode == "preferences") {
			this.$.kttPreferences.gotBack(e);
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
		onPreferences: ""
	},
	
	selectedRow: -1,
	
	components: [
		{name: "addPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{content: "Add a new KTorrent server", className: "popup-title"},
			{name: "hostnameInput", kind: "Input", hint: "Hostname", autoCapitalize: "lowercase", selection: false, },
			{name: "portInput", kind: "Input", hint: "Port", autoCapitalize: "lowercase", selection: false, },
			{name: "usernameInput", kind: "Input", hint: "Username", autoCapitalize: "lowercase", selection: false, },
			{name: "passwordInput", kind: "PasswordInput", hint: "Password", selection: false, },
			{name: "confirmRemove", kind: "Button", caption: "Add", flex: 1, onclick: "doAddHost"},
		]},
		{name: "searchPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{content: "Searching for hosts is not supported at this time", className: "popup-title"},
			{name: "confirmsearch", kind: "Button", caption: "OK", flex: 1, onclick: "doCloseSearch"},
		]},
		
		{name: "header", kind: "Toolbar", className: "mainHeaderHFlexBox", components: [
			{ content: "KTorrentTouch", kind: "Control", flex2: 1, onclick: "revealTop"},
			//{ name: "prefsButton", kind2: "nouveau.MenuButton", icon: "images/19-gear.png", className: "headerPrefsButton", onclick: "doPreferences"},
		]},
		/*{kind: "MenuButtonHeader", content: "Hosts", onclick: "revealTop"},*/
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			/*{kind: "RowGroup", caption: "Hosts", flex: 1, components: [*/
				{name: "list", kind: "VirtualRepeater", className: "hostsList", flex: 1, onGetItem: "getItem", components: [
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
			/*]},*/
			{content: "&nbsp;"}
		]},
		{kind: "Toolbar", components: [
			{kind: "Spacer"},
			{caption: "Add Host", onclick: "doAddHostPopup"},
			//{kind: "Spacer"},
			//{caption: "Search", onclick: "doSearchHostPopup"},
			{kind: "Spacer"},
		]}
	],

	create: function() {
		if(debug) this.log("creating hosts list");
		this.inherited(arguments);
		
		this.hostsList = [];
		
		//var myHostsStorage = localStorage["KTorrentTouch.hosts"];
		var myHostsStorage = enyo.getCookie("KTorrentTouch-hosts");
		
		if(myHostsStorage) {
			if(debug) this.log("we have hosts: "+myHostsStorage);
			this.hostsList = enyo.json.from(myHostsStorage);
		} else {
			if(debug) this.log("we don't have any saved hosts");
			//this.hostsList.push({hostname: "192.168.1.105", port: 8052, username: "ktorrent", password: "ktorrent"});
		}
		
		this.$.list.render();
	},
	
	gotDisconnected: function() {
		if(debug) this.log("gotDisconnected");
		
		this.selectedRow = -1;
		this.refreshList();
	},
	
	getItem: function(inSender, inIndex) {
		//if(debug) this.log("running setuprow index of "+inIndex);
		var row = this.hostsList[inIndex];
		
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
		//if(debug) this.log("hostSelected of: "+enyo.json.stringify(this.hostsList[inEvent.rowIndex]));
		//this.$.list.select(inEvent.rowIndex);		//only for virtuallist
		
		this.doHostSelected(this.hostsList[inEvent.rowIndex]);
		
		this.selectedRow = inEvent.rowIndex;
		this.refreshList();
	},
	removeItem: function(inSender, inEvent) {
		if(debug) this.log("removeItem of: "+enyo.json.stringify(this.hostsList[inEvent.rowIndex]));
		
		this.hostsList.splice(inEvent);
		
		this.refreshList();
		
		this.doSaveHosts();
	},
	
	doAddHostPopup: function() {
		this.$.hostnameInput.setValue("");
		this.$.portInput.setValue("");
		this.$.usernameInput.setValue("");
		this.$.passwordInput.setValue("");
		
		this.$.addPopup.openAtCenter();
	},
	doAddHost: function() {
		this.hostsList.push({hostname: this.$.hostnameInput.getValue(), port: this.$.portInput.getValue(), username: this.$.usernameInput.getValue(), password: this.$.passwordInput.getValue()});
		
		this.$.addPopup.close();
		
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
		//localStorage["KTorrentTouch.hosts"] = enyo.json.to(this.hostsList);
		enyo.setCookie("KTorrentTouch-hosts", enyo.json.to(this.hostsList));
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
		
		{name: "addPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{content: "Add a new torrent by URL", className: "popup-title"},
			{name: "urlInput", kind: "Input", hint: "Paste URL here", selection: true, },
			{name: "confirmRemove", kind: "Button", caption: "Add", flex: 1, onclick: "doAddTorrent"},
		]},
		{name: "errorPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{name: "errorPopupContent", content: "Error message", className: "popup-title"},
			{name: "errorPopupButton", kind: "Button", caption: "OK", flex: 1, onclick: "closeErrorPopup"},
		]},
		{name: "connectingPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{kind: "HFlexBox", components: [
				{kind: "Spacer"},
				{kind: "SpinnerLarge"},
				{kind: "Spacer"},
			]},
			{name: "connectingText", content: "Connecting...", style: "text-align: center;"},
		]},
		
		
		{name: "header", kind: "Toolbar", content: "Torrents", className: "header2", onclick: "revealTop"},
		/*{kind: "MenuButtonHeader", content: "Torrents", onclick: "revealTop"},*/
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			/*{kind: "RowGroup", caption: "Torrents", components: [*/
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					{name: "globalsDownData", content: ""},
				]},
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					{name: "globalsUpData", content: ""},
				]},
				{name: "list", kind: "VirtualRepeater", className: "torrentsList", onGetItem: "getItem", components: [
					{kind: "Divider"},
					{name: "torrentItem", kind: "Item", layoutKind: "HFlexLayout", onclick: "torrentselected", components: [
						{name: "fulltorrentname", className: "torrentname", flex: 1}
					]}
				]},
				{kind: "HFlexBox", align: "center", pack: "center", components: [
					{name: "updateSpinner", kind: "Spinner", className: "updateSpinner"},	
				]},
			/*]},*/
			{content: "&nbsp;"}
		]},
		{kind: "Toolbar", components: [
			{kind: "GrabButton"},
			{kind: "Spacer"},
			{ name: "addTorrentButton", caption: "Add Torrent", onclick: "doAddTorrentPopup"},
			{kind: "Spacer"},
			/*{ name: "addTorrentButton2", kind: "nouveau.MenuButton", icon: "images/13-plus@2x.png", className: "footerAddButton", onclick: "doAddTorrentPopup"},*/
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
		
		if(!debug) this.timer = setTimeout(enyo.bind(this, this.delayedGlobalsCall), 5000);
		
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
		this.$.torrentItem.applyStyle("border-top", Boolean(group) ? "none" : "1px solid silver;");
		this.$.torrentItem.applyStyle("border-bottom", "none;");
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
	doAddTorrentPopup: function() {
		this.$.urlInput.setValue("");
		this.$.addPopup.openAtCenter();
		this.$.urlInput.forceFocus();
	},
	doAddTorrent: function() {
		if(debug) this.log("trying to add: "+this.$.urlInput.getValue());
		
		this.$.addTorrentService.setUrl("http://"+this.hostname+":"+this.port+"/action?load_torrent="+this.$.urlInput.getValue());
		this.$.addTorrentService.call();
		
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
		
		{name: "header", kind: "Toolbar", content: "Torrent Details", className: "header2", onclick: "revealTop"},
		/*{kind: "MenuButtonHeader", content: "Torrent Details", onclick: "revealTop"},*/
		{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
			/*
			{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
				{content: "", flex: 1},
				{name: "name", className: "name"},
				{content: "", flex: 1},
			]},
			*/
			{kind: "RowGroup", caption: "Details", components: [
				{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
					{content: "", flex: 1},
					{name: "name", className: "name"},
					{content: "", flex: 1},
				]},
				//{name: "detailsDivider", kind: "Divider", caption: "Details"},
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
			//{kind: "RowGroup", caption: "Files", className: "filesGroup", components: [
				{name: "fileslist", kind: "VirtualRepeater", onGetItem: "getItem", components: [
					{kind: "Divider"},
					{kind: "Item", className: "filenames", layoutKind: "HFlexLayout", components: [
						{name: "filename", flex: 1, className: "value"},
						{name: "percentage", className: "label"},
					]}
				]},
				{content: "&nbsp"},
			//]}
		]},
		{name: "footer", kind: "Toolbar", components: [
			{kind: "GrabButton"},
			{kind: "Spacer"},
			{name: "startbutton", caption: "Start", onclick: "doStart"},
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
			this.$.item.applyStyle("border-top", "none;");
		} else {
			this.$.divider.canGenerate = false;
			this.$.item.applyStyle("border-top", "1px solid white;");
		}
		
		if(inIndex < (this.files.length-1)) {
			this.$.item.applyStyle("border-bottom", "1px solid silver;");
		} else {
			this.$.item.applyStyle("border-bottom", "none;");
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
			this.$.stopbutton.setShowing(false);
			this.$.removebutton.setShowing(true);
		} else if((this.torrentDetails.status == "")||(this.torrentDetails.status == "None")){
			this.$.startbutton.setShowing(false);
			this.$.stopbutton.setShowing(false);
			this.$.removebutton.setShowing(false);
			
			this.revealTop();
		} else {
			this.$.startbutton.setShowing(false);
			this.$.stopbutton.setShowing(true);
			this.$.removebutton.setShowing(true);
		}
		
		this.doFiles();
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



enyo.kind({ name: "kttPreferences",
	kind: "HFlexBox",
	flex: 1,
	style: "", 
	className: "kttPreferencesWrapper",
	events: {
		onDonePreferences: ""
	},
	
	components: [
		{flex: 0},
		
		{kind: "VFlexBox", width: "320px", flex: 1, components: [
			{name: "header", kind: "Toolbar", content: "Preferences", className: "header2", onclick: "revealTop"},
			/*{kind: "MenuButtonHeader", content: "Torrents", onclick: "revealTop"},*/
			{kind: "Scroller", autoHorizontal: false, horizontal: false, autoVertical: true, flex: 1, components: [
				{kind: "RowGroup", caption: "General", components: [
					
					{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
						{name: "asdf", className: "value"},
						{kind: "Spacer"},
						{content: "asdf", className: "label"}
					]},
				]},
				{content: "&nbsp;"}
			]},
			{kind: "Toolbar", components: [
				{name: "savepreferencesbutton", caption: "Save", onclick: "doSavePreferences"}
			]},
		]},
		
		{flex: 0},
	],
	
	
	gotBack: function() {
		if(debug) this.log("gotBack");
		
		this.doSavePreferences();
	},
	
	doSavePreferences: function() {
		if(debug) this.log("doSavePreferences");
		
		this.doDonePreferences();
	},
			
});