import { DateTime } from 'luxon';
import './style.css';
import './queenstown-tree.jpg';

onLoad();

async function onLoad() {
    const dummyLocation = 'Wellington';
    const dummyMeasurement = 'metric';
    const data = await getData(dummyLocation, dummyMeasurement);
    render(data);
};

async function getData(userSearch, measurement) {
    //First API call to get current weather and coordinates of user search location.
    const currentWeather = await getCurrentWeather(userSearch);

    //Second API call to get forecast, based off coords from first API call.
    const forecast = await getForecast(currentWeather.coord.lat, currentWeather.coord.lon);

    // Get time data with better accuracy.
    const dateTime = buildDateTime(forecast);

    // Build data object and return
    const data = buildData(currentWeather, forecast, dateTime, measurement);

    return data;
};

function getCurrentWeather(userSearch) {
    let url = `https://api.openweathermap.org/data/2.5/weather?q=${userSearch}&appid=924d49abcb359026c7e78a45ebe0a0d4`;
    let APIResponse = fetch(url)
    .then(function(response) {
        return response.json();
    })

    return APIResponse;
};

function getForecast(lat, lon) {
    let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly&appid=924d49abcb359026c7e78a45ebe0a0d4`;
    let APIResponse = fetch(url)
    .then(function(response) {
      return response.json();
    })

    return APIResponse;
};

function buildDateTime(forecast) {
    const dateTime = DateTime;
    dateTime.local().setZone(forecast.timezone);

    return dateTime;
};

function buildData(currentWeatherInput, forecastInput, dateTimeInput, measurementInput) {

    console.log(forecastInput.daily[0].weather.icon);

    var current = {
        conditions: currentWeatherInput.weather[0].main,
        temp_f: Math.round(convertKelvinToFahrenheit(currentWeatherInput.main.temp)),
        temp_c: Math.round(convertKelvinToCelcius(currentWeatherInput.main.temp)),
        humidity: currentWeatherInput.main.humidity,
        wind_speed_mph: Math.round(convertMpsToMph(currentWeatherInput.wind.speed)),
        wind_speed_kph: Math.round(convertMpsToKph(currentWeatherInput.wind.speed)),
        icon: currentWeatherInput.weather[0].icon
    };

    const forecastLength = forecastInput.daily.length;
    const forecast = [];
    for (let i=0; i<forecastLength; i++) {
        let dayNumber = i + 1;
        forecast[i] = {
            day: dateTimeInput.now().plus({ days: dayNumber}).toFormat('ccc'),
            icon: forecastInput.daily[i].weather[0].icon,
            high_f: Math.round(convertKelvinToFahrenheit(forecastInput.daily[i].temp.max)),
            high_c: Math.round(convertKelvinToCelcius(forecastInput.daily[i].temp.max)),
            low_f: Math.round(convertKelvinToFahrenheit(forecastInput.daily[i].temp.min)),
            low_c: Math.round(convertKelvinToCelcius(forecastInput.daily[i].temp.min))
        };
    };

    const data = {
        city: currentWeatherInput.name,
        current: current,
        forecast: forecast,
        dateTime: dateTimeInput,
        measurement: measurementInput
    };

    return data;
};

function convertKelvinToCelcius(tempK) {
    return tempK - 273.15;
};

function convertKelvinToFahrenheit(tempK) {
    return (tempK - 273.15) * 9/5 + 32 ;
};

function convertMpsToKph(mps) {
    return mps * 3.6;
};

function convertMpsToMph(mps) {
    return mps * 2.237;
};

function render(data) {
    let body = document.getElementById('body');
    body.innerHTML = '<script src="main.js"></script>';

    renderCurrentWeather(data);
    renderForecast(data);
};

function renderCurrentWeather(data) {
    // Build out div structure
    let body = document.getElementById('body');

    let divCurrentParent = document.createElement('div');
    divCurrentParent.id = 'currentParent';
    body.appendChild(divCurrentParent);
    divCurrentParent = document.getElementById('currentParent');
    
    let divCurrentDateTime = document.createElement('div');
    divCurrentDateTime.id = 'currentDateTime';
    divCurrentParent.appendChild(divCurrentDateTime);
    divCurrentDateTime = document.getElementById('currentDateTime');

    let divCurrentConditions = document.createElement('div');
    divCurrentConditions.id = 'currentConditions';
    divCurrentParent.appendChild(divCurrentConditions);
    divCurrentConditions = document.getElementById('currentConditions');

    let divCurrentHumidityWind = document.createElement('div');
    divCurrentHumidityWind.id = 'currentHumidityWind';
    divCurrentParent.appendChild(divCurrentHumidityWind);
    divCurrentHumidityWind = document.getElementById('currentHumidityWind');

    let divSearch = document.createElement('div');
    divSearch.id = 'search';
    body.appendChild(divSearch);
    divSearch = document.getElementById('search');


    // Fill divCurrentDateTime
    const cityNameElement = document.createElement('h2');
    cityNameElement.innerHTML = data.city;
    divCurrentDateTime.appendChild(cityNameElement);

    const clockElement = document.createElement('h3');
    clockElement.id = 'clock';
    clockElement.innerHTML = data.dateTime.now().toFormat("h':'mm' 'a");
    divCurrentDateTime.appendChild(clockElement);

    const clockObject = new clockUpdater();
    clockObject.start();

    const dateElement = document.createElement('h3');
    const dayOfWeek = data.dateTime.now().toFormat('EEEE');
    const dayMonthYear = data.dateTime.now().toFormat('d LLLL yyyy');
    dateElement.innerHTML = `${dayOfWeek}, ${dayMonthYear}`;
    divCurrentDateTime.appendChild(dateElement);


    // Fill divCurrentConditions
    let img = new Image;
    let imgURL = `http://openweathermap.org/img/w/${data.current.icon}.png`
    img.src = imgURL;
    divCurrentConditions.appendChild(img);

    const conditionsElement = document.createElement('P');
    conditionsElement.innerHTML = data.current.conditions;
    divCurrentConditions.appendChild(conditionsElement);

    const tempElement = document.createElement('h1');
    if (data.measurement == 'imperial') {
        tempElement.innerHTML = `${data.current.temp_f}℉`;
    }
    else if (data.measurement == 'metric') {
        tempElement.innerHTML = `${data.current.temp_c}℃`;
    }
    tempElement.id = 'tempA';
    tempElement.classList.add('convertible', 'temp', data.measurement);
    divCurrentConditions.appendChild(tempElement);

    let measurementButton = document.createElement('BUTTON');
    if(data.measurement == 'metric') {
        measurementButton.innerHTML = '℃ ◀ ℉';
    }
    else if (data.measurement == 'imperial') {
        measurementButton.innerHTML = '℃ ▶ ℉';
    }
    measurementButton.id = 'measurement';
    divCurrentConditions.appendChild(measurementButton);
    measurementButton = document.getElementById('measurement');
    measurementButton.addEventListener('click', (e) => {
        e.preventDefault();
        if(measurementButton.innerHTML == '℃ ◀ ℉') {
            measurementButton.innerHTML = '℃ ▶ ℉';
            data.measurement = 'imperial';
        }
        else if (measurementButton.innerHTML == '℃ ▶ ℉') {
            measurementButton.innerHTML = '℃ ◀ ℉';
            data.measurement = 'metric';
        }
        convertElements();
    })

    //Fill divCurrentHumidityWind
    const humidityElement = document.createElement('P');
    humidityElement.innerHTML = `Humidity: ${data.current.humidity}%`;
    divCurrentHumidityWind.appendChild(humidityElement);
    
    const windElement = document.createElement('P');
    windElement.classList.add('convertible', 'speed', data.measurement);
    windElement.id = 'wind';
    windElement.innerHTML = `Wind: ${data.current.wind_speed}`;
    if (data.measurement == 'imperial') {
        windElement.innerHTML = `Wind: ${data.current.wind_speed_mph} mph`;
    }
    else if (data.measurement == 'metric') {
        windElement.innerHTML = `Wind: ${data.current.wind_speed_kph} kph`;
    }
    divCurrentHumidityWind.appendChild(windElement);

    //Fill divSearch
    let form = document.createElement('FORM');
    form.id = 'form';
    divSearch.appendChild(form);
    form = document.getElementById('form');

    let inputField = document.createElement('INPUT');
    inputField.type = 'text';
    inputField.id = 'input';
    form.appendChild(inputField);
    inputField = document.getElementById('input');

    let submitButton = document.createElement('BUTTON');
    submitButton.id = 'submit';
    submitButton.innerHTML = 'Submit';
    form.appendChild(submitButton);
    submitButton = document.getElementById('submit');

    submitButton.addEventListener('click', (e) => submitEvent(e));

    async function submitEvent(e) {
        e.preventDefault(e);
        let input = document.getElementById('input');
        let userSearch = input.value;
        const newData = await getData(userSearch, data.measurement);
        render(newData);
    };
};

function renderForecast(data) {
    // Build out div structure
    let body = document.getElementById('body');

    //console.log('data' + data);
    //console.log('data.forecast' + data.forecast);


    let divForecastParent = document.createElement('div');
    divForecastParent.id = 'forecastParent';
    body.appendChild(divForecastParent);
    divForecastParent = document.getElementById('forecastParent');
    
    // Render each forecasted day
    let i;
    for(i = 0; i < 7; i++) {
        let divForecast = document.createElement('div');
        divForecast.id = `divForecast${[i]}`;
        let imgURL = `http://openweathermap.org/img/w/${data.forecast[i].icon}.png`;

        if (data.measurement == 'imperial') {
            let forecastTempHigh_F = data.forecast[i].high_f;
            let forecastTempLow_F = data.forecast[i].low_f;

            divForecast.innerHTML = `
            ${data.forecast[i].day}
            <img src="${imgURL}">
            <div id="temp${i}H" class="convertible temp imperial">${forecastTempHigh_F}℉</div>
            <div id="temp${i}L" class="convertible temp imperial">${forecastTempLow_F}℉</div>
            `;

            divForecastParent.appendChild(divForecast);
            divForecast = document.getElementById(`divForecast${[i]}`);
        }
        else if (data.measurement == 'metric') {
            let forecastTempHigh_C = data.forecast[i].high_c;
            let forecastTempLow_C = data.forecast[i].low_c;

            divForecast.innerHTML = `
            ${data.forecast[i].day}
            <img src="${imgURL}">
            <div id="temp${i}H" class="convertible temp metric">${forecastTempHigh_C}℃</div>
            <div id="temp${i}L" class="convertible temp metric">${forecastTempLow_C}℃</div>
            `;

            divForecastParent.appendChild(divForecast);
            divForecast = document.getElementById(`divForecast${[i]}`);
        }
    };
};

function convertElements() {
    let convertibleElements = document.getElementsByClassName('convertible');

    for (let i = 0; i < convertibleElements.length; i++) {
        conversionUtility(convertibleElements[i]);
    };
};

function conversionUtility(element) {
    if(element.classList.contains('temp')) {
        if(element.classList.contains('metric')) {
            let tempC = element.innerHTML.replace('℃', '');
            let newValue = `${Math.round((tempC * 9/5) + 32)}℉`;
            let newElement = document.getElementById(element.id);
            newElement.innerHTML = newValue;
            newElement.classList.remove('metric');
            newElement.classList.add('imperial');
        }
        else if(element.classList.contains('imperial')) {
            let tempF = element.innerHTML.replace('℉', '');
            let newValue = `${Math.round((tempF -32) * 5/9)}℃`;
            let newElement = document.getElementById(element.id);
            newElement.innerHTML = newValue;
            newElement.classList.remove('imperial');
            newElement.classList.add('metric');
        };
    }
    else if(element.classList.contains('speed')) {
        if(element.classList.contains('metric')) {
            let speedKph = element.innerHTML.replace('Wind: ', '');
            speedKph = speedKph.replace(' kph', '');
            let newValue = `Wind: ${Math.round(speedKph / 1.609344)} mph`;
            let newElement = document.getElementById(element.id);
            newElement.innerHTML = newValue;
            newElement.classList.remove('metric');
            newElement.classList.add('imperial');
        }
        else if(element.classList.contains('imperial')) {
            let speedMph = element.innerHTML.replace('Wind: ', '');
            speedMph = speedMph.replace(' mph', '');
            let newValue = `Wind: ${Math.round(speedMph * 1.609344)} kph`;
            let newElement = document.getElementById(element.id);
            newElement.innerHTML = newValue;
            newElement.classList.remove('imperial');
            newElement.classList.add('metric');
        };
    };
};

class clockUpdater {
    constructor(element) {
        this.element = element;
        this.element = DateTime.now().toFormat("h':'mm':'ss' 'a");
    };

    start() {
        this.update();

        setInterval(() => {
            this.update();
        }, 10);
    };

    update() {
        this.element = DateTime.now().toFormat("h':'mm':'ss' 'a");
        const clockElement = document.getElementById('clock');
        clockElement.innerHTML = this.element;
        const divCurrentDateTime = document.getElementById('currentDateTime');
        divCurrentDateTime.appendChild(clockElement);
    };
};


/* function buildDateTimeLegacy(timeAPI) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var timeAPI = new Date(timeAPI.datetime);

    //Question for LUKE, how can I better organise the contents of this object?
    const dateObject = {};
    dateObject.yearNumeric = timeAPI.getFullYear();
    dateObject.monthNumeric = timeAPI.getMonth();
    dateObject.dayOfMonth.Numeric = timeAPI.getDate();
    dateObject.dayOfWeekNumeric = timeAPI.getDay();
    dateObject.monthText = monthsOfYear[dateObject.monthNumeric - 1];
    dateObject.dayOfWeekText = daysOfWeek[dateObject.dayOfWeekNumeric - 1];
    dateObject.hours = timeAPI.getHours();
    dateObject.minutes = timeAPI.getMinutes();
    dateObject.seconds = timeAPI.getSeconds();

    return dateObject;
}; */

/* function buildCoord(currentWeather) {
    const coordData = {
      name: currentWeather.name,
      lat: currentWeather.coord.lat,
      lon: currentWeather.coord.lon
    };
  
    return coordData;
}; */