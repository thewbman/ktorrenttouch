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
 
function TorrentDetailsAssistant(torrentObject_in) {

	this.torrentObject = torrentObject_in;
	
	this.filesList = [];

}

TorrentDetailsAssistant.prototype.setup = function() {
	
	//App menu widget
	this.controller.setupWidget(Mojo.Menu.appMenu, KTorrentTouch.appMenuAttr, KTorrentTouch.appMenuModel);

	// Menu grouping at bottom of scene
    this.cmdMenuModel = { label: $L('Torrent Menu'),
                            items: [
								{label: $L('Start'), command:'do-startTorrent', width: 100},
								{},
								{label: $L('Stop'), command:'do-stopTorrent', width: 100},
								{},
								{label: $L('Remove'), command:'do-removeTorrent', width: 100},
							]};
 
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.cmdMenuModel);
	
	
	// files list
	this.filesListAttribs = {
		itemTemplate: "torrentDetails/filesListItem",
		//dividerTemplate: "torrents/torrentsDivider",
		swipeToDelete: false,
		//renderLimit: 10,
		//filterFunction: this.filterListFunction.bind(this),
		//dividerFunction: this.dividerFunction.bind(this),
		formatters:{myData: this.setMyData.bind(this)}
	};
    this.filesListModel = {            
        items: this.filesList,
		disabled: false
    };
	this.controller.setupWidget( "filesList" , this.filesListAttribs, this.filesListModel);
	

	//Event listeners
	//this.controller.listen(this.controller.get( "filesList" ), Mojo.Event.listTap, this.goFilesDetails.bind(this));
	this.controller.listen(this.controller.get( "header-menu" ), Mojo.Event.tap, function(){this.controller.sceneScroller.mojo.revealTop();}.bind(this));
	

};

TorrentDetailsAssistant.prototype.activate = function(event) {

	//$('debug-text').innerText = JSON.stringify(this.torrentObject);
	
	//Update menu
	this.updateCommandMenu();
	
	//try to get files
	this.getFiles();
	
	//File out data
	$('scene-title').innerText = this.torrentObject.name;
	//$('name-title').innerText = this.torrentObject.name;
	
	$('total_bytes-title').innerText = this.torrentObject.total_bytes;
	$('bytes_downloaded-title').innerText = this.torrentObject.bytes_downloaded;
	$('bytes_uploaded-title').innerText = this.torrentObject.bytes_uploaded;
	$('download_rate-title').innerText = this.torrentObject.download_rate;
	$('upload_rate-title').innerText = this.torrentObject.upload_rate;
	$('seeders-title').innerText = this.torrentObject.seeders;
	$('leechers-title').innerText = this.torrentObject.leechers;
	
};

TorrentDetailsAssistant.prototype.deactivate = function(event) {

};

TorrentDetailsAssistant.prototype.cleanup = function(event) {

};

TorrentDetailsAssistant.prototype.handleCommand = function(event) {

	if(event.type == Mojo.Event.forward) {
		//
		
	} else if(event.type == Mojo.Event.command) {
		switch(event.command) {  
			case 'do-startTorrent':
				this.startTorrent();
			  break;  
			  
			case 'do-stopTorrent':
				this.stopTorrent();
			  break;  
			  
			case 'do-removeTorrent':
				this.checkRemoveTorrent();
			  break;
			  
			default:
				//
			  break;
			  
		}
	}

};

TorrentDetailsAssistant.prototype.handleKey = function(event) {

	Mojo.Log.info("Torrent details handleKey %o, %o", event.originalEvent.metaKey, event.originalEvent.keyCode);
	
	Event.stop(event); 
	
};





TorrentDetailsAssistant.prototype.updateCommandMenu = function() {

	if((this.torrentObject.status == "Stopped")||(this.torrentObject.status == "Download completed")) {
		
		//this.cmdMenuModel.items[1].label = $L('Start');
		//this.cmdMenuModel.items[1].command = 'do-startTorrent';
		
		//this.controller.modelChanged(this.cmdMenuModel);
	}

};

TorrentDetailsAssistant.prototype.getFiles = function() {

	if(this.torrentObject.num_files == 0) {
		//Just a single file, don't try to get list
		
		this.filesList.clear();
		
		var singleObject = {};
		
		singleObject.path = this.torrentObject.name;
		singleObject.priority = "N/A";
		singleObject.percentage = this.torrentObject.percentage;
		singleObject.size = this.torrentObject.total_bytes;
		
		this.filesList.push(singleObject);
		
		this.controller.modelChanged(this.filesListModel);
		
	} else {
	
		Mojo.Log.info("Starting to get torrent files");

		var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/data/torrent/files.xml?torrent="+this.torrentObject.id;
			
		try {
			var request = new Ajax.Request(requestUrl,{
				method: 'get',
				evalJSON: false,
				onSuccess: this.torrentFilesSuccess.bind(this),
				onFailure: this.torrentFilesFail.bind(this)  
			});
		}
		catch(e) {
			Mojo.Log.error(e);
		}
	
	}

};

TorrentDetailsAssistant.prototype.torrentFilesFail = function() {

	Mojo.Log.error("Failed to get torrent files");

};

TorrentDetailsAssistant.prototype.torrentFilesSuccess = function(response) {

	Mojo.Log.info("Got torrent files");
	
	this.filesList.clear();
	
	
	var xmlstring = response.responseText.trim();
	var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
	
	var singleFileNodeArray, singleFileChildNode;
	var singleTorrentFile = {};
	
	
	
	//Start parsing
	try{
		this.filesList.clear();
		
		singleFileNodeArray = xmlobject.getElementsByTagName("file");
		
		Mojo.Log.info("Found "+singleFileNodeArray.length+" torrent file(s)");
		
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
			
			this.filesList.push(singleTorrentFile);
		
		}
		
		
	} catch(e){
	
		Mojo.Log.error(e)
	
	}
	
	
	Mojo.Log.info("Updated torrent files list: %j",this.filesList);
	this.controller.modelChanged(this.filesListModel);

};

TorrentDetailsAssistant.prototype.setMyData = function(propertyValue, model) {

	var filesDetailsText = "";
	
	filesDetailsText += '<div class="torrentDetails-list-item">';
	filesDetailsText += '<div class="palm-row-wrapper">';
	
	filesDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;&nbsp;&nbsp;'+''+'</div>';
	
	filesDetailsText += '<div class="palm-info-text truncating-text left torrentDetails-list-title">&nbsp;'+model.path+'</div>';
	
	filesDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;Size: '+model.size+'&nbsp;</div>';
	filesDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;Priority: '+model.priority+'&nbsp;</div>';
	filesDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;&nbsp;Percentage: '+model.percentage+'%</div>';
	filesDetailsText += '<div class="palm-info-text truncating-text left">&nbsp;&nbsp;&nbsp;&nbsp;'+''+'</div>';
	
	filesDetailsText += '</div>';
	filesDetailsText += '</div>';
		
	model.myData = filesDetailsText;

};

TorrentDetailsAssistant.prototype.startTorrent = function(event) {
	
	Mojo.Log.info("Start torrent");

	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/action?start="+this.torrentObject.id;
			
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.torrentStartSuccess.bind(this),
			onFailure: this.torrentActionFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}

};

TorrentDetailsAssistant.prototype.torrentStartSuccess = function(response) {

	Mojo.Log.info("Success start torrent: %j"+response);
	
	Mojo.Controller.stageController.popScene();

};

TorrentDetailsAssistant.prototype.stopTorrent = function(event) {
	
	Mojo.Log.info("Stop torrent");

	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/action?stop="+this.torrentObject.id;
			
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.torrentStopSuccess.bind(this),
			onFailure: this.torrentActionFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}

};

TorrentDetailsAssistant.prototype.torrentStopSuccess = function(response) {

	Mojo.Log.info("Success stop torrent: %j"+response);
	
	Mojo.Controller.stageController.popScene();

};

TorrentDetailsAssistant.prototype.checkRemoveTorrent = function() {

	Mojo.Log.info("Remove torrent");
	
	this.controller.showAlertDialog({
        onChoose: function(value) {
			switch(value) {
				case "yes":
					this.removeTorrent();
				  break;
				case "no":
					//
				  break;
			}	
		},
        title: "Remove Torrent?",
        message:  "Are you sure you want to remove this torrent?", 
		choices: [
			{ label: $L("Yes"), value: "yes", type: "affirmative"},
			{ label: $L("No"), value: "no", type: "negative"}
			],
		allowHTMLMessage: true
    });
	
}

TorrentDetailsAssistant.prototype.removeTorrent = function() {
	
	var requestUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port+"/action?remove="+this.torrentObject.id;
			
	try {
		var request = new Ajax.Request(requestUrl,{
			method: 'get',
			evalJSON: false,
			onSuccess: this.torrentRemoveSuccess.bind(this),
			onFailure: this.torrentActionFail.bind(this)  
		});
	}
	catch(e) {
		Mojo.Log.error(e);
	}

};

TorrentDetailsAssistant.prototype.torrentRemoveSuccess = function(response) {

	Mojo.Log.info("Success remove torrent: %j"+response);
	
	Mojo.Controller.stageController.popScene();

};

TorrentDetailsAssistant.prototype.torrentActionFail = function(event) {

	Mojo.Controller.errorDialog("Error sending command");

};
