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
 
function defaultCookie() {

	//These values are initiated if not already set
	var newCookieObject = {
		hosts: [],							
		allowMetrix: true,
		refreshTime: 5
	};
	
	return newCookieObject;
};

var sort_by = function(field, reverse, primer){

   reverse = (reverse) ? -1 : 1;

   return function(a,b){

       a = a[field];
       b = b[field];

       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }

       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       return 0;

   }
};

var double_sort_by = function(field1, field2, reverse, primer){

   reverse = (reverse) ? -1 : 1;

   return function(a,b){

       a = a[field1]+"_"+a[field2];
       b = b[field1]+"_"+b[field2];

       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }

       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       
	   return 0;

   }
};

var triple_sort_by = function(field1, field2, field3, reverse, primer){

   reverse = (reverse) ? -1 : 1;

   return function(a,b){

       a = a[field1]+"_"+a[field2]+"_"+a[field3];
       b = b[field1]+"_"+b[field2]+"_"+b[field3];

       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }

       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       
	   return 0;

   }
};
