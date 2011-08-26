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
 
function AddHostAssistant() {

}

AddHostAssistant.prototype.setup = function() {

	//App menu widget
	this.controller.setupWidget(Mojo.Menu.appMenu, KTorrentTouch.appMenuAttr, KTorrentTouch.appMenuModel);
	
	
	//Widgets
	this.hostTextModel = {
             value: "",
             disabled: false
    };
	this.controller.setupWidget("hostTextFieldId",
        {
            hintText: $L(""),
            multiline: false,
            enterSubmits: false,
            focus: false,
			textCase: Mojo.Widget.steModeLowerCase
         },
         this.hostTextModel
    ); 
	
	this.portTextModel = {
             value: "",
             disabled: false
    };
	this.controller.setupWidget("portTextFieldId",
         {
            hintText: $L(""),
            multiline: false,
            enterSubmits: false,
            focus: false,
			textCase: Mojo.Widget.steModeLowerCase
         },
         this.portTextModel
    );
	
	this.usernameTextModel = {
             value: "",
             disabled: false
    };
	this.controller.setupWidget("usernameTextFieldId",
        {
            hintText: $L(""),
            multiline: false,
            enterSubmits: false,
            focus: false,
			textCase: Mojo.Widget.steModeLowerCase
         },
         this.usernameTextModel
    ); 
	
	this.passwordTextModel = {
             value: "",
             disabled: false
    };
	this.controller.setupWidget("passwordFieldId",
        {
            hintText: $L(""),
            multiline: false,
            enterSubmits: false,
            focus: false,
			textCase: Mojo.Widget.steModeLowerCase
         },
         this.passwordTextModel
    ); 
	
	
	this.controller.setupWidget("submitButtonId",
         {},
         {
             label : $L("Submit"),
             disabled: false
         }
     );
	
	
	Mojo.Event.listen(this.controller.get("submitButtonId"),Mojo.Event.tap, this.submitNewHost.bind(this));

};

AddHostAssistant.prototype.activate = function(event) {

};

AddHostAssistant.prototype.deactivate = function(event) {

};

AddHostAssistant.prototype.cleanup = function(event) {

};






AddHostAssistant.prototype.submitNewHost = function(event) {
	
	//Returns data to host selector scene
	var newHost = {
		'hostname': this.hostTextModel.value,
		'port': this.portTextModel.value,
		'username': this.usernameTextModel.value,
		'password': this.passwordTextModel.value
	};
	
	
	Mojo.Log.info("New hostname is %j", newHost);
	
	KTorrentTouch.cookieObject.hosts.push(newHost);
	KTorrentTouch.cookie.put(KTorrentTouch.cookieObject);
	
	
	//Return to main
	Mojo.Controller.stageController.popScene();

};

