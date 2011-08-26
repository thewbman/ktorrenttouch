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
 
 function PreferencesAssistant() {
 
}

PreferencesAssistant.prototype.setup = function() {

	//App menu widget
	this.controller.setupWidget(Mojo.Menu.appMenu, KTorrentTouch.appMenuAttr, KTorrentTouch.appMenuModel);
	
	//Metrix
	this.metrixToggleModel = {
             value: true
    };
	this.controller.setupWidget("metrixToggleId",
        {
            modelProperty: "value"
         },
         this.metrixToggleModel
    ); 
};

PreferencesAssistant.prototype.activate = function(event) {
	
	if (KTorrentTouch.cookieObject) {
		//Update settings from cookie
		this.metrixToggleModel.value = KTorrentTouch.cookieObject.allowMetrix;
		this.controller.modelChanged(this.metrixToggleModel);
	} 
	
};

PreferencesAssistant.prototype.deactivate = function(event) {

	KTorrentTouch.cookieObject.allowMetrix = this.metrixToggleModel.value;
	KTorrentTouch.cookie.put(KTorrentTouch.cookieObject);
	
};

PreferencesAssistant.prototype.cleanup = function(event) {

};
