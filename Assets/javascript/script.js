var searchBar = $("#search-bar");
var searchButton = $("#search-btn");
var searchHistory = $("#search-history");
var weatherCol = $("#weather-col");

var apiKey = "3b92877da3eba435a634ec7b8dfd4ba8";
var currentWeatherUrl;
var forecastUrl;
var storedCities = [];

//Retrieves stored searched Cities from local storage then convert it into an array
var tempStoredSearches = localStorage.getItem("storedSearches");
if (tempStoredSearches !== null)
    storedCities = tempStoredSearches.split(",");

//Create variable for current date
var today = new Date();
var currentDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();


function populateCurrentWeather() {

    //Current weather API call
    $.ajax({
        url: currentWeatherUrl,
        method: "GET"
    }).then(function(response) {

        //Create ogject where the location weather data will be populated 
        var currentWeatherObj = {
            location: response.name,
            cityCountry: response.sys.country,
            date: currentDate,
            weatherIcon: response.weather[0].icon,
            weatherDescription: response.weather[0].main,
            currentTemperature: Math.round(response.main.temp),
            maxTemperature: Math.round(response.main.temp_max),
            minTemperature: Math.round(response.main.temp_min),
            humidity: response.main.humidity,
            wind: response.wind.speed,
            uvIndex: 0,
            uvIntensity: ""
        };

        //Apply the formatDate function to the date value the object 
        currentWeatherObj.date = formatDates(currentWeatherObj.date);

        //Call to get UV index of searched city.
        var latitude = response.coord.lat;
        var longitude = response.coord.lon;
        var currentUvUrl = "https://api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&appid=" + apiKey;

        $.ajax({
            url: currentUvUrl,
            method: "GET"
        }).then(function(responseUvUrl) {

            currentWeatherObj.uvIndex = responseUvUrl.value;

            //Assigns uvIntensity based on the uvIndex number (will be used for CSS styling)
            if (currentWeatherObj.uvIndex >= 8)
                currentWeatherObj.uvIntensity = "high";
            else if (currentWeatherObj.uvIndex < 3)
                currentWeatherObj.uvIntensity = "low";
            else
                currentWeatherObj.uvIntensity = "medium";

            //Create a card containing the weather data of the last searched City.
            var currentWeatherCard = $('<div class="card"><div class="card-body"><h5 class="card-title">' + currentWeatherObj.location + ', ' + currentWeatherObj.cityCountry + ' (' + currentWeatherObj.date + ') ' +
                '<span class="badge badge-primary"><img id="weather-icon" src="http://openweathermap.org/img/wn/' + currentWeatherObj.weatherIcon + '@2x.png"></span></h5>' +
                '<p class="card-text">Current Temperature: ' + currentWeatherObj.currentTemperature + ' °C</p>' +
                '<p class="card-text">Max Temperature: ' + currentWeatherObj.maxTemperature + ' °C</p>' +
                '<p class="card-text">Min Temperature: ' + currentWeatherObj.minTemperature + ' °C</p>' +
                '<p class="card-text">Humidity: ' + currentWeatherObj.humidity + '%</p>' +
                '<p class="card-text">Wind Speed: ' + currentWeatherObj.wind + ' kmph</p>' +
                '<p class="card-text">UV Index: <span class="badge badge-secondary ' + currentWeatherObj.uvIntensity + '">' + currentWeatherObj.uvIndex + '</span>')
            $("#weather-col").append(currentWeatherCard);

            if (currentWeatherObj.weatherDescription == "Drizzle") {
                $(".card-body").attr("id", "drizzle");
            } else if (currentWeatherObj.weatherDescription == "Clear") {
                $(".card-body").attr("id", "clear");
            } else if (currentWeatherObj.weatherDescription == "Clouds") {
                $(".card-body").attr("id", "clouds");
            } else if (currentWeatherObj.weatherDescription == "Rain") {
                $(".card-body").attr("id", "rain");
            } else if (currentWeatherObj.weatherDescription == "Thunderstorm") {
                $(".card-body").attr("id", "thunderstorm");
            } else if (currentWeatherObj.weatherDescription == "Snow") {
                $(".card-body").attr("id", "snow");
            } else if (currentWeatherObj.weatherDescription == "Mist") {
                $(".card-body").attr("id", "mist");
            }
        });

        renderStoredSearches();

    });
}

function populateWeatherForecast() {

    var fiveDayForecastArray = [];

    //Five day forecast API call
    $.ajax({
        url: forecastUrl,
        method: "GET"
    }).then(function(response) {

        var temporaryForecastObj;

        //Runs the loop to populate the weather data needed to display in the card
        for (var i = 4; i < response.list.length; i += 8) {
            temporaryForecastObj = {
                date: response.list[i].dt_txt.split(" ")[0],
                weatherIcon: response.list[i].weather[0].icon,
                maxTemp: Math.round(response.list[i].main.temp_max),
                minTemp: Math.round(response.list[i].main.feels_like),
                humidity: response.list[i].main.humidity
            };
            fiveDayForecastArray.push(temporaryForecastObj);
        }

        //Apply formatDates function to the 5 day forecast array
        for (var i = 0; i < fiveDayForecastArray.length; i++) {
            fiveDayForecastArray[i].date = formatDates(fiveDayForecastArray[i].date);
        }

        //Creates HTML elements to display 5 day forcast cards
        var fiveDayForecast = $("<h5>5-Day Forecast:</h5>");
        $("#forecast-header").append(fiveDayForecast);

        for (var i = 0; i < fiveDayForecastArray.length; i++) {
            var forecastCard = $("<div class='col-lg-2 col-sm-3 mb-1'><span class='badge badge-primary'><h5>" + fiveDayForecastArray[i].date + "</h5>" +
                "<p><img class='w-100' src='http://openweathermap.org/img/wn/" + fiveDayForecastArray[i].weatherIcon + "@2x.png'></p>" +
                "<p>Max Temp: " + fiveDayForecastArray[i].maxTemp + "°C</p>" +
                "<p>Min Temp: " + fiveDayForecastArray[i].minTemp + "°C</p>" +
                "<p>Humidity: " + fiveDayForecastArray[i].humidity + "%</p>" +
                "<span></div>");
            $("#forecast-row").append(forecastCard);
        }
    });
}

function renderStoredSearches() {

    $("#search-history").empty();

    //If the search bar input is not empty, prepends the value of the input to the storedCities array
    //Check if the input is a duplicate value in the storedCities array then reposition the value to the front of the array if it is
    if ($("#search-bar").val() != "") {
        if (storedCities.indexOf($("#search-bar").val()) != -1) {
            storedCities.splice(storedCities.indexOf($("#search-bar").val()), 1)
        }
        storedCities.unshift($("#search-bar").val());
    }

    //Stores searched Cities to local storage
    localStorage.setItem("Searched Cities", storedCities);

    //Appends searched Cities on a list below the search bar
    for (var i = 0; i < storedCities.length; i++) {
        var cityList = $('<li class="list-group-item">' + storedCities[i] + '</li>');
        $("#search-history").append(cityList);
    }

    //On click event that re-displays populated searched City's weather
    $("li").on("click", function() {
        $("#search-bar").val($(event.target).text());
        searchButton.click();
    });
}

//Changes the date to dd/mm/yyyy format (Australian date format)
function formatDates(data) {
    var dateArray = data.split("-");
    var formattedDate = dateArray[2] + "/" + dateArray[1] + "/" + dateArray[0];
    return formattedDate
}

//On click event for starting the search function
searchButton.on("click", function() {
    currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + searchBar.val() + "&units=metric&appid=" + apiKey;
    forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" + searchBar.val() + "&units=metric&appid=" + apiKey;

    $("#weather-col").empty();
    $("#forecast-header").empty();
    $("#forecast-row").empty();

    populateCurrentWeather();
    populateWeatherForecast();
});

//Keypress event so that user can also press "Enter" (involuntary movement for user input) after typing in the name of the City to search for
$("#search-bar").keypress(function() {
    if (event.keyCode == 13)
        searchButton.click();
});

renderStoredSearches();