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

	/*------------------工用函數--------------------*/
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
		            maxWidth: 300,
		            minHeight: 110,
		            content: content,
		            map: Map._map
		        }); 

		        Parent._bubbles[id] = infoBubble; //存入集合

		        infoBubble.open(Map._map, marker);
		    });
		}
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
	classTGOS.prototype.addMarker = function (Lon, Lat, id) 
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
		        maxWidth: 600							//訊息視窗最大寬度限制
		    };

		    //建立訊息視窗
		    var infoBubble = new Map._core.TGInfoWindow(content, point, options);

		    Map._core.TGEvent.addListener(marker, "click", function () {

		    	//避免重複開啟一樣的
		        if (Parent._bubbles[id] != undefined)
		            Parent._bubbles[id].close();

				Parent._bubbles[id] = infoBubble; //存入集合

		        infoBubble.open(Map._map); 
		        
		    });
		}

	}

	//** 重新取得邊界(TGOS獨有函數)
	this.fitBound = function (markers)
	{
	    var X_Maxs = 0;     //X 最大值
	    var X_Mins = 1000;  //X 最小值(因經度永遠小於1000，故做為第一個值的判斷加入使用)
	    var Y_Maxs = 0;     //Y 最大值
	    var Y_Mins = 1000;  //Y 最小值(因緯度永遠小於1000，故做為第一個值的判斷加入使用)
	   
	    //第一次過濾，取得極值
	    for (var i = 0; i < markers.length; i++)
	        if (markers[i].getPosition().x > X_Maxs)
	            X_Maxs = markers[i].getPosition().x;

	    for (var i = 0; i < markers.length; i++)
	        if (markers[i].getPosition().x < X_Mins)
	            X_Mins = markers[i].getPosition().x;

	    for (var i = 0; i < markers.length; i++)
	        if (markers[i].getPosition().y > Y_Maxs)
	            Y_Maxs = markers[i].getPosition().y;

	    for (var i = 0; i < markers.length; i++)
	        if (markers[i].getPosition().y < Y_Mins)
	            Y_Mins = markers[i].getPosition().y;

	    //console.log(X_Maxs, X_Mins, Y_Maxs, Y_Mins);
	    return new TGOS.TGEnvelope(X_Mins, Y_Maxs, X_Maxs, Y_Mins);
	}
}

