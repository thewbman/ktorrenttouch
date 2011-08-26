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
 
 function HelpAssistant() {
 
}

HelpAssistant.prototype.setup = function() {

	//App menu widget
	this.controller.setupWidget(Mojo.Menu.appMenu, KTorrentTouch.appMenuAttr, KTorrentTouch.appMenuModel);
	
};

HelpAssistant.prototype.activate = function(event) {

};

HelpAssistant.prototype.deactivate = function(event) {

};

HelpAssistant.prototype.cleanup = function(event) {

};
