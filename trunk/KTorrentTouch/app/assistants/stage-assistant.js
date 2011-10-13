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
 
function StageAssistant() {

}


KTorrentTouch = {};

/********************Globals**************************/
//Setup App Menu
KTorrentTouch.appMenuAttr = {omitDefaultItems: true};
KTorrentTouch.appMenuModel = {
	visible: true,
	items: [
		{label: $L("About"), command: 'do-aboutApp'},
		{label: $L("Preferences"), command: 'do-prefsApp'},
		{label: $L("Open in browser"), command: 'do-openBrowser'},
		{label: $L("Help"), items: [
			{label: $L("Help"), command: 'do-openHelp'},
			{label: $L("Leave review"), command: 'do-leaveReview'},
			{label: $L("Email developer"), command: 'do-emailDeveloper'},
			]
		}
	]
};


KTorrentTouch.currentUrl = "http://www.google.com/";


//Cookie for hosts/prefs
KTorrentTouch.cookie = new Mojo.Model.Cookie('ktorrent');
KTorrentTouch.cookieObject = KTorrentTouch.cookie.get();




StageAssistant.prototype.setup = function() {

	//Instantiate Metrix Library
	KTorrentTouch.Metrix = new Metrix(); 
	
	//Start first scene
	this.controller.pushScene("main");
	this.controller.setWindowOrientation("up");

};



StageAssistant.prototype.handleCommand = function(event) {
  var currentScene = this.controller.activeScene();
  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'do-aboutApp':
        
			var aboutinfo = "KTorrentTouch is an app for controlling a KTorrent program.  You should already have a KTorrent program setup and running on your computer for this app to work.   The torrents are downloaded to the computer and not to this device.  ";
			
			aboutinfo += '<hr/><center><a href="http://code.google.com/p/ktorrenttouch/">App homepage</a></center>';  
			
			//aboutinfo += '<hr/><a href="http://ktorrent.org/">KTorrent homepage</a>';  
			
			//aboutinfo += "Licensed under <a href='http://www.gnu.org/licenses/gpl-2.0.html'>GPLv2</a>."

            currentScene.showAlertDialog({
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

       break;
	   
	  case 'do-prefsApp':
			Mojo.Controller.stageController.pushScene("preferences");
       break;
	   
	  case 'do-openBrowser':
			window.open(KTorrentTouch.currentUrl);
		break;
	   
	  case 'do-openHelp':
			Mojo.Controller.stageController.pushScene("help");
       break;
	   
	  case 'do-leaveReview':
			currentScene.serviceRequest("palm://com.palm.applicationManager", {
				method: "open",
				parameters:  {
					id: 'com.palm.app.findapps',
					params: {
						scene: 'page',
						target: "http://developer.palm.com/appredirect/?packageid=com.thewbman.ktorrenttouch"
					}
				}
			});
       break;
	   
	  case 'do-emailDeveloper':
			currentScene.serviceRequest(
				"palm://com.palm.applicationManager", {
					method: 'open',
                    parameters: {
						id: "com.palm.app.email",
                        params: {
							summary: "Help with "+Mojo.Controller.appInfo.title+" v"+ Mojo.Controller.appInfo.version,
                            recipients: [{
								type:"email",
                                value:"webmyth.help@gmail.com",
                                contactDisplay:"KTorrentTouch Developer"
                            }]
                        }
                    }
                 }
             );
       break;
	   

    }
  }
};

