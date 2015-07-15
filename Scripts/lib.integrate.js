Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function Map(){

	/* 私有變數定義 */
	/*--------------*/
	this._map = null;  			//地圖主要容器
	this._map_selector; 	//地圖容器
	this._markers = {};  	//標記(marker)集合
	this._bubbles = {};  	//氣泡視窗儲存
	this._id_OpeningWindow; //目前開啟之訊息視窗
	this._platform;  		//目前使用圖台類型
	this._zoom ; 			//目前縮放範圍級距
	this._core = null;				//核心函式庫指標	
	this._op;				//主要操作類別庫

	/* 基礎方法 */
	/*--------------*/

	//** 設定地圖容器選擇器
	this.set_map_selector = function(v) { this._map_selector = v; }

	//** 設定平台
	this.set_platform = function(v) { this._platform = v;  }

	//** 平台初始化
	this.build = function() {
		this._core = loadCore(this._platform); //載入核心
	}

	/* 私有函數 */
	/*----------*/

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

	//** 初始化地圖並載入DOM
	//座標系統 : 經緯度
	//放大級別 : 8
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

	this.generateID = function(id){
		id = typeof id !== 'undefined' ? id : '';
		if(id == '')
        {
        	//若未給予ID，則直接亂數命名
        	id = 0;
        	do {
				var maxNum = 9999999;  
				var minNum = 1000000;  
				id = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;  
			} 
			while(this._markers[id] != undefined);
        }
        else
        {
        	//若編號存在則回傳-1，以進行流程控制
        	if(this._markers[id] != undefined) {
        		console.warn('注意 : ID編號 ' + id + ' 已存在，已略過並未進行複寫，請檢查是否重複 Assign Variable');
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

//子類別 : Goolge Map，進行方法實作
classGoogleMap.prototype = new Map();
function classGoogleMap(map){

	//-----------以下為實作介面
	//** 設定地圖中心點
	classGoogleMap.prototype.setMapCenter = function (point) {  }

	//** 將畫面移至指定地點
	classGoogleMap.prototype.panTo = function (point) { }

	//** 新增標記
	// arg : id > 指定特定 id
	// return : new id
	classGoogleMap.prototype.addMarker = function (Lon, Lat, id)
	{
		id = this.generateID(id); //使用父類別所提供的共用方法

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
	classGoogleMap.prototype.removeMarker = function (id) {
		if(this._markers[id] != undefined) {

			this._markers[id].setMap(null);  //API Delete

    		delete this._markers[id]; // delete marker instance from markers object
    	} else
    		console.warn('注意 : ID編號 ' + id + ' 不存在，請檢查拼寫是否正確；物件是否已存在。');
	}

	//** 新增資訊視窗
	classGoogleMap.prototype.addInfoWindow = function (marker, content) {  }
}

//子類別 : TGOS
classTGOS.prototype = new Map();
function classTGOS(){

	//-----------以下為實作介面
	//** 設定地圖中心點
	classTGOS.prototype.setMapCenter = function (point) {  }

	//** 將畫面移至指定地點
	classTGOS.prototype.panTo = function (point) { }

	//** 新增標記
	// arg : id > 指定特定 id
	// return : new id
	classTGOS.prototype.addMarker = function (Lon, Lat, id) 
	{
		id = this.generateID(id);
		
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
	classTGOS.prototype.addInfoWindow = function (marker, content) {  }
}

