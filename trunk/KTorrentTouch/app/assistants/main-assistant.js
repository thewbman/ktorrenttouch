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
 
function MainAssistant() {

	this.resultList = [];

}

MainAssistant.prototype.setup = function() {
		
	//App menu widget
	this.controller.setupWidget(Mojo.Menu.appMenu, KTorrentTouch.appMenuAttr, KTorrentTouch.appMenuModel);
	
	//Widgets
	this.commandMenuModel = {
		visible: true,
		items: [
			{ },
			{ label: $L("Add"), command: 'go-addHost', width: 90 } ,
			{ },
		]
	};
	
	//Bottom of page menu widget
	this.controller.setupWidget( Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.commandMenuModel );
	
	
	//List of hosts widget
	this.hostListAttribs = {
		itemTemplate: "main/hostListItem",
		swipeToDelete: true
	};
	
    this.hostListModel = {            
        items: this.resultList
    };
	this.controller.setupWidget( "hostlist" , this.hostListAttribs, this.hostListModel);
	
	
	
	//Event listeners
	this.controller.listen(this.controller.get( "hostlist" ), Mojo.Event.listTap, this.chooseList.bind(this));
	this.controller.listen(this.controller.get( "hostlist" ), Mojo.Event.listDelete, this.deleteHost.bind(this));
	
	
	//Use theme
	this.controller.document.body.className = 'palm-dark';
	this.controller.document.body.className += " device-"+Mojo.Environment.DeviceInfo.modelNameAscii;
	this.controller.document.body.className += " width-"+Mojo.Environment.DeviceInfo.screenWidth;
	this.controller.document.body.className += " height-"+Mojo.Environment.DeviceInfo.screenHeight;
	

	if (KTorrentTouch.cookieObject) {		//cookie exists
			
		//Do Metrix submission if allowed
		if (KTorrentTouch.cookieObject.allowMetrix == true) {
			Mojo.Log.info("Submitting data to Metrix");
			
			//Metrix command
			KTorrentTouch.Metrix.postDeviceData();
			
			//Metrix bulletin
			KTorrentTouch.Metrix.checkBulletinBoard(this.controller, 10);
			
		};
		
		var myDefaultCookie = defaultCookie();
		
		//Setup default settings if missing due to old cookie versions
		//asdf
		
		
	} else {		//for new installs
		KTorrentTouch.cookieObject = defaultCookie();
		KTorrentTouch.cookie.put(KTorrentTouch.cookieObject);
		
		this.openAbout();
		
	};
	
		

};

MainAssistant.prototype.activate = function(event) {

	//Populate list using cookie
	this.resultList.clear();
	Object.extend(this.resultList,KTorrentTouch.cookieObject.hosts);
	this.controller.modelChanged(this.hostListModel);
	

	//Keypress event
	Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keyup, this.handleKey.bind(this));

};

MainAssistant.prototype.deactivate = function(event) {
	
	KTorrentTouch.cookie.put(KTorrentTouch.cookieObject);

	//Keypress event
	Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keyup, this.handleKey.bind(this));

};

MainAssistant.prototype.cleanup = function(event) {

};

MainAssistant.prototype.handleCommand = function(event) {

	if(event.type == Mojo.Event.forward) {
		//
		
	} else if(event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'go-addHost':
				Mojo.Controller.stageController.pushScene("addHost");
			  break;
			  
			case 'go-searchHost':
				//Mojo.Controller.stageController.pushScene("searchHost");
				Mojo.Controller.errorDialog("Searching for hosts not yet supported");
			  break;
			  
			default:
				//
			  break;
			  
		}
	}
	
};

MainAssistant.prototype.handleKey = function(event) {

	Mojo.Log.info("Main handleKey %o, %o", event.originalEvent.metaKey, event.originalEvent.keyCode);
	
	Event.stop(event); 
};






MainAssistant.prototype.openAbout = function(event) {

	var aboutinfo = "KTorrentTouch is an app for controlling a KTorrent program.  You should already have a KTorrent program setup and running on your computer for this app to work.   The torrents are downloaded to the computer and not to this device.  ";
	
	aboutinfo += '<hr/><center><a href="http://code.google.com/p/ktorrenttouch/">App homepage</a></center>';  
			
	//aboutinfo += '<hr/><a href="http://ktorrent.org/">KTorrent homepage</a>';  
	
	//aboutinfo += "Licensed under <a href='http://www.gnu.org/licenses/gpl-2.0.html'>GPLv2</a>."
    this.controller.showAlertDialog({
        onChoose: function(value) {if (value==true) {
					Mojo.Controller.stageController.pushScene("help");
					}
				},
				title: Mojo.Controller.appInfo.title+" - v" + Mojo.Controller.appInfo.version,
                //message: "Copyright 2011, Wes Brown <br />" + aboutinfo,
                message: aboutinfo,
                choices: [
					{label: $L("OK"), value: false},
					{label: $L("Help"), value: true}
					],
                allowHTMLMessage: true
            });
	
};

MainAssistant.prototype.deleteHost = function(event) {
	
	var selectedHost = event.item.hostname;
	var hostId = event.item.id;
	
	
	Mojo.Log.info("Deleting host: %s",event.item.hostname);
	
	
	var newList = [];
	
	for(var i = 0; i < this.resultList.length; i++){
		
		if((this.resultList[i].hostname == selectedHost)&&(this.resultList[i].username == event.item.username)&&(this.resultList[i].password == event.item.password)) {
			//We want to delete this, don't use
		} else {
			newList.push(this.resultList[i]);
		}
	}
	
	
	//Update cookie
	KTorrentTouch.cookieObject.hosts.clear();
	Object.extend(KTorrentTouch.cookieObject.hosts,newList);
	
	KTorrentTouch.cookie.put(KTorrentTouch.cookieObject);

	
};

MainAssistant.prototype.chooseList = function(event) {

	Mojo.Log.info("Selected host: "+event.item.hostname);
	
	KTorrentTouch.currentHost = event.item;
	
	KTorrentTouch.currentUrl = "http://"+KTorrentTouch.currentHost.hostname+":"+KTorrentTouch.currentHost.port;
	
	Mojo.Controller.stageController.pushScene("torrents");
	
};


