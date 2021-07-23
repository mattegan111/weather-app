import { DateTime } from 'luxon';
import './style.css';
import './beach.jpg';
import './desert.jpg';
import './island.jpg';
var countryFormats = require("i18n-iso-countries");
countryFormats.registerLocale(require("i18n-iso-countries/langs/en.json"));

onLoad();

async function onLoad() {
    const defaultLocation = 'Wellington, New Zealand';
    const defaultMeasurement = 'metric';
    const data = await getData(defaultLocation, defaultMeasurement);
    render(data);
    instantiateClockUpdater();
};

async function getData(userSearch, measurement) {
    //Encode country name in userSearch to ISO code
    const formattedUserSearch = formatSearch(userSearch);

    //First API call to get current weather and coordinates of userSearch location.
    const currentWeather = await getCurrentWeather(formattedUserSearch);

    //Second API call to get forecast, based off coords from first API call.
    const forecast = await getForecast(currentWeather.coord.lat, currentWeather.coord.lon);

    // Get more accurate time data.
    const dateTime = DateTime;

    // Build data object and return
    const data = buildData(currentWeather, forecast, dateTime, measurement);

    return data;
};

function formatSearch(userSearch) {
    userSearch = userSearch.trim();

    if(userSearch.includes(',')) {
        let userSearchSplit = userSearch.split(',');

        userSearchSplit[userSearchSplit.length - 1] 
        = countryFormats.getAlpha2Code(userSearchSplit[userSearchSplit.length - 1].trim(), "en");
    
        return userSearchSplit.toString();
    }
    else if(userSearch.includes(' ') == true){
        let userSearchSplit = userSearch.split(' ');

        userSearchSplit[userSearchSplit.length - 1] 
        = countryFormats.getAlpha2Code(userSearchSplit[userSearchSplit.length - 1].trim(), "en");
    
        return userSearchSplit.toString();
    }
    else {
        return userSearch;
    }
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

function buildData(currentWeatherInput, forecastInput, dateTimeInput, measurementInput) {
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
            day: dateTimeInput.now().setZone(forecastInput.timezone).plus({ days: dayNumber}).toFormat('ccc'),
            icon: forecastInput.daily[i].weather[0].icon,
            high_f: Math.round(convertKelvinToFahrenheit(forecastInput.daily[i].temp.max)),
            high_c: Math.round(convertKelvinToCelcius(forecastInput.daily[i].temp.max)),
            low_f: Math.round(convertKelvinToFahrenheit(forecastInput.daily[i].temp.min)),
            low_c: Math.round(convertKelvinToCelcius(forecastInput.daily[i].temp.min))
        };
    };

    const data = {
        city: currentWeatherInput.name,
        country: countryFormats.getName(currentWeatherInput.sys.country, "en", {select: "official"}),
        current: current,
        forecast: forecast,
        dateTime: dateTimeInput,
        timezone: forecastInput.timezone,
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
    renderBody();
    renderLocationDateTime(data);
    renderCurrentWeather(data);
    renderForecast(data);
    renderChangeBackgroundSelect();
};

function renderBody() {
    let body = document.getElementById('body');
    body.innerHTML = '<script src="main.js"></script>';
    body.classList.add('background-island');
}

function renderLocationDateTime(data){
    // Build out div structure
    let body = document.getElementById('body');

    let divLocationDateTimeParent = document.createElement('div');
    divLocationDateTimeParent.id = 'locationDateTimeParent';
    body.appendChild(divLocationDateTimeParent);
    divLocationDateTimeParent = document.getElementById('locationDateTimeParent');
    
    let divCurrentDateTime = document.createElement('div');
    divCurrentDateTime.id = 'currentDateTime';
    divLocationDateTimeParent.appendChild(divCurrentDateTime);
    divCurrentDateTime = document.getElementById('currentDateTime');

    // Fill divCurrentDateTime
    const locationElement = document.createElement('h2');
    locationElement.innerHTML = `${data.city}, ${data.country}`;
    divCurrentDateTime.appendChild(locationElement);

    const dateElement = document.createElement('h3');
    const dayOfWeek = data.dateTime.now().setZone(data.timezone).toFormat('EEEE');
    const dayMonthYear = data.dateTime.now().setZone(data.timezone).toFormat('d LLLL yyyy');
    dateElement.innerHTML = `${dayOfWeek}, ${dayMonthYear}`;
    divCurrentDateTime.appendChild(dateElement);

    const clockElement = document.createElement('h3');
    clockElement.id = 'clock';
    clockElement.dataset.timezone = data.timezone;
    clockElement.innerHTML = data.dateTime.now().setZone(data.forecast.timezone).toFormat("h':'mm':'ss' 'a");
    divCurrentDateTime.appendChild(clockElement);
}

function renderCurrentWeather(data) {
    // Build out div structure

    let body = document.getElementById('body');

    let divCurrentParent = document.createElement('div');
    divCurrentParent.id = 'currentParent';
    body.appendChild(divCurrentParent);
    divCurrentParent = document.getElementById('currentParent');

    let divCurrentWeather = document.createElement('div');
    divCurrentWeather.id = 'currentWeather';
    divCurrentParent.appendChild(divCurrentWeather);
    divCurrentWeather = document.getElementById('currentWeather');

    let divCurrentConditions = document.createElement('div');
    divCurrentConditions.id = 'currentConditions';
    divCurrentWeather.appendChild(divCurrentConditions);
    divCurrentConditions = document.getElementById('currentConditions');

    let divUserInputs = document.createElement('div');
    divUserInputs.id = 'userInputs';
    divCurrentWeather.appendChild(divUserInputs);
    divUserInputs = document.getElementById('userInputs');

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

    const humidityElement = document.createElement('P');
    humidityElement.innerHTML = `Humidity: ${data.current.humidity}%`;
    divCurrentConditions.appendChild(humidityElement);
    
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
    divCurrentConditions.appendChild(windElement);

    //Fill divUserInputs
    let form = document.createElement('FORM');
    form.id = 'form';
    divUserInputs.appendChild(form);
    form = document.getElementById('form');

    let inputField = document.createElement('INPUT');
    inputField.type = 'text';
    inputField.id = 'input';
    inputField.placeholder = 'Wellington, New Zealand';
    form.appendChild(inputField);
    inputField = document.getElementById('input');

    let submitButton = document.createElement('BUTTON');
    submitButton.id = 'submit';
    submitButton.innerHTML = 'Search';
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

    let inputInstructions = document.createElement('p');
    inputInstructions.innerHTML = 'Enter your city and your country seperated by a comma.';
    inputInstructions.id = 'inputInstructions';
    divUserInputs.appendChild(inputInstructions);
};

function renderForecast(data) {
    // Build out div structure
    let body = document.getElementById('body');

    let divForecastParent = document.createElement('div');
    divForecastParent.id = 'forecastParent';
    body.appendChild(divForecastParent);
    divForecastParent = document.getElementById('forecastParent');

    let divForecastWeather = document.createElement('div');
    divForecastWeather.id = 'forecastWeather';
    divForecastParent.appendChild(divForecastWeather);
    divForecastWeather = document.getElementById('forecastWeather');
    
    // Render each forecasted day
    let i;
    for(i = 0; i < 7; i++) {
        let divForecastDay = document.createElement('div');
        divForecastDay.id = `divForecastDay${[i]}`;
        let imgURL = `http://openweathermap.org/img/w/${data.forecast[i].icon}.png`;

        if (data.measurement == 'imperial') {
            let forecastTempHigh_F = data.forecast[i].high_f;
            let forecastTempLow_F = data.forecast[i].low_f;

            divForecastDay.innerHTML = `
            ${data.forecast[i].day}
            <img src="${imgURL}">
            <div id="temp${i}H" class="convertible temp imperial">${forecastTempHigh_F}℉</div>
            <div id="temp${i}L" class="convertible temp imperial">${forecastTempLow_F}℉</div>
            `;

            divForecastWeather.appendChild(divForecastDay);
        }
        else if (data.measurement == 'metric') {
            let forecastTempHigh_C = data.forecast[i].high_c;
            let forecastTempLow_C = data.forecast[i].low_c;

            divForecastDay.innerHTML = `
            ${data.forecast[i].day}
            <img src="${imgURL}">
            <div id="temp${i}H" class="convertible temp metric">${forecastTempHigh_C}℃</div>
            <div id="temp${i}L" class="convertible temp metric">${forecastTempLow_C}℃</div>
            `;

            divForecastWeather.appendChild(divForecastDay);
        }
    };
};

function renderChangeBackgroundSelect() {
    let body = document.getElementById('body');

    let divBackgroundSelectParent = document.createElement('div');
    divBackgroundSelectParent.id = 'backgroundSelectParent'
    body.appendChild(divBackgroundSelectParent);
    divBackgroundSelectParent = document.getElementById('backgroundSelectParent');

    let changeBackgroundSelect = document.createElement('SELECT');
    changeBackgroundSelect.id = 'backgroundSelect';
    divBackgroundSelectParent.appendChild(changeBackgroundSelect);
    changeBackgroundSelect = document.getElementById('backgroundSelect');

    let backgroundNames = ['Island', 'Desert', 'Beach'];

    backgroundNames.forEach(backgroundName => {
        let item = document.createElement('OPTION');
        item.value = backgroundName.toLowerCase();
        item.innerHTML = backgroundName;
        changeBackgroundSelect.appendChild(item);
    })

    changeBackgroundSelect.addEventListener('change', (e) => {
        e.preventDefault();
        switch (changeBackgroundSelect.value) {
            case 'beach':
              body.className = '';
              body.classList.add("background-beach");
              break;
            case 'desert':
                body.className = '';
                body.classList.add("background-desert");
              break;
            case 'island':
                body.className = '';
                body.classList.add("background-island");
        }
    })
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

function instantiateClockUpdater() {
    const clockUpdaterInstance = new clockUpdater();
    clockUpdaterInstance.start();
};

class clockUpdater {
    start() {
        this.update();

        setInterval(() => {
            this.update();
        }, 500);
    };

    update() {
        let timezone = document.getElementById('clock').dataset.timezone;

        if(timezone !== undefined && timezone !== null) {
            let time = DateTime.now().setZone(timezone).toFormat("h':'mm':'ss' 'a");
            const clockElement = document.getElementById('clock');
            clockElement.innerHTML = time;
            const divCurrentDateTime = document.getElementById('currentDateTime');
            divCurrentDateTime.appendChild(clockElement);
        }
        else {
            console.log('time failed to update');
        }
    };
};
