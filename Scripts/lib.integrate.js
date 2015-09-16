/*-------------------------
	Map Integrate Plugin
	Last Update : 20150916
	Version : v1.4
	Auth : Neil Chang
	----更新日誌---
	20150916	v1.4	修正新增TGOS氣泡視窗事件
	20150824	v1.30	新增地圖監控事件新增(限定zoom_changed)/修正氣泡視窗長寬
	20150806 	v1.21 	新增標記點取座標函數
	20150806	v1.2 	新增地址搜尋服務
	20150714	v1.12 	新增地圖模式切換
-------------------------*/

function Map(){

	/*---------------------私有變數定義---------------------*/
	this._map = null;  		//地圖主要容器
	this._map_selector; 	//地圖容器
	this._markers = {};  	//標記(marker)集合
	this._bubbles = {};  	//氣泡視窗儲存
	this._id_OpeningWindow; //目前開啟之訊息視窗
	this._platform;  		//目前使用圖台類型
	this._zoom ; 			//目前縮放範圍級距
	this._core = null;		//核心函式庫指標	
	this._op;				//主要操作類別庫

	/*--------------------基礎方法----------------------*/

	//** 設定地圖容器選擇器
	this.set_map_selector = function(v) { this._map_selector = v; }

	//** 設定平台
	this.set_platform = function(v) { this._platform = v;  }

	//** 平台初始化
	this.build = function() {
		this._core = loadCore(this._platform); //載入核心
	}

	/*------------------私有函數--------------------*/

	//** 載入核心設定
	//不回傳任何值
	function loadCore(platform) {
		var url ;
		switch(platform) {
			case 'google' :
				url = 'https://maps.googleapis.com/maps/api/js?v=3.exp'  +
      				  '&signed_in=true&callback=LoadGoogleMapAPI';
				break;
			case 'tgos' :
				url = 'http://api.tgos.nat.gov.tw/TGOS_API/tgos?ver=2&AppID=12qyFjG2GQU=&APIKey=aeyf21l4lya7LN00RLKg8d9jkHjT0FUUMPPudNtQ7n9MQjPK5Hx9QGDqpHdTz+cIbhohNcfE/7BYJbKBOtPYXMuR+1dCFTg+GIC9EIWsx/KpRWQdrXDQdm8MGN0D7LpUVHTBGr3s8abZ8LJ4LimFqIHUA0KCq6BZ0Vr/epUKYEY=';
				break;
			default :
				alert('平台設定未正確，請確認參數');
				return;
				break;
		}
		
		$.getScript( url, function( data, textStatus, jqxhr ) {
			if(jqxhr.status == 200) {
			  	//console.log( jqxhr.status ); // 200
			  	//console.log( "Load was performed." );
			  	//console.log(TGOS);
			  	//console.log(Map._core);
			  	switch(platform) {
					case 'google' : Map._core = google; break;
					case 'tgos' : Map._core = TGOS; break;
				}

				//載入DOM
				Map.loadDOM(Map._map_selector,
							Map._platform,
							Map._core);

			} else {
				alert('平台函式庫載入失敗，請檢查連結檔案是否正確');
			}
		});

		/*//方法2
		var script = document.createElement('script');
		  	script.type = 'text/javascript';
		  	script.src = url;
		document.body.appendChild(script);

		script.onload = function() {
			//console.log('Script loading Done!');
			//console.log(google);
			//console.log(Map); //work on global

			switch(platform) {
				case 'google' : Map._core = google; break;
				case 'tgos' : Map._core = TGOS; break;
			}

			console.log(Map._core);
		};*/
	}

	/*------------------公用函數--------------------*/
	//** 初始化地圖並載入DOM	
	this.loadDOM = function (map_selecrot, platform, core){
		
		var map ;

		//detect dom 
		var dom = $(map_selecrot);
		if(dom == undefined || dom.length == 0) 
		{
			alert('平台DOM未載入，請檢查 DOM 結構是否正確。');
			return ;
		}

		//depend on platform
		switch(platform) {
			case 'google':
				//TODO: 目前動態載入僅能透過 API 來做 Asynchronous Loading 
				//一般透過載入 Script Loading，進行JS的 initialize 只能載完 API 的主要 JS 檔
				//此主要 JS 還會進行額外加載其他附加 JS 檔，這些 JS 檔才是真正主要的函式庫群
				//因此在之前進行 LoadCore 後，直接透過 URL 本身的 initialize callback 進行加載及地圖載入動作
				break;

			case 'tgos' :
		        var center = new core.TGPoint(120.9577, 23.445); 
				var options = {
			        center: center
			    };

		        map = new core.TGOnlineMap(dom[0], core.TGCoordSys.EPSG3857, options); 
		        map.setZoom(8); 
				break;
		}
		
		//儲存全域地圖
		Map._map = map;

		//建立操作用實體類別庫
		switch(platform) {
			case 'google':
				Map._op = new classGoogleMap(map);
				break;
			case 'tgos':
				Map._op = new classTGOS(map);
				break;
		}
	}

	//** 取得新 ID 及檢查 ID 是否重複
	this.generateID = function (id, type){
		id = typeof id !== 'undefined' ? id : '';

		var Arr ;
		switch(type) {
			case 'marker' :
				Arr = this._markers ;
				break;
			case 'bubble' :
				Arr = this._bubbles ;
				break;
			default:
				console.warn('注意 : ID 函式引用錯誤');
				break;
		}

		if(id == '')
        {
        	//若未給予ID，則直接亂數命名
        	id = 0;
        	do {
				var maxNum = 9999999;  
				var minNum = 1000000;  
				id = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;  
			} 
			while(Arr[id] != undefined);
        }
        else
        {
        	//若編號存在則回傳-1，以進行流程控制
        	if(Arr[id] != undefined) {
        		console.warn('注意 : ID 編號 ' + id + ' 已存在，已略過並未進行複寫，請檢查是否重複 Assign Variable');
        		return -1;
        	}
		}

		return id;
	}

	//** 建立模式切換超連結
	this.createChangePanel = function(CSSid , CSSClass) {
		var link = location.search; //全域
		var linkElement = $('<a></a>') ;
		var newLinks = new Array();

		//現有GET分割
		var arrLinks = link.split('?');
			if(arrLinks.length > 1)
			{
				arrLinks = arrLinks[1].split('&');
			}

		//判斷地圖參數(map)是否存在於GET
		var existMapArg = getParameterByName('map');
		if(existMapArg != '')
		{
			//若原先已有，則進行參數值替換即可
			for(var i = 0 ; i < arrLinks.length; i++) 
			{
				var r = arrLinks[i].split('=') ;
				console.log(r);
				if(r[0] != 'map') continue;
				
				//與目前使用的相反
				switch(r[1])
				{
					case 'google' : r[1] = "tgos"; break; 
					case 'tgos' :   r[1] = "google"; break;
				}//end switch

				arrLinks.splice(i, 1); //移除舊的 map 參數
				arrLinks.push(r.join('=')); //加入新的 map 參數
			}//end for

			//組合結果
			link = "?" + arrLinks.join('&');

		} else {
			//若原本沒有，則直接加上參數
			link += (link == "") ? "?" : "&" ; //依照參數個數狀況給予

			//與目前使用的相反
			switch(Map._platform)
			{
				case 'google' : link += "map=tgos"; break; 
				case 'tgos' :   link += "map=google"; break;
			}
		}

		//與目前使用的相反
		switch(Map._platform)
		{
			case 'google' : linkElement.text('切換至 TGOS 地圖'); break; 
			case 'tgos' : linkElement.text('切換至 Google Map 地圖'); break;
		}

		//建立超連結
		linkElement.prop('href',  link);

		//若使用者有指定 CSS id，則加入
		CSSid = typeof CSSid !== 'undefined' ? CSSid : '';
		if(CSSid != '') 
			linkElement.prop('id', CSSid);

		//若使用者有指定 CSS class，則加入
		CSSClass = typeof CSSClass !== 'undefined' ? CSSClass : '';
		if(CSSClass != '') 
			linkElement.prop('class', CSSClass);

		return linkElement;
	}
}

//** 載入Google Map 
function LoadGoogleMapAPI(){
	var center = new Map._core.maps.LatLng(23.445, 120.9577);
    var options = {
        center: center,
        zoom: 8,
        mapTypeId: Map._core.maps.MapTypeId.ROADMAP
    };
    Map._map = new Map._core.maps.Map($(Map._map_selector)[0], options); //須轉換為 dom obj
}

//通用函數 : 取得特定網址列參數
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//-------------------------------------------------------------------------------------------------------------

//子類別 : Goolge Map，進行方法實作
classGoogleMap.prototype = new Map();
function classGoogleMap(map){

	//** 建立坐標物件
	this.point = function(Lon, Lat) {
		return new Map._core.maps.LatLng(Lat, Lon);
	}

	//** 設定地圖中心點
	this.setMapCenter = function (point, zoom) { 
		zoom = typeof zoom !== 'undefined' ? zoom : Map._map.getZoom();
		var options = {
			center: point,
        	zoom: zoom
	    };
	    Map._map.setOptions(options);
	}

	//** 將畫面移至指定地點
	this.panTo = function (point) {
		Map._map.panTo(point);
	}

	//** 新增標記
	// Lon(X) : required
	// Lat(Y) : required
	// id : optional
	// return : id 
	this.addMarker = function (Lon, Lat, id)
	{
		id = this.generateID(id, 'marker'); //使用父類別所提供的共用方法

		if(id != -1) {
			var location = new Map._core.maps.LatLng(Lat, Lon);
	        var marker = new Map._core.maps.Marker({
				             map: Map._map,
				             position: location
				         });

	       	//Push in object
			this._markers[id] = marker;
		}
 
        return id;
	}

	//** 移除標記
	this.removeMarker = function (id) {
		if(this._markers[id] != undefined) {

			this._markers[id].setMap(null);  //API Delete

    		delete this._markers[id]; // delete marker instance from markers object

    	} else
    		console.warn('注意 : ID 編號 ' + id + ' 不存在，請檢查拼寫是否正確；物件是否已存在。');
	}

	//** 將標記綁定資訊視窗
	// id : optional
	this.addBubble = function (marker, content, id) {

		var Parent = this;
		id = this.generateID(id, 'bubble'); //使用父類別所提供的共用方法

		//視窗應為唯一值
		if(id != -1) {
		    Map._core.maps.event.addListener(marker, 'click', function () {

		        //建立訊息視窗(此部分需要 Google.map 之 infoBubble 擴充)
		        var infoBubble = new InfoBubble({
		            arrowSize: 10,
		            arrowPosition: 30,
		            arrowStyle: 2,
		            borderRadius: 4,
		            borderColor: '#CCCCCC',
		            backgroundClassName: 'aBubble',
		            shadowStyle: 1,
		            padding: 0,
		            maxWidth: 400,
		            minHeight: 130,
		            content: content,
		            map: Map._map
		        }); 

		        Parent._bubbles[id] = infoBubble; //存入集合

		        infoBubble.open(Map._map, marker);
		    });
		}
	}

	//** 地址搜尋
	this.findLocationAndMarkIt = function(address){
		 var geocoder = new Map._core.maps.Geocoder();
		 geocoder.geocode({ 'address': address }, function (results, status) {
	        if (status == Map._core.maps.GeocoderStatus.OK) {
	        	console.log(results);

	            var point = results[0].geometry.location; //只針對第一個搜尋結果
				var id = "LocationServiceResult"; //設定該座標之唯一索引

	            Map._op.setMapCenter(point); //設定地圖中心
	            
	            Map._op.removeMarker(id);
	            Map._op.addMarker(point.lng(), point.lat(), id); //移除上一次搜尋記錄

	        } else {
	        	var ErrMsg = "";
	        	switch(status)
	        	{
	        		case Map._core.maps.GeocoderStatus.ZERO_RESULTS : 		ErrMsg = "此地標查無資料，請重新查詢"; break;
	        		case Map._core.maps.GeocoderStatus.OVER_QUERY_LIMIT : 	ErrMsg = "短時間內網頁發出太多的定位，請稍候重試"; break;
	        		case Map._core.maps.GeocoderStatus.REQUEST_DENIED : 	ErrMsg = "網頁不允許使用定位服務。，請稍候重試"; break;
	        		case Map._core.maps.GeocoderStatus.INVALID_REQUEST : 	ErrMsg = "要求無效，請稍候重試"; break;
	        		case Map._core.maps.GeocoderStatus.UNKNOWN_ERROR : 		ErrMsg = "伺服器錯誤，請稍候重試"; break;
	        	}
	        	alert(ErrMsg);
	        }
	    });
	}

	//** 取得標記點之經緯度座標
	this.getMarkerPosition = function(marker, target){
		if(marker == "undefined") 
			console.warn('注意 : 標記格式錯誤，請檢查標記是否已存在。');
		else {
			switch(target)
			{
				case 'lat' : return marker.position.lat(); break;
				case 'lon' : return marker.position.lng(); break;
				default: 
					console.warn('注意 : 目標格式錯誤，請檢查參數。');
					return 0;
					break;
			}
		}
	}

	//** 設定地圖事件
	this.setMapEvent = function(handler){
		Map._map.addListener('zoom_changed', handler);
	}

}

//----------------------------------------------------------------------------------------------------------

//子類別 : TGOS
classTGOS.prototype = new Map();
function classTGOS(){

	//** 建立坐標物件
	this.point = function(Lon, Lat) {
		return new Map._core.TGPoint(Lon, Lat); 
	}

	//-----------以下為實作介面
	//** 設定地圖中心點
	classTGOS.prototype.setMapCenter = function (point, zoom) {
		zoom = typeof zoom !== 'undefined' ? zoom : Map._map.getZoom();
		Map._map.setZoom(zoom);
		Map._map.setCenter(point);
	}

	//** 將畫面移至指定地點
	classTGOS.prototype.panTo = function (point) {
		//TGOS LIB 之 PanBy 功能不明確，故改為使用 setCenter 取代功能
		this.setMapCenter(point);
	}

	//** 新增標記
	// arg : id > 指定特定 id
	// return : new id
	this.addMarker = function (Lon, Lat, id) 
	{
		id = this.generateID(id, 'marker');
		
		if(id != -1) {
			//New Marker
			var point = new Map._core.TGPoint(Lon, Lat); 
	    	var marker = new Map._core.TGMarker(Map._map, point, id);

	    	//Push in object
			this._markers[id] = marker;
 		}

        return id;
	}

	//** 移除標記
	classTGOS.prototype.removeMarker = function (id) {
		if(this._markers[id] != undefined) {
			this._markers[id].setMap(this._map, null); 

    		delete this._markers[id]; // delete marker instance from markers object
    	} else
    		console.warn('注意 : ID編號 ' + id + ' 不存在，請檢查物件是否存在或拼寫是否正確。');
	}

	//** 新增資訊視窗
	this.addBubble = function (marker, content, id) {

		var Parent = this;
		id = this.generateID(id, 'bubble'); //使用父類別所提供的共用方法

		//視窗應為唯一值
		if(id != -1) {
		    var point = marker.getPosition();
		    var options = {	//設定訊息視窗參數
		        pixelOffset: new TGOS.TGSize(12, -26), 	//訊息視窗錨點平移量
		        maxWidth: 400							//訊息視窗最大寬度限制
		    };

		    //建立訊息視窗
		    var infoBubble = new Map._core.TGInfoWindow(content, point, options);

			Parent._bubbles[id] = infoBubble; //存入集合

			//點擊 Marker 後，開啟 InfoWindow
		    Map._core.TGEvent.addListener(marker, "click", function () {

		    	//避免重複開啟一樣的
		        if (Parent._bubbles[Parent._id_OpeningWindow] != undefined)
		            Parent._bubbles[Parent._id_OpeningWindow].close();

		        Parent._id_OpeningWindow = id;

			

		        infoBubble.open(Map._map); 
		        
		    });

		    return id;
		}

	}

	//** 重新取得邊界(TGOS獨有函數)
	this.fitBound = function (datas, type)
	{
	    var X_Maxs = 0;     //X 最大值
	    var X_Mins = 1000;  //X 最小值(因經度永遠小於1000，故做為第一個值的判斷加入使用)
	    var Y_Maxs = 0;     //Y 最大值
	    var Y_Mins = 1000;  //Y 最小值(因緯度永遠小於1000，故做為第一個值的判斷加入使用)
	   
	    switch(type)
	    {
	    	case 'marker' :
			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].getPosition().x > X_Maxs)
			            X_Maxs = datas[i].getPosition().x;

			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].getPosition().x < X_Mins)
			            X_Mins = datas[i].getPosition().x;

			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].getPosition().y > Y_Maxs)
			            Y_Maxs = datas[i].getPosition().y;

			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].getPosition().y < Y_Mins)
			            Y_Mins = datas[i].getPosition().y;
			    break;

			case 'point' :
			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].x > X_Maxs)
			            X_Maxs = datas[i].x;

			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].x < X_Mins)
			            X_Mins = datas[i].x;

			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].y > Y_Maxs)
			            Y_Maxs = datas[i].y;

			    for (var i = 0; i < datas.length; i++)
			        if (datas[i].y < Y_Mins)
			            Y_Mins = datas[i].y;
			    break;
		}


	    //console.log(X_Maxs, X_Mins, Y_Maxs, Y_Mins);
	    return new TGOS.TGEnvelope(X_Mins, Y_Maxs, X_Maxs, Y_Mins);
	}

	//** 地標搜尋
	// return : Location Point
	this.findLocationAndMarkIt = function(address){
		var LService 		= new Map._core.TGLocateService(); 
		var request_poi 	= { poi: address };
		var request_address = { address: address };
		var isSearchSuccess = true;

		//第一次嘗試，使用地標搜尋(非同步執行)
        LService.locateWGS84(request_poi, function(result, status){
        	console.log(result);
			if (status == 'OK')	{
				var point = result[0].geometry.location; //只針對第一個地點打點 
	            var id = "LocationServiceResult"; //設定該座標之唯一索引

				Map._op.removeMarker(id);
				Map._op.addMarker(point.x, point.y, id);
			}
			else {
				var ErrMsg = "";
				switch(status)
				{
					case Map._core.TGLocatorStatus.ERROR : 				ErrMsg = "與伺服器溝通有誤，請稍候重試"; break;
					case Map._core.TGLocatorStatus.INVALID_REQUEST : 	ErrMsg = "要求無效，請稍候重試"; break;
					case Map._core.TGLocatorStatus.OVER_QUERY_LIMIT : 	ErrMsg = "短時間內網頁發出太多的定位，請稍候重試"; break;
					case Map._core.TGLocatorStatus.REQUEST_DENIED : 	ErrMsg = "網頁不允許使用定位服務。，請稍候重試"; break;
					case Map._core.TGLocatorStatus.UNKNOWN_ERROR : 		ErrMsg = "伺服器錯誤，請稍候重試"; break;
					case Map._core.TGLocatorStatus.ZERO_RESULTS : 		ErrMsg = "此地標查無資料，請重新查詢"; break;
					case Map._core.TGLocatorStatus.TOO_MANY_RESULTS : 	ErrMsg = "結果過多，請使用更為精確之地標關鍵字"; break;
				}
				alert(ErrMsg);
			}				
		});
	}

	//** 取得標記點之經緯度座標
	this.getMarkerPosition = function(marker, target){
		if(marker == "undefined") 
			console.warn('注意 : 標記格式錯誤，請檢查標記是否已存在。');
		else {
			switch(target)
			{
				case 'lat' : return marker.position.y; break;
				case 'lon' : return marker.position.x; break;
				default: 
					console.warn('注意 : 目標格式錯誤，請檢查參數。');
					return 0;
					break;
			}
		}
	}

	//** 設定地圖事件
	this.setMapEvent = function(handler){
		Map._core.TGEvent.addListener(Map._map, 'zoom_changed', handler);
	}

}
