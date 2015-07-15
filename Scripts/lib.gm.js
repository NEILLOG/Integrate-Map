var _map;           //地圖主物件
var _markers = {};  //標記(marker)集合
var _bubbles = {};  //氣泡視窗儲存
var _MapPanelSelector = "#place_map"; //地圖容器
var _geocoder = new google.maps.Geocoder();

$(function () {
    "use strict";

    //[事件:Load] 地圖初始化
    var place_map = $(_MapPanelSelector);
    var mapOptions = {
        //Option通常在建立地圖時設定。但可呼叫 Map.setOptions() 傳入新的控制項選項
        center: new google.maps.LatLng(23.445, 120.9577),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }; _map = new google.maps.Map($(_MapPanelSelector)[0], mapOptions); //須轉換為 dom obj

    //    //[事件:click] 點擊地圖任一處
    //    google.maps.event.addListener(_map, 'click', function(event) {
    //        var ID = "MapClickMarker" ;
    //        if(isMarkerExist(ID)) removeMarker(ID);
    //        var marker = new google.maps.Marker({
    //            map: _map,
    //            position: event.latLng
    //        }); _markers[ID] = marker; //將此標記存入集合

    //        $('#txtLat').val(event.latLng.lat()) ; //緯度
    //        $('#txtLon').val(event.latLng.lng()) ; //經度
    //    });

    //    $('#btnGetAddress').click(function(){
    //    	ShowAddressGeocode($('#txtAddress').val());
    //    });

});  //end onload

//[func] 設定地圖中央點
function SetMapCenter(latlng, ZoomValue) {
    var mapOptions = {
        //Option通常在建立地圖時設定。但可呼叫 Map.setOptions() 傳入新的控制項選項
        center: latlng,
        zoom: ZoomValue
    };
    _map.setOptions(mapOptions);
}

//[func] 依照地址進行地標給予
function ShowAddressGeocode(address) {
    _geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var ResultLatLng = results[0].geometry.location;

            //設定地圖中心
            _map.setCenter(ResultLatLng);

            //設定該座標之唯一索引
            var ID = "SearchResultMarker";

            //若此座標已存在，則移除
            if (isMarkerExist(ID)) removeMarker(ID);

            var marker = new google.maps.Marker({
                map: _map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                position: ResultLatLng
            }); _markers[ID] = marker; //將此標記存入集合

            $('#txtLat').val(ResultLatLng.lat()); //緯度
            $('#txtLon').val(ResultLatLng.lng()); //經度

        } else alert('找不到此地址資訊!');
    });
}

function GetLatLanCity() {
    var LatLng = new google.maps.LatLng($('#txtLat').val(), $('#txtLon').val());
    var Downtown = '0';
    var City = '0';

    _geocoder.geocode({ 'latLng': LatLng }, function (results, status) {
        var isFindAddress = (status == google.maps.GeocoderStatus.OK && results[0]) ? true : false; //results[0].formatted_address : null; //此行目前僅作為判斷用

        if (isFindAddress) {
            console.log(results);
            var Result = results[3];

            //從結果集合中取得城市及鄉鎮資料
            if (typeof Result != 'undefined') {
                for (var i = 0; i < Result.address_components.length; i++) {
                    //console.log(Result.address_components[i].types);
                    for (var j = 0; j < Result.address_components[i].types.length; j++) {
                        var tmp = Result.address_components[i].types[j];
                        if (tmp == "administrative_area_level_3") Downtown = Result.address_components[i].long_name;
                        if (tmp == "administrative_area_level_2" ||
                            tmp == "administrative_area_level_1") City = Result.address_components[i].long_name;
                    }
                }
            } //end if
        }

        $('#hidDowntown').val((typeof Downtown === 'undefined') ? '0' : Downtown); //鄉鎮資料
        $('#hidCity').val((typeof City === 'undefined') ? '0' : City); //縣市資料

        console.log($('#hidDowntown').val());
        console.log($('#hidCity').val());
    });
}

//此方法用於 : 地圖上無標記時，加入用
var PlaceBubble = function (marker, author, name, dDistance, SurveyPID, MainImage, Type) {
    var ID = "InfoBubble";

    //綁定標記與資訊視窗，增加監聽事件(僅顯示車輛目前位置，不可用於連續更新用)
    google.maps.event.addListener(marker, 'click', function () {

        //此車輛泡泡是否存在，若存在則移除
        if (isBubbleExist(ID)) removeBubble(_bubbles[ID], ID);

        var ImageTag = "";

        if (MainImage == "") {
         ImageTag ='<img src="../../Images/Layout/NO_PIC.jpg" width="110px"  height="70px" />';
        }
        else {
            if (Type == 0) {
                ImageTag = '<img src="' + MainImage + '" width="110px"  height="70px" />';
            }
            else {
                ImageTag = '<img src="../../Uploads/UploadSurveyImagesFiles/' + SurveyPID + '/' + MainImage + '" width="110px"  height="70px" />';
            }
        }

        //建立氣泡
        var _defauleFormat = '<table border="0" width="300" cellpadding="0" cellspacing="0">' +
                             '<tr><td colspan="2" class="bubble_bg_name">' +
                                '<span class="bubble_name">' + name + '</span>' +
                             '</td></tr>' +
                             '<tr><td style=\" text-align: center;\">' + ImageTag + '</td><td>' +
                             '<table><tr><td width="70"><span class="bubble_author">提供者</span></td>' +
                                  '<td>' + author + '</td></tr>' +
                             '<tr><td><span class="bubble_date">距離</span></td>' +
                                  '<td>' + dDistance + ' 公里</td></tr></table>' +
                                  '</td></tr>' +
                             '</table>';


        //建立氣泡(此部分需要 Google.map 之 infoBubble 擴充)
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
            //-----
            content: _defauleFormat,
            map: _map
        }); _bubbles[ID] = infoBubble; //存入集合

        infoBubble.open(_map, marker);
        console.log(_bubbles);

    });
}



//[sub-func] 傳入經緯度，並建立為 LatLng物件
var getLatLng = function (lat, lng) {
    return new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
};

//[sub-func] 移除標記(陣列與地圖均移出)
var removeMarker = function (markerId) {
    _markers[markerId].setMap(null); // set markers setMap to null to remove it from map
    delete _markers[markerId]; // delete marker instance from markers object
};

//[sub-func] 標記是否存在
var isMarkerExist = function (markerId) {
    return (_markers[markerId] != undefined) ? true : false;
};


//[sub-func] 泡泡資訊是否存在
var isBubbleExist = function (markerId) {
    return (_bubbles[markerId] != undefined) ? true : false;
};

//[func] 移除座標(陣列與地圖均移出)
var removeBubble = function (bubble, markerId) {
    bubble.setMap(null); // set markers setMap to null to remove it from map
    delete _bubbles[markerId]; // delete marker instance from markers object
};
