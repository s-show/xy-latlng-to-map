(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))l(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&l(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function l(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();const O=[["EPSG:4301","+proj=longlat +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +no_defs +type=crs"],["EPSG:4612","+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs"],["EPSG:6668","+proj=longlat +ellps=GRS80 +no_defs +type=crs"],["EPSG:30161","+proj=tmerc +lat_0=33 +lon_0=129.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30162","+proj=tmerc +lat_0=33 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30163","+proj=tmerc +lat_0=36 +lon_0=132.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30164","+proj=tmerc +lat_0=33 +lon_0=133.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30165","+proj=tmerc +lat_0=36 +lon_0=134.333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30166","+proj=tmerc +lat_0=36 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30167","+proj=tmerc +lat_0=36 +lon_0=137.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30168","+proj=tmerc +lat_0=36 +lon_0=138.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30169","+proj=tmerc +lat_0=36 +lon_0=139.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30170","+proj=tmerc +lat_0=40 +lon_0=140.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30171","+proj=tmerc +lat_0=44 +lon_0=140.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30172","+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30173","+proj=tmerc +lat_0=44 +lon_0=144.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30174","+proj=tmerc +lat_0=26 +lon_0=142 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30175","+proj=tmerc +lat_0=26 +lon_0=127.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30176","+proj=tmerc +lat_0=26 +lon_0=124 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30177","+proj=tmerc +lat_0=26 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30178","+proj=tmerc +lat_0=20 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:30179","+proj=tmerc +lat_0=26 +lon_0=154 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:2443","+proj=tmerc +lat_0=33 +lon_0=129.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2444","+proj=tmerc +lat_0=33 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2445","+proj=tmerc +lat_0=36 +lon_0=132.1666666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2446","+proj=tmerc +lat_0=33 +lon_0=133.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2447","+proj=tmerc +lat_0=36 +lon_0=134.3333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2448","+proj=tmerc +lat_0=36 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2449","+proj=tmerc +lat_0=36 +lon_0=137.1666666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2450","+proj=tmerc +lat_0=36 +lon_0=138.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2451","+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2452","+proj=tmerc +lat_0=40 +lon_0=140.8333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2453","+proj=tmerc +lat_0=44 +lon_0=140.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2454","+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2455","+proj=tmerc +lat_0=44 +lon_0=144.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2456","+proj=tmerc +lat_0=26 +lon_0=142 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2457","+proj=tmerc +lat_0=26 +lon_0=127.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2458","+proj=tmerc +lat_0=26 +lon_0=124 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2459","+proj=tmerc +lat_0=26 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2460","+proj=tmerc +lat_0=20 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:2461","+proj=tmerc +lat_0=26 +lon_0=154 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],["EPSG:6669","+proj=tmerc +lat_0=33 +lon_0=129.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6670","+proj=tmerc +lat_0=33 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6671","+proj=tmerc +lat_0=36 +lon_0=132.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6672","+proj=tmerc +lat_0=33 +lon_0=133.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6673","+proj=tmerc +lat_0=36 +lon_0=134.333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6674","+proj=tmerc +lat_0=36 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6675","+proj=tmerc +lat_0=36 +lon_0=137.166666666667 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6676","+proj=tmerc +lat_0=36 +lon_0=138.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6677","+proj=tmerc +lat_0=36 +lon_0=139.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6678","+proj=tmerc +lat_0=40 +lon_0=140.833333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6679","+proj=tmerc +lat_0=44 +lon_0=140.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6680","+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6681","+proj=tmerc +lat_0=44 +lon_0=144.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6682","+proj=tmerc +lat_0=26 +lon_0=142 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6683","+proj=tmerc +lat_0=26 +lon_0=127.5 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6684","+proj=tmerc +lat_0=26 +lon_0=124 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6685","+proj=tmerc +lat_0=26 +lon_0=131 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6686","+proj=tmerc +lat_0=20 +lon_0=136 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],["EPSG:6687","+proj=tmerc +lat_0=26 +lon_0=154 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"]],f={TOKYO:["EPSG:4301","EPSG:30161","EPSG:30162","EPSG:30163","EPSG:30164","EPSG:30165","EPSG:30166","EPSG:30167","EPSG:30168","EPSG:30169","EPSG:30170","EPSG:30171","EPSG:30172","EPSG:30173","EPSG:30174","EPSG:30175","EPSG:30176","EPSG:30177","EPSG:30178","EPSG:30179"],JGD2000:["EPSG:4612","EPSG:2443","EPSG:2444","EPSG:2445","EPSG:2446","EPSG:2447","EPSG:2448","EPSG:2449","EPSG:2450","EPSG:2451","EPSG:2452","EPSG:2453","EPSG:2454","EPSG:2455","EPSG:2456","EPSG:2457","EPSG:2458","EPSG:2459","EPSG:2460","EPSG:2461"],JGD2011:["EPSG:6668","EPSG:6669","EPSG:6670","EPSG:6671","EPSG:6672","EPSG:6673","EPSG:6674","EPSG:6675","EPSG:6676","EPSG:6677","EPSG:6678","EPSG:6679","EPSG:6680","EPSG:6681","EPSG:6682","EPSG:6683","EPSG:6684","EPSG:6685","EPSG:6686","EPSG:6687"]},A=""+new URL("GitHub_Logo-8fe8e40d.png",import.meta.url).href,U=""+new URL("bluePinMarker-6f73d850.png",import.meta.url).href,J=""+new URL("greenPinMarker-1029f695.png",import.meta.url).href,W=""+new URL("redPinMarker-54449ece.png",import.meta.url).href,q=""+new URL("yellowPinMarker-b4a4c361.png",import.meta.url).href,g=e=>new URL(Object.assign({"../assets/GitHub_Logo.png":A,"../assets/bluePinMarker.png":U,"../assets/greenPinMarker.png":J,"../assets/redPinMarker.png":W,"../assets/yellowPinMarker.png":q})[`../assets/${e}.png`],self.location).href,G=L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",{minZoom:5,maxZoom:18,attribution:"<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"}),F=L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",{minZoom:5,maxZoom:18,attribution:"<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"}),H=L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",{minZoom:14,maxZoom:18,attribution:"<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"}),V=L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg",{minZoom:10,maxZoom:18,attribution:"<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"}),K=L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png",{minZoom:10,maxZoom:18,attribution:"<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"}),Y={"地理院地図 (標準地図)":G,"地理院地図 (淡色地図)":F,"地理院地図 (航空写真)":H,"地理院地図 (航空写真・1974-78年)":V,"地理院地図 (航空写真・1961-69年)":K},X=L.icon({iconUrl:g("redPinMarker"),iconSize:[30,30],iconAnchor:[15,30]}),$=L.icon({iconUrl:g("bluePinMarker"),iconSize:[30,30],iconAnchor:[15,30]}),Q=L.icon({iconUrl:g("yellowPinMarker"),iconSize:[30,30],iconAnchor:[15,30]}),ee=L.icon({iconUrl:g("greenPinMarker"),iconSize:[30,30],iconAnchor:[15,30]}),_={red:X,blue:$,yellow:Q,green:ee};function y(e){return e==""||isNaN(Number(e))?!1:Number(e)!=0}function S(e){return e=e.replace("‐","-"),e=e.replace("－","-"),e=e.replace("ー","-"),e=e.replace("―","-"),e=e.replace("´","'"),e=e.replace("′","'"),e=e.replace("゛",'"'),e=e.replace("″",'"'),e=e.replace("　"," "),String(e).replace(/[！-～―]/g,function(t){return String.fromCharCode(t.charCodeAt(0)-65248)})}const P=(e,t,n,l,o)=>(o=o.replace(",",""),y(S(o))?S(o):""),k=(e,t,n,l)=>{let o=[];return n!=null&&e.options.allowDeleteRow==!0&&(o.push({title:e.options.text.deleteSelectedRows,onclick:function(){e.deleteRow(e.getSelectedRows().length?void 0:parseInt(n))}}),o.push({title:e.options.text.copy,shortcut:"Ctrl + C",onclick:function(){e.copy()}})),o.push({type:"line"}),o},h=(e,t,n,l,o)=>{if(e.jspreadsheet.colgroup.length==2)return!1},v=(e,t,n,l,o)=>{if(e.jspreadsheet.colgroup.length==2)return!1},b={deleteSelectedRows:"選択した行を削除",copy:"表の値をコピー"},w=[[110.1,51.1],[120.2,52.2],[130.3,53.3]],x=[{type:"numeric",title:"X(緯度)",width:180,name:"x_latitude"},{type:"numeric",title:"Y(経度)",width:180,name:"y_longitude"}],te=jspreadsheet(document.getElementById("sourceDataTable"),{data:w,columns:x,onbeforechange:P,contextMenu:k,onbeforedeletecolumn:h,onbeforeinsertcolumn:v,text:b,freezeColumns:2}),j=jspreadsheet(document.getElementById("convertedDataTable"),{data:w,columns:x,onbeforechange:P,contextMenu:k,onbeforedeletecolumn:h,onbeforeinsertcolumn:v,text:b,freezeColumns:2}),oe=e=>e[0].map((t,n)=>e.map(l=>l[n])),a=te,ne=j;let r=L.map("map",{renderer:L.canvas(),preferCanvas:!0}).setView([35.6580992222,139.7413574722],15);L.control.layers(Y).addTo(r);G.addTo(r);proj4.defs(O);const D=["sourceDataType","sourceGeodeticSystem","convertToDataType","convertToGeodeticSystem"];document.getElementsByName("sourceDataType").forEach(e=>{e.addEventListener("input",t=>{const n=document.getElementById("sourceZoneNo");t.target.value==="BL"?(n.options[0].selected=!0,n.disabled=!0):(n.disabled=!1,n.options[1].selected=!0,n.options[0].disabled=!0)})});document.getElementsByName("convertToDataType").forEach(e=>{e.addEventListener("input",t=>{const n=document.getElementById("convertZoneNo");t.target.value==="BL"?(n.options[0].selected=!0,n.disabled=!0):(n.disabled=!1,n.options[1].selected=!0,n.options[0].disabled=!0),console.debug(t.target.value)})});document.getElementById("openGeodeticSystemDialog").addEventListener("click",()=>{const e=document.getElementById("geodeticSystem");e.showModal(),e.addEventListener("click",t=>{t.target.id==="geodeticSystem"&&e.close()})});document.getElementById("closeGeodeticSystemDialog").addEventListener("click",()=>{document.getElementById("geodeticSystem").close()});document.getElementById("openZoneNoDialog").addEventListener("click",()=>{const e=document.getElementById("zoneNoDialog");e.showModal(),e.addEventListener("click",t=>{t.target.id==="zoneNoDialog"&&e.close()})});document.getElementById("closeZoneNoDialog").addEventListener("click",()=>{document.getElementById("zoneNoDialog").close()});document.getElementById("openConsiderationsDialog").addEventListener("click",()=>{const e=document.getElementById("considerationsDialog");e.showModal(),e.addEventListener("click",t=>{t.target.id==="considerationsDialog"&&e.close()})});document.getElementById("closeConsiderationsDialog").addEventListener("click",()=>{document.getElementById("considerationsDialog").close()});document.getElementById("dataConvertBtn").addEventListener("click",e=>{const t=B(),n=R(t.sourceGeodeticSystem,t.convertToGeodeticSystem,t.sourceZoneNo,t.convertZoneNo),l=I(a.getJson(!1)),o=M(n,l);j.setData(JSON.stringify(o)),e.preventDefault()});document.getElementById("clearSourceDataTableBtn").addEventListener("click",e=>{const t=[[,]];a.setData(t),e.preventDefault()});document.getElementById("clearConvertedDataTableBtn").addEventListener("click",e=>{const t=[[,]];ne.setData(t),e.preventDefault()});window.addEventListener("beforeprint",e=>{N()});window.addEventListener("afterprint",e=>{T()});document.getElementById("addMarkerBtn").addEventListener("click",e=>{if(a.getData(!1).length>1){const t=document.getElementById("selectMarkerIcon"),n=document.getElementById("selectLineColor"),l=B(),o=R(l.sourceGeodeticSystem,"JGD2011",l.sourceZoneNo,"0"),s=I(a.getJson(!1)),c=M(o,s);let d="";switch(t.value){case"redPinMarker":d=_.red;break;case"bluePinMarker":d=_.blue;break;case"yellowPinMarker":d=_.yellow;break;default:d=_.green;break}c.forEach(m=>{try{L.marker([Number(m[0]),Number(m[1])],{icon:d}).addTo(r).on("click",i=>{i.target.remove()})}catch(i){E(i)}try{n.value!="no"&&L.polyline(c,{color:n.value}).addTo(r).on("click",i=>{i.target.remove()})}catch(i){E(i)}});let p=[];c.forEach(m=>{let i=[m[0],m[1]];p.push(i)});let u=oe(p);const C=L.latLng([Math.min(...u[0]),Math.min(...u[1])]),z=L.latLng([Math.max(...u[0]),Math.max(...u[1])]),Z=L.latLngBounds(C,z);r.fitBounds(Z)}e.preventDefault()});document.getElementById("removeMarkerBtn").addEventListener("click",e=>{r.eachLayer(t=>{t._icon!=null&&r.removeLayer(t),t._bounds!=null&&r.removeLayer(t),t._mRadius!=null&&r.removeLayer(t)}),r.eachLayer(t=>console.log(t)),e.preventDefault()});document.getElementById("printPreviewBtn").addEventListener("input",e=>{e.target.checked?N():T()});document.getElementById("zoomRange").addEventListener("input",e=>{document.getElementById("map").style.transform="scale("+e.target.value+")",document.getElementById("zoomRangeValue").value=e.target.value+"x"});function B(){const e=document.getElementsByName("sourceDataType"),t=document.getElementsByName("convertToDataType"),n=document.getElementsByName("sourceGeodeticSystem"),l=document.getElementsByName("convertToGeodeticSystem");let o={};return e.forEach(s=>{s.checked&&(o.sourceDataType=s.value)}),t.forEach(s=>{s.checked&&(o.convertToDataType=s.value)}),n.forEach(s=>{s.checked&&(o.sourceGeodeticSystem=s.value)}),l.forEach(s=>{s.checked&&(o.convertToGeodeticSystem=s.value)}),o.sourceZoneNo=document.getElementById("sourceZoneNo").value,o.convertZoneNo=document.getElementById("convertZoneNo").value,o}function R(e,t,n,l){let o={};return o.fromProjection=f[e][n],o.toProjection=f[t][l],o}function I(e){let t=[];return e.forEach(n=>{y(n.x_latitude)&&y(n.y_longitude)&&t.push(n)}),t}function M(e,t){let n=[];return t.forEach(l=>{try{let o=proj4(e.fromProjection,e.toProjection,[Number(l.y_longitude),Number(l.x_latitude)]);n.push([o[1],o[0]])}catch(o){E(o)}}),n}function N(){a.setWidth(0,110),a.setWidth(1,110),a.hideIndex(),document.querySelectorAll(".d-print-none").forEach(t=>{t.classList.add("d-none")}),D.forEach(t=>{document.getElementsByName(t).forEach(n=>{n.checked||n.parentElement.classList.add("d-none")})})}function T(){a.setWidth(0,180),a.setWidth(1,180),a.showIndex(),document.querySelectorAll(".d-print-none").forEach(t=>{t.classList.remove("d-none")}),D.forEach(t=>{document.getElementsByName(t).forEach(n=>{n.checked||n.parentElement.classList.remove("d-none")})})}r.addEventListener("click",e=>{const t=document.getElementById("inputDiameter");t.showModal(),document.getElementById("radius").select(),document.getElementById("latitude").value=e.latlng.lat,document.getElementById("longitude").value=e.latlng.lng,t.addEventListener("click",n=>{n.target.id==="inputDiameter"&&t.close()})});document.getElementById("addCircleToMap").addEventListener("click",e=>{let t=document.getElementById("latitude").value,n=document.getElementById("longitude").value,l=document.getElementById("selectLineColor"),o="red";l.value!="no"&&(o=l.value);let s=document.getElementById("radius"),c=0;Number(s.value)>=0&&(c=Number(s.value));let d={radius:c,color:o,opacity:1,fill:!0,fillOpacity:.05,bubblingMouseEvents:!1};L.circle([Number(t),Number(n)],d).addTo(r).on("click",p=>{p.target.remove()}),s.value="0",document.getElementById("inputDiameter").close(),e.preventDefault()});document.getElementById("cancelAddCircle").addEventListener("click",e=>{document.getElementById("inputDiameter").close(),e.preventDefault()});window.onerror=function(t){return document.getElementById("errorMessage").innerText=t,!1};function E(e){document.getElementById("errorMessage").textContent=e.message,document.getElementById("errorMessageWrap").classList.toggle("visually-hidden"),console.error(e)}
