var _TGOS_Map; //地圖主物件
var _TGOS_markers = new Array();  //標記(marker)集合
var _TGOS_bubbles = {};  //氣泡視窗儲存
var _TGOS_MapPanelSelector = "#map_canvas"; //地圖容器
var _TGOS_OpeningInfoWindow; //目前開啟之訊息視窗

//Init Map
$().ready(function () {
    //初始化設定
    if (typeof TGOS != 'undefined') {

        var Canvas = $(_TGOS_MapPanelSelector)[0];

        var Sys_LatLon = TGOS.TGCoordSys.EPSG3857;
        var Sys_Tw = TGOS.TGCoordSys.EPSG3826;
        var Sys_PonHou = TGOS.TGCoordSys.EPSG3825;

        var mkTaiwanCenterPoint = new TGOS.TGPoint(120.97388, 23.97565); //台灣正中心

        _TGOS_Map = new TGOS.TGOnlineMap(Canvas, Sys_LatLon); //指定坐標軸系統
        _TGOS_Map.setCenter(mkTaiwanCenterPoint);
        _TGOS_Map.setZoom(8);  //設定目前地圖縮放的層級

        TGOS.TGEvent.addListenerOnce(_TGOS_Map, 'click', function () {
            alert(_TGOS_Map.getZoom());
        });

        console.log('map Created');
    }
});

//增加 : 標記
function AddMarker(Lon, Lat) 
{
    var point = new TGOS.TGPoint(Lon, Lat);  //設定點資料坐標
    var marker = new TGOS.TGMarker(_TGOS_Map, point, "內政部");
        marker.setZIndex(10);

        _TGOS_markers.push(marker);

    return marker;
}

//增加 : 訊息視窗
function AddInfoWindow(Marker, Content) {

    var X = Marker.getPosition().x;
    var Y = Marker.getPosition().y;

    var options = {	//設定訊息視窗參數
        pixelOffset: new TGOS.TGSize(12, -26), //訊息視窗錨點平移量
        maxWidth: 600	//訊息視窗最大寬度限制
    };

    //建立訊息視窗
    var info = new TGOS.TGInfoWindow(Content, new TGOS.TGPoint(X, Y), options);



    TGOS.TGEvent.addListener(Marker, "click", function () {

        if (_TGOS_OpeningInfoWindow != undefined)
            _TGOS_OpeningInfoWindow.close();

        _TGOS_OpeningInfoWindow = info;

        info.open(_TGOS_Map);

        console.log(info);

    });
}

//重新取得邊界
function FitBound(markers)
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


//建立 : 氣泡視窗內容
function CreateInfoWindowContent(author, name, dDistance, SurveyPID, MainImage, Type)
{
    //檢查是否有圖片
    var ImageTag;
    if (MainImage == "") 
        ImageTag ='<img src="../../Images/Layout/NO_PIC.jpg" width="110px"  height="70px" />';
    else 
        if (Type == 0) 
            ImageTag = '<img src="' + MainImage + '" width="110px"  height="70px" />';
        else
            ImageTag = '<img src="../../Uploads/UploadSurveyImagesFiles/' + SurveyPID + '/' + MainImage + '" width="110px"  height="70px" />';

    //建立氣泡內容
    var _content =  '<table border="0" width="300" cellpadding="0" cellspacing="0">' +
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

    return _content;
}