$.fn.extend({
animateCss: function (animationName) {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        this.addClass('animated ' + animationName).one(animationEnd, function() {
            $(this).removeClass('animated ' + animationName);
        });
    },
disableBtn: function (){
      this.attr("disabled", true);
    },
enableBtn: function (){
      this.attr("disabled", false);
    }     
});

//user location using google API
function geoFindMe() {
  var output = document.getElementById("weather-container");
  var units, deg;
    if($(".btn-on").hasClass('btn-danger')){
      units = "ca";
      deg = "&deg;C"; 
     } else {
      units = "us";
      deg = "&deg;F";  
     } 
  if (!navigator.geolocation){
    output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    return;
  }

  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;
    
    $("#cityLat").val(latitude);
    $("#cityLng").val(longitude);
    
	  getWeather(latitude, longitude, units, deg);	
    getAddress(latitude, longitude);
    
  }

  function error() {
    getIpLoc(units, deg);	
  }
  navigator.geolocation.getCurrentPosition(success, error);
}

//location based on IP address when geolocation fails
function getIpLoc(units, deg){
  var ipInfoUrl = 'https://ipinfo.io/json'; 
  var latitude, longitude;
  	$.getJSON(ipInfoUrl, function(data) {
    	var latLong = data.loc.split(",");
       latitude = latLong[0];
       longitude = latLong[1];
      $("#cityLat").val(latitude);
    $("#cityLng").val(longitude);
      getWeather(latitude, longitude, units, deg);	
      getAddress(latitude, longitude);
    })
    
}

//get location based on search criteria using google places
function initialize() {
    
    var input = document.getElementById('searchTextField');
    var autocomplete = new google.maps.places.Autocomplete(input);
    google.maps.event.addListener(autocomplete, 'place_changed', function () {
        $('.error').addClass('hidden');
        if($('.panel').hasClass('hidden')){
          $('.panel').removeClass('hidden');
        }
  
        var place = autocomplete.getPlace();
        $(".main-address").text(place.formatted_address);
        var latitude  = place.geometry.location.lat();
        var longitude = place.geometry.location.lng();
        $("#cityLat").val(latitude);
        $("#cityLng").val(longitude);
        var units, deg;
    if($(".btn-on").hasClass('btn-danger')){
      units = "ca";
      deg = "&deg;C"; 
     } else if ($(".btn-off").hasClass('btn-danger')) {
      units = "us";
      deg = "&deg;F";  
     } 
       getWeather(latitude, longitude, units, deg);	
       
    });
  
}
google.maps.event.addDomListener(window, 'load', initialize);

// display address
function getAddress(latitude, longitude){
    var googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=false'; 
  	$.getJSON(googleUrl, function(data) {
    	var address = data.results[3].formatted_address;
    $(".main-address").text(address).animateCss('fadeIn');    
    })
}  

// get weather forecast
function getWeather(latitude, longitude, units, deg){

  var weatherUrl = "https://api.darksky.net/forecast/0214ddf09c891cbcc6919d1447cae41c/"+latitude+","+longitude+"?callback=?&exclude=minutely,alerts,flags&units=" + units;
  
  $.getJSON(weatherUrl).then(function(json) {

  setMainPanel(json, deg, units)  
  var arr = json.daily.data; 
  arr.shift();    
  arr.pop();
  var subDays = [];  
  for(i=0;i<arr.length;i++){
   var html = setSubPanel(json.daily.data[i], deg, json.timezone);  
    subDays += html;
  }
    
  $(".daily-summary").html(json.daily.summary);
  $(".succeeding-days").html(subDays).animateCss("fadeIn");
	})
	.fail(function() {
	  var html = "<blockquote>Unable to get weather</blockquote>"
	  $(".weather-container").html(html);
	});

}

//display weather on main panel
function setMainPanel(json, deg, units){
  var jsonTemp;
  var fmt = "h:mm A ddd, MM/DD";
  var fmt1 = "h:mm A";
  var newTime =  convertTime(json.currently.time, json.timezone, fmt); 
  var newSunrise =  convertTime(json.daily.data[0].sunriseTime, json.timezone, fmt1); 
  var newSunset =  convertTime(json.daily.data[0].sunsetTime, json.timezone, fmt1); 
	var iconCode = json.currently.icon;	
  var humidity = Math.round(json.currently.humidity*100);
  var cloudCover = Math.round(json.currently.cloudCover*100);
  var windScale = beaufortScale(json.currently.windSpeed, units);
//   Display main panel
   
  $(".main-date").text(newTime).animateCss('fadeIn');  
  $(".main-temp").html('<i class="wi wi-thermometer"></i><strong class="temp-val" style="font-size:1.3em"> '+json.currently.temperature+'</strong> '+deg).animateCss('fadeIn');  
  $(".main-summary").text(json.hourly.summary).animateCss('fadeIn');  
  $(".current-summary").text(json.currently.summary).animateCss('fadeIn');  
  $(".main-wind").html(windScale.icon+'<br>'+windScale.scale).animateCss('fadeIn'); 
  $(".main-wind-val").html(windScale.speed+' '+windScale.unit).animateCss('fadeIn'); 
  $(".humidity").html('<i class="wi wi-humidity"></i> Humidity: '+ humidity + '%').animateCss('fadeIn');  
  $(".cloud-cover").html('<i class="wi wi-cloud"></i> Cloud Cover: '+ cloudCover + '%').animateCss('fadeIn');  
  $(".sunrise-sunset").html('<i class="wi wi-sunrise"></i> '+newSunrise+' | <i class="wi wi-sunset"></i> '+newSunset).animateCss('fadeIn'); 
  setMainIcon(json.currently.icon);
}

//set weather icon on main panel
function setMainIcon(currentIcon, deg){
   var panelBodyCss;
   var body = "body";
   var panelBody = ".panel-body";
   var panelBodyCss = "linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.8)),";
   var bodyCss = "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0)),";
  
   var iconVal = weatherIcon(currentIcon);

   changeBg(body,iconVal.img,bodyCss);
   changeBg(panelBody,iconVal.img,panelBodyCss);
   $('.main-icon').html(iconVal.icon);
}

//display 6-day forecast on subpanel
function setSubPanel(dailyData, deg, timezone){
  var dailyIcon = weatherIcon(dailyData.icon);
  var ftm = 'ddd, MM/DD';
  var fmt1 = "h:mm A";
  var newTime =  convertTime(dailyData.time, timezone, ftm);
  var newSunrise =  convertTime(dailyData.sunriseTime, timezone, fmt1);
  var newSunset =  convertTime(dailyData.sunsetTime, timezone, fmt1);
  var humidity = Math.round(dailyData.humidity*100);
  var cloudCover = Math.round(dailyData.cloudCover*100);
  var html = '<div class="col-xs-12 col-sm-12 col-md-4 col-lg-2">';
  html += '<hr /><h3 class="sub-date">'+newTime+'</h3>';
  html += '<p class="sub-icon">'+dailyIcon.iconSmall+'</p>';
 
  html += '<div class="col-xs-6 col-md-6 min"><p class="sub-temp temp">- <i class="wi wi-thermometer"></i><br> '+dailyData.temperatureMin+ ' '+deg+'</p></div>';
  html += '<div class="col-xs-6 col-md-6 max"><p class="sub-temp temp">+ <i class="wi wi-thermometer"></i> <br>'+dailyData.temperatureMax+ ' '+deg+'</p></div>';
  html += '<div class="col-xs-6 col-md-6 min"><p class="sub-temp temp"><i class="wi wi-sunrise"></i> <br>'+newSunrise+'</p></div>';
  html += '<div class="col-xs-6 col-md-6 min"><p class="sub-temp temp"><i class="wi wi-sunset"></i><br> '+newSunset+'</p></div>';
  html += '<div class="col-xs-6 col-md-6 min"><p class="sub-temp temp"><i class="wi wi-humidity"></i><br> '+humidity+'%</p></div>';
  html += '<div class="col-xs-6 col-md-6 min"><p class="sub-temp temp"><i class="wi wi-cloud"></i><br> '+cloudCover+'%</p></div>';
   html += '<p class="sub-summary">'+dailyData.summary+'</p></div>';

  return html;
}

//get weathericon based on weather API 
function weatherIcon(currentIcon){
   var img, icon, iconSmall; 
   switch(currentIcon)  {
       case "rain":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-40787.jpg";
         icon = '<i class="wi wi-rain wi-lg"></i>';
         iconSmall = '<i class="wi wi-rain wi-md"></i>';
       break;
       case "clear-day":
         img = "http://desktopwalls.net/wp-content/uploads/2014/11/Minimalist%20Kite%20Clouds%20Desktop%20Wallpaper.jpg";
         icon = '<i class="wi wi-day-sunny wi-lg"></i>';
         iconSmall = '<i class="wi wi-day-sunny wi-md"></i>';
       break;
       case "partly-cloudy-day":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-84959.jpg";
         icon = '<i class="wi wi-day-cloudy wi-lg"></i>';
         iconSmall = '<i class="wi wi-day-cloudy wi-md"></i>';
         $('.icon-holder').css('margin-top', '20px');
       break;
       case "clear-night":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-36601.jpg";
         icon = '<i class="wi wi-night-clear wi-lg"></i>';
         iconSmall = '<i class="wi wi-night-clear wi-md"></i>';
         $('.icon-holder').css('margin-top', '-10px');
       break;
       case "partly-cloudy-night":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-459955.jpg";
         icon = '<i class="wi wi-night-cloudy wi-lg"></i>';
         iconSmall = '<i class="wi wi-night-cloudy wi-md"></i>';
       break;
       case "snow":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-147423.jpg";
         icon = '<i class="wi wi-snow wi-lg"></i>';
         iconSmall = '<i class="wi wi-snow wi-md"></i>';
       break;
       case "sleet":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-15192.jpg";
         icon = '<i class="wi wi-sleet wi-lg"></i>';
         iconSmall = '<i class="wi wi-sleet wi-md"></i>';
       break;
       case "wind":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-210091.jpg";
         icon = '<i class="wi wi-windy wi-lg"></i>';
         iconSmall = '<i class="wi wi-windy wi-md"></i>';
       break;
       case "cloudy":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-316351.jpg";
         icon = '<i class="wi wi-cloudy wi-lg"></i>';
         iconSmall = '<i class="wi wi-cloudy wi-md"></i>';
       break;
       case "fog":
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-242453.jpg";
         icon = '<i class="wi wi-fog wi-lg"></i>';
         iconSmall = '<i class="wi wi-fog wi-md"></i>';
       break;
       default:
         img = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-505948.jpg";
         icon = '<i class="wi wi-na wi-lg"></i>';
         iconSmall = '<i class="wi wi-na wi-md"></i>';  
   }
      var results = {
         img: img,
         icon: icon,
         iconSmall: iconSmall
       };
       return results;

}  

//get beaufort scale based on windspeed on weather API
function beaufortScale(windSpeed, units){
  var kmSpeed;
  var icon,scale; 
  var speed, unit;
   if(units == "us") {
    unit = "mph";
    kmSpeed = Math.round(windSpeed * 1.6);
    speed = windSpeed;  
  } else {
    kmSpeed = Math.round(windSpeed);
    speed = windSpeed;  
    unit = "km/h";  
  }
  
  if(kmSpeed<1){
        icon = '<i class="wi wi-wind-beaufort-0 wi-sm"></i>';
        scale = 'Calm';
  } else if(kmSpeed>=1 && kmSpeed<=5) {
        icon = '<i class="wi wi-wind-beaufort-1 wi-sm"></i>';
        scale = 'Light Air';
  } else if(kmSpeed>=6 && kmSpeed<=11) {
        icon = '<i class="wi wi-wind-beaufort-2 wi-sm"></i>';
        scale = 'Light Breeze';
  } else if(kmSpeed>=12 && kmSpeed<=19) {
        icon = '<i class="wi wi-wind-beaufort-3 wi-sm"></i>';
        scale = 'Gentle Breeze';
  } else if(kmSpeed>=20 && kmSpeed<=28) {
        icon = '<i class="wi wi-wind-beaufort-4 wi-sm"></i>';
        scale = 'Moderate Breeze';
  } else if(kmSpeed>=29 && kmSpeed<=38) {
        icon = '<i class="wi wi-wind-beaufort-5 wi-sm"></i>';
        scale = 'Fresh Breeze';
  } else if(kmSpeed>=39 && kmSpeed<=49) {
        icon = '<i class="wi wi-wind-beaufort-6 wi-sm"></i>';
        scale = 'Strong Breeze';  
  } else if(kmSpeed>=50 && kmSpeed<=61) {
        icon = '<i class="wi wi-wind-beaufort-7 wi-sm"></i>';
        scale = 'High Wind';
  } else if(kmSpeed>=62 && kmSpeed<=74) {
        icon = '<i class="wi wi-wind-beaufort-8 wi-sm"></i>';
        scale = 'Gale';  
  } else if(kmSpeed>=75 && kmSpeed<=88) {
        icon = '<i class="wi wi-wind-beaufort-9 wi-sm"></i>';
        scale = 'Strong Gale';
  } else if(kmSpeed>88){
        icon = '<i class="wi wi-wind-beaufort-10 wi-sm"></i>';
        scale = 'Storm'; 
  }
  
  var results = {
        speed: speed,
        unit: unit,
        icon: icon,
        scale: scale
  };
  return results;
}

//change background image
function changeBg(className, img, gradient) {
  $(className).css({'background': gradient+" url("+img+") center repeat",
      'background-attachment': 'fixed',
      'background-size': 'cover',      
       });
}


//convert unix time to human time
function convertTime(input, timezone, format){
    var timestamp = moment.unix(input);
    return moment(timestamp).tz(timezone).format(format); 
} 
 

//settings button - set to SI units
$(".btn-on").on("click", function(){
   var units, deg;
   var latitude = $("#cityLat").val();
   var longitude = $("#cityLng").val();
      $(".toggleBtn").removeClass("btn-danger");
      $(".btn-on").addClass("btn-danger"); 
      units = "ca"; 
      deg = "&deg;C";
   getWeather(latitude, longitude, units, deg);
});

//settings button - set to US units
$(".btn-off").on("click", function(){ 
  var units, deg;
   var latitude = $("#cityLat").val();
   var longitude = $("#cityLng").val();
   $(".toggleBtn").removeClass("btn-danger");
      $(".btn-off").addClass("btn-danger"); 
      units = "us";
      deg = "&deg;F";
  getWeather(latitude, longitude, units, deg);
});
 // settings toggle 
  $(".settingsBtn").on("click", function(){
    $(this).hide();
    $(".settings-wrapper").css({"background": "rgba(255,255,255,.5)"});
    $(".settings").show();
    $(".closeBtn").show();
    $(".settings").css("opacity", 1).animateCss("flipInX");
  });

function closeBtn(){
    $(".settings-wrapper").css("background", "transparent");
    $(".closeBtn").hide();
    $(".settingsBtn").show();
    $(".settings").css("opacity", 0);
    $(".settings").fadeOut("slow");
    $(".settings").hide();
    $(".toggleBtn").css("cursor", "pointer !important");
}

//Scroll to Top
$(function(){
 
    $(document).on( 'scroll', function(){
 
    	if ($(window).scrollTop() > 150) {
			$('.scroll-top-wrapper').addClass('show');
		} else {
			$('.scroll-top-wrapper').removeClass('show');
		}
	});
 
	$('.scroll-top-wrapper').on('click', scrollToTop);
});
 
function scrollToTop() {
	verticalOffset = typeof(verticalOffset) != 'undefined' ? verticalOffset : 0;
	element = $('body');
	offset = element.offset();
	offsetTop = offset.top;
	$('html, body').animate({scrollTop: offsetTop}, 500, 'linear');
}
$('.ffc').animateCss("flash");
 setTimeout(function(){
      $('.se-pre-con').animateCss("slideOutLeft");
      $('.se-pre-con').css({"opacity": 0, "z-index": -1, "transition": "z-index 0.8s step-end, opacity 0.5s linear"});
       },3000); 



geoFindMe();