/*
 *   KTorrent Touch - An open source webOS app for controlling KTorrent (http://ktorrent.org/). 
 *   http://code.google.com/p/ktorrenttouch/
 *   Copyright (C) 2011  Wes Brown
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
 
function TorrentsAssistant() {

	this.resultList = [];
	
	this.settings = {};
	this.globals = {};

}

TorrentsAssistant.prototype.setup = function() {
	
	//Show and start the animated spinner
	this.spinnerAttr= {
		spinnerSize: "large"
	}; this.spinnerModel= {
		spinning: true
	}; 
	this.controller.setupWidget('spinner', this.spinnerAttr, this.spinnerModel);
	$('spinner-text').innerHTML = $L("Loading")+"...";
	
	
	//App menu widget
	this.controller.setupWidget(Mojo.Menu.appMenu, KTorrentTouch.appMenuAttr, KTorrentTouch.appMenuModel);
	
	
	// Menu grouping at bottom of scene
    this.cmdMenuModel = { label: $L('Torrent Menu'),
                            items: [{},{label: $L('Add'), command:'go-addTorrent', width: 90},{}]};
 
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.cmdMenuModel);
	
	
	// torrents list
	this.torrentsListAttribs = {
		itemTemplate: "torrents/torrentsListItem",
		dividerTemplate: "torrents/torrentsDivider",
		swipeToDelete: false,
		renderLimit: 10,
		//filterFunction: this.filterListFunction.bind(this),
		dividerFunction: this.dividerFunction.bind(this),
		formatters:{myData: this.setMyData.bind(this)}
	};
    this.torrentsListModel = {            
        items: this.resultList,
		disabled: false
    };
	this.controller.setupWidget( "torrentsList" , this.torrentsListAttribs, this.torrentsListModel);
	

	//Event listeners
	this.controller.listen(this.controller.get( "torrentsList" ), Mojo.Event.listTap, this.goTorrentDetails.bind(this));
	this.controller.listen(this.controller.get( "header-menu" ), Mojo.Event.tap, function(){this.controller.sceneScroller.mojo.revealTop();}.bind(this));
	
	
};

TorrentsAssistant.prototype.activate = function(event) {

	Mojo.Event.listen(this.controller.stageController.document, "gesturestart", this.gestureStart.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.stageController.document, "gestureend", this.gestureEnd.bindAsEventListener(this));
	
	//try to login and get data
	this.getLogin();

};

TorrentsAssistant.prototype.deactivate = function(event) {
	
	Mojo.Event.stopListening(this.controller.stageController.document, "gesturestart", this.gestureStart.bind(this));
	Mojo.Event.stopListening(this.controller.stageController.document, "gestureend", this.gestureStart.bind(this));
	
	clearTimeout(this.timer);

};

TorrentsAssistant.prototype.cleanup = function(event) {

};

TorrentsAssistant.prototype.handleCommand = function(event) {

	if(event.type == Mojo.Event.forward) {
		//
		
	} else if(event.type == Mojo.Event.command) {
		switch(event.command) {  
			case 'go-addTorrent':
				//Mojo.Controller.errorDialog("Adding new torrents is not yet supported");
				this.addNew();
			  break;
			  
			default:
				//
			  break;
			  
		}
	}

};

TorrentsAssistant.prototype.handleKey = function(event) {

	Mojo.Log.info("Torrents handleKey %o, %o", event.originalEvent.metaKey, event.originalEvent.keyCode);
	
	Event.stop(event); 
	
};

TorrentsAssistant.prototype.gestureStart = function(event) {
	
	this.gestureStartY = event.centerY;

};

TorrentsAssistant.prototype.gestureEnd = function(event) {

	this.gestureEndY = event.centerY;
	this.gestureDistance = this.gestureEndY - this.gestureStartY;
	
	if(this.gestureDistance>0) {
		this.controller.getSceneScroller().mojo.revealTop();
	} else if(this.gestureDistance<0) {
		this.controller.getSceneScroller().mojo.revealBottom();
	}

};








TorrentsAssistant.prototype.getLogin = function(event) {

	Mojo.Log.info("Trying to get login page");
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/login.html";
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.loginPageSuccess.bind(this),
			onFailure: this.loginPageFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}	
	
};

TorrentsAssistant.prototype.loginPageFail = function() {

	Mojo.Log.error("Failed to get login page");
	$('spinner-text').innerHTML = $L("Failed to get login page")+"...";

};

TorrentsAssistant.prototype.loginPageSuccess = function(response) {

	Mojo.Log.info("Got login page");
	$('spinner-text').innerHTML = $L("Got login page, now getting challenge")+"...";
	
	this.loginPage = response.responseText.trim();
	
	var htmlobject = (new DOMParser()).parseFromString(response.responseText.trim(), "text/xml");
	var formItem = htmlobject.getElementsByTagName("form")[0];
		
	this.formJson = JSON.parse(dojo.formToJson(formItem));
		
	Mojo.Log.info("Form JSON: %j",this.formJson);
	
	
	this.getChallenge();

};

TorrentsAssistant.prototype.getChallenge = function(event) {

	Mojo.Log.info("Trying to get challenge");
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/login/challenge.xml";
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.challengePageSuccess.bind(this),
			onFailure: this.challengePageFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}	
	
};

TorrentsAssistant.prototype.challengePageFail = function() {

	Mojo.Log.error("Failed to get challenge");
	$('spinner-text').innerHTML = $L("Failed to get challenge");

};

TorrentsAssistant.prototype.challengePageSuccess = function(response) {

	Mojo.Log.info("Got challenge: "+response.responseText.trim());
	$('spinner-text').innerHTML = $L("Got challenge, now sending credentials")+"...";
	
	this.challengePage = response.responseText.trim();
	
	var xmlstring = response.responseText.trim();
	var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
	
	//Local variables
	var challengeNode;
	
	//Start parsing
	challengeNode = xmlobject.getElementsByTagName("challenge")[0];
	
	this.challengeText = challengeNode.childNodes[0].nodeValue;
	//this.challengeText = "vOcA6avNfTrDkN4nYRDt";
	
	this.doLogin();

};

TorrentsAssistant.prototype.doLogin = function() {

	Mojo.Log.info("Attempting to login");
	
	this.formJson.Login = "Sign+in";
	this.formJson.username = KTorrentTouch.currentHost.username;
	//this.formJson.password = KTorrentTouch.currentHost.password;
	
	this.formJson.password = "";
	this.formJson.challenge = hex_sha1(this.challengeText + KTorrentTouch.currentHost.password);
	
	//challenge = "vOcA6avNfTrDkN4nYRDt"
	//becomes "3ea5c13b4c0625409d0227a46be631c132fa7d50" 
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/login?page=interface.html";
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'POST',
			parameters: this.formJson,
			evalJSON: false,
			onSuccess: this.loginSuccess.bind(this),
			onFailure: this.loginFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}

}

TorrentsAssistant.prototype.loginFail = function() {

	Mojo.Log.error("Login failed");
	$('spinner-text').innerHTML = $L("Login failed");

};

TorrentsAssistant.prototype.loginSuccess = function(response) {

	Mojo.Log.info("Success login %j",response);
	$('spinner-text').innerHTML = $L("Login success");
	
	//$('debug-text').innerHTML = response.responseText.trim();
	
	this.getSettings();

}

TorrentsAssistant.prototype.getSettings = function(event) {

	Mojo.Log.info("Trying to get settings");
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/data/settings.xml";
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.settingsPageSuccess.bind(this),
			onFailure: this.settingsPageFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}	
	
};

TorrentsAssistant.prototype.settingsPageFail = function() {

	Mojo.Log.error("Failed to get settings");
	$('spinner-text').innerHTML = $L("Failed to get settings");

};

TorrentsAssistant.prototype.settingsPageSuccess = function(response) {

	Mojo.Log.info("Got settings: "+response.responseText.trim());
	$('spinner-text').innerHTML = $L("Got settings")+"...";
	
	var xmlstring = response.responseText.trim();
	var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
	
	//Start parsing
	try{
		this.settings.maxDownloads = xmlobject.getElementsByTagName("maxDownloads")[0].childNodes[0].nodeName;
		this.settings.maxSeeds = xmlobject.getElementsByTagName("maxSeeds")[0].childNodes[0].nodeName;
		//add more as needed
		
	} catch(e) {
		Mojo.Log.error(e);
	}
	
	Mojo.Log.info("Settings are %j",this.settings);
	
	this.getGlobals();

};

TorrentsAssistant.prototype.getGlobals = function() {
	
	Mojo.Log.info("Trying to get global variables");
	
	//Reshow spinner and hide
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	$('spinner-text').innerHTML = $L("Refreshing data")+"...";
	$('myScrim').show();
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/data/global.xml";
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.globalsSuccess.bind(this),
			onFailure: this.globalsFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}

}

TorrentsAssistant.prototype.globalsFail = function() {

	Mojo.Log.error("Failed to get globals");
	$('spinner-text').innerHTML = $L("Failed to get global status<br>Try exiting and logging back in");

};

TorrentsAssistant.prototype.globalsSuccess = function(response) {

	Mojo.Log.info("Got globals: "+response.responseText.trim());
	//$('spinner-text').innerHTML = $L("Got globals")+"...";
	
	
	var xmlstring = response.responseText.trim();
	var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
	
	
	//Start parsing
	try{
		this.globals.transferred_down = xmlobject.getElementsByTagName("transferred_down")[0].childNodes[0].nodeValue;
		this.globals.transferred_up = xmlobject.getElementsByTagName("transferred_up")[0].childNodes[0].nodeValue;
		
		this.globals.speed_down = xmlobject.getElementsByTagName("speed_down")[0].childNodes[0].nodeValue;
		this.globals.speed_up = xmlobject.getElementsByTagName("speed_up")[0].childNodes[0].nodeValue;
		
		this.globals.dht = xmlobject.getElementsByTagName("dht")[0].childNodes[0].nodeValue;
		this.globals.encryption = xmlobject.getElementsByTagName("encryption")[0].childNodes[0].nodeValue;
		
	} catch(e){
	
		Mojo.Log.error(e)
	
	}
	
	Mojo.Log.info("Updated globals: %j",this.globals);
	
	
	$("scene-title").innerHTML = "Torrents ("+this.globals.speed_down+" down, "+this.globals.speed_up+" up)";
	
	this.getTorrents();

};

TorrentsAssistant.prototype.getTorrents = function() {

	Mojo.Log.info("Starting to get torrents");

	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/data/torrents.xml";
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.torrentsSuccess.bind(this),
			onFailure: this.torrentsFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}

}

TorrentsAssistant.prototype.torrentsFail = function() {

	Mojo.Log.error("Failed to get torrents");
	$('spinner-text').innerHTML = $L("Failed to get torrents");

};

TorrentsAssistant.prototype.torrentsSuccess = function(response) {

	Mojo.Log.info("Got torrents");
	//$('spinner-text').innerHTML = $L("Got torrents")+"...";
	
	
	var xmlstring = response.responseText.trim();
	var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
	
	var singleTorrentNodeArray, singleTorrentChildNode;
	var singleTorrentJson = {};
	
	
	
	//Start parsing
	try{
		this.resultList.clear();
		
		singleTorrentNodeArray = xmlobject.getElementsByTagName("torrent");
		
		Mojo.Log.info("Found "+singleTorrentNodeArray.length+" torrent(s)");
		
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
			
			this.resultList.push(singleTorrentJson);
		
		}
		
		
	} catch(e){
	
		Mojo.Log.error(e)
	
	}
	
	this.resultList.sort(double_sort_by('status', 'name', false));
	
	Mojo.Log.info("Updated torrents list: %j",this.resultList);
	this.controller.modelChanged(this.torrentsListModel);
	
	
	//Stop spinner and hide
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	$('myScrim').hide();
	
	//loop from here every 15 seconds
	this.timer = setTimeout(this.getGlobals.bind(this), parseInt(KTorrentTouch.cookieObject.refreshTime)*1000);

};



TorrentsAssistant.prototype.addNew = function() {

	Mojo.Log.info("Attempting to add new torrent");
	
	this.controller.showDialog({
		template: 'dialogs/addTorrentDialog',
		assistant: new AddTorrentDialogAssistant(this, this.addTorrentCallback.bind(this))
	});

}

TorrentsAssistant.prototype.addTorrentCallback = function(value) {

	Mojo.Log.info("Adding: "+value);
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/action?load_torrent="+value;
		
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.addTorrentSuccess.bind(this),
			onFailure: this.addTorrentFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}	

}

TorrentsAssistant.prototype.addTorrentFail = function() {

	Mojo.Log.error("Adding new torrent failed");
	Mojo.Controller.getAppController().showBanner("Failed to add torrent", {source: 'notification'});	

};

TorrentsAssistant.prototype.addTorrentSuccess = function(response) {

	Mojo.Log.info("Success add torrent %j",response);
	Mojo.Controller.getAppController().showBanner("Successfully added", {source: 'notification'});	

}






TorrentsAssistant.prototype.dividerFunction = function(itemModel) {
	
	var divider = itemModel.status;
	
	return divider;

};

TorrentsAssistant.prototype.setMyData = function(propertyValue, model) {
	
	var torrentDetailsText = "";
	
	torrentDetailsText += '<div class="torrents-list-item">';
	torrentDetailsText += '<div class="palm-row-wrapper">';
	torrentDetailsText += '<div class="title truncating-text left torrents-list-title">&nbsp;'+model.name+'</div>';
	
	torrentDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;'+model.bytes_downloaded+' of '+model.total_bytes+' downloaded ('+parseInt(model.percentage)+'%)&nbsp;</div>';
	torrentDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;Downloading: '+model.download_rate+'&nbsp;</div>';
	torrentDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;&nbsp;Uploading: '+model.upload_rate+'</div>';
	torrentDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;&nbsp;&nbsp;Seeders: '+model.seeders+'&nbsp;&nbsp;Leechers: '+model.leechers+'</div>';
	
	
	torrentDetailsText += '</div>';
	torrentDetailsText += '</div>';
		
	model.myData = torrentDetailsText;

};

TorrentsAssistant.prototype.goTorrentDetails = function(event) {

	Mojo.Log.info("Selected item %j",event.item);
	
	Mojo.Controller.stageController.pushScene("torrentDetails", event.item);
	
};









/*
	Small controller class used for the adding new torrent.
*/

var AddTorrentDialogAssistant = Class.create({
	
	
	initialize: function(sceneAssistant, callbackFunc) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
		
		this.callbackFunc = callbackFunc;
	},
	
	setup : function(widget) {
	
		this.widget = widget;
		

		this.addTextModel = {
				 value: "",
				 disabled: false
		};
		this.controller.setupWidget("addTextFieldId",
			{
				hintText: $L("URL"),
				multiline: true,
				enterSubmits: true,
				focus: true,
				textCase: Mojo.Widget.steModeLowerCase
			 },
			 this.addTextModel
		); 
		
		
		//Button
		Mojo.Event.listen(this.controller.get('goAddButton'),Mojo.Event.tap,this.addButton.bind(this));

		$('addButtonWrapper').innerText = $L('Add');
		
		if (PalmSystem && PalmSystem.paste) {
			//$("addTextFieldId").mojo.focus();
			PalmSystem.paste();
		}
		
	},
	
	addButton: function() {
	
		this.callbackFunc(this.addTextModel.value);

		this.widget.mojo.close();
	}
	
	
});

