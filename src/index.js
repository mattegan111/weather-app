import { DateTime } from 'luxon';
import './style.css';
import './beach.jpg';
import './desert.jpg';
import './island.jpg';
let countryFormats = require('i18n-iso-countries');
countryFormats.registerLocale(require('i18n-iso-countries/langs/en.json'));
let stateFormats = require('us-state-codes');

onLoad();

async function onLoad() {
    const defaultLocation = 
    {
        city: 'Wellington',
        state: '',
        country: 'New Zealand'
    };
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
    const data = buildData(userSearch, currentWeather, forecast, dateTime, measurement);

    return data;
};

function formatSearch(userSearch) {
    let userSearchFormatted = '';

    if(userSearch.city != '') { userSearchFormatted += `${userSearch.city},`; }

    if(userSearch.state != '') { 
        userSearch.state = stateFormats.getStateCodeByStateName(userSearch.state);
        userSearchFormatted += `${userSearch.state},`; 
    }

    if(userSearch.country != '') { 
        userSearch.country = countryFormats.getAlpha2Code(userSearch.country, 'en');
        userSearchFormatted += userSearch.country; 
    }

    if(userSearchFormatted.slice(-1) === ',') { 
        userSearchFormatted = userSearchFormatted.substring(0, userSearchFormatted.length - 1);
    }

    return userSearchFormatted
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

function buildData(userSearch, currentWeatherInput, forecastInput, dateTimeInput, measurementInput) {
    const current = {
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
        state: stateFormats.getStateNameByStateCode(userSearch.state),
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
    body.classList.add('background-island');
}

function renderLocationDateTime(data){
    // Build out div structure

    let divMainPanel = document.getElementById('mainPanel');

    const locationElement = document.createElement('h1');
    if (data.state) {
        locationElement.innerHTML = `Weather in ${data.city}, ${data.state}, ${data.country}`;
    } 
    else {
        locationElement.innerHTML = `Weather in ${data.city}, ${data.country}`;
    }
    divMainPanel.appendChild(locationElement);

    let divCurrentDateTime = document.getElementById('currentDateTime');

    // Fill divCurrentDateTime

    let clockContainer = document.createElement('div');
    clockContainer.id = 'clockContainer';
    divCurrentDateTime.appendChild(clockContainer);
    clockContainer = document.getElementById('clockContainer');

    const clockElement = document.createElement('h2');
    clockElement.id = 'clock';
    clockElement.dataset.timezone = data.timezone;
    clockElement.innerHTML = data.dateTime.now().setZone(data.forecast.timezone).toFormat("h':'mm':'ss' 'a");
    clockContainer.appendChild(clockElement);

    const dateElement = document.createElement('h2');
    dateElement.id = 'date';
    const dayOfWeek = data.dateTime.now().setZone(data.timezone).toFormat('EEEE');
    const dayMonthYear = data.dateTime.now().setZone(data.timezone).toFormat('d LLLL yyyy');
    dateElement.innerHTML = `${dayOfWeek}, ${dayMonthYear}`;
    divCurrentDateTime.appendChild(dateElement);


}

function renderCurrentWeather(data) {
    // Build out div structure

    let divCurrentWeather = document.getElementById('currentWeather');

    let divCurrentConditions = document.createElement('div');
    divCurrentConditions.id = 'currentConditions';
    divCurrentWeather.appendChild(divCurrentConditions);
    divCurrentConditions = document.getElementById('currentConditions');

    let currentTemp = document.createElement('div');
    currentTemp.id = 'currentTemp';
    divCurrentConditions.appendChild(currentTemp);
    currentTemp = document.getElementById('currentTemp');

    let currentDetail = document.createElement('div');
    currentDetail.id = 'currentDetail';
    divCurrentConditions.appendChild(currentDetail);
    currentDetail = document.getElementById('currentDetail');

    let divUserInputs = document.createElement('div');
    divUserInputs.id = 'userInputs';
    divCurrentWeather.appendChild(divUserInputs);
    divUserInputs = document.getElementById('userInputs');

    // Fill divCurrentConditions
    const tempElement = document.createElement('h1');
    if (data.measurement == 'imperial') {
        tempElement.innerHTML = `${data.current.temp_f}<span>℉</span>`;
    }
    else if (data.measurement == 'metric') {
        tempElement.innerHTML = `${data.current.temp_c}<span>℃</span>`;
    }
    tempElement.id = 'tempA';
    tempElement.classList.add('convertible', 'temp', data.measurement);
    currentTemp.appendChild(tempElement);

    let measurementButton = document.createElement('BUTTON');
    if(data.measurement == 'metric') {
        measurementButton.innerHTML = '℃ ◀ ℉';
    }
    else if (data.measurement == 'imperial') {
        measurementButton.innerHTML = '℃ ▶ ℉';
    }

    measurementButton.id = 'measurement';
    currentTemp.appendChild(measurementButton);
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
    });

    let img = new Image;
    let imgURL = `http://openweathermap.org/img/w/${data.current.icon}.png`
    img.src = imgURL;
    currentDetail.appendChild(img);

    const conditionsElement = document.createElement('P');
    conditionsElement.innerHTML = `Conditions: ${data.current.conditions}`;
    currentDetail.appendChild(conditionsElement);

    const humidityElement = document.createElement('P');
    humidityElement.innerHTML = `Humidity: ${data.current.humidity}%`;
    currentDetail.appendChild(humidityElement);
    
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
    currentDetail.appendChild(windElement);

    //Fill divUserInputs
    let inputInstructions = document.createElement('p');
    inputInstructions.innerHTML = 'Search:';
    inputInstructions.id = 'inputInstructions';
    divUserInputs.appendChild(inputInstructions);

    let form = document.createElement('FORM');
    form.id = 'form';
    divUserInputs.appendChild(form);
    form = document.getElementById('form');

    let cityInputField = document.createElement('INPUT');
    cityInputField.type = 'text';
    cityInputField.id = 'city-input';
    cityInputField.required = true;
    cityInputField.placeholder = 'City';
    form.appendChild(cityInputField);
    cityInputField = document.getElementById('input');

    let stateInputField = document.createElement('INPUT');
    stateInputField.type = 'text';
    stateInputField.id = 'state-input';
    stateInputField.placeholder = 'State ';
    form.appendChild(stateInputField);
    stateInputField = document.getElementById('input');

    let countryInputField = document.createElement('INPUT');
    countryInputField.type = 'text';
    countryInputField.id = 'country-input';
    countryInputField.placeholder = 'Country';
    form.appendChild(countryInputField);
    countryInputField = document.getElementById('input');

    let lineBreak = document.createElement('br');
    form.appendChild(lineBreak);

    let submitButton = document.createElement('BUTTON');
    submitButton.id = 'submit';
    submitButton.innerHTML = 'Search';
    form.appendChild(submitButton);
    submitButton = document.getElementById('submit');

    submitButton.addEventListener('click', (e) => submitEvent(e));

    async function submitEvent(e) {
        e.preventDefault(e);
        let userSearch = 
        {
            city: '',
            state: '',
            country: ''
        };

        userSearch.city = document.getElementById('city-input').value;
        userSearch.state = document.getElementById('state-input').value;
        userSearch.country = document.getElementById('country-input').value;

        const newData = await getData(userSearch, data.measurement);
        render(newData);
    };
};

function renderForecast(data) {
    // Build out div structure

    let divForecastParent = document.getElementById('forecastParent');

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
            <div id="temp${i}H" class="convertible temp metric">${forecastTempHigh_C}<span>℃</span></div>
            <div id="temp${i}L" class="convertible temp metric">${forecastTempLow_C}<span>℃</span></div>
            `;

            divForecastWeather.appendChild(divForecastDay);
        }
    };
};

function renderChangeBackgroundSelect() {
    let body = document.getElementById('body');

    let changeBackgroundSelect = document.getElementById('backgroundSelect');

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
            let tempC = element.innerHTML.replace('<span>℃</span>', '');
            let newValue = `${Math.round((tempC * 9/5) + 32)}<span>℉</span>`;
            let newElement = document.getElementById(element.id);
            newElement.innerHTML = newValue;
            newElement.classList.remove('metric');
            newElement.classList.add('imperial');
        }
        else if(element.classList.contains('imperial')) {
            let tempF = element.innerHTML.replace('<span>℉</span>', '');
            let newValue = `${Math.round((tempF -32) * 5/9)}<span>℃</span>`;
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
            const clockContainer = document.getElementById('clockContainer');
            clockContainer.appendChild(clockElement);
        }
        else {
            console.log('time failed to update');
        }
    };
};
