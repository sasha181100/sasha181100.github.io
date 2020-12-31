
const apiKey = "1aa2ca2ade9de36cbc0db0a0fdb556f6";
const url_pref = "https://api.openweathermap.org/data/2.5/weather?";
const city = "Novosibirsk";

async function download(pos) {
    let crd = pos.coords;
    const url = url_pref + "lat=" + crd.latitude + "&lon=" + crd.longitude + "&apiKey=" + apiKey
    await set_header_info(url)
}

async function def(err) {
    const url = url_pref + "q=" + city + "&apiKey=" + apiKey
    await set_header_info(url)
}

async function updateLocation() {
    navigator.geolocation.getCurrentPosition(download, def);
    await updateCitiesFromLocalStorage();
}


function printErr(...args) {
    alert("Ошибка при получении данных о городе, " + args)
}

function getKthChild(html, path) {
    if (path.length !== 0) {
        let v = path.pop();
    	return getKthChild(html, path).children[v];
    }
    return html;
}

async function get_json_data(url) {
    return await fetch(url).then(response => {
        return response.json();
    }, err => printErr(err)).catch(printErr);
}

function set_details(details, data) {
    getKthChild(details, [0, 1]).innerHTML = data.wind.speed + "m/s, " + data.wind.deg + "°";
    getKthChild(details, [1, 1]).innerHTML = data.clouds.all + "%";
    getKthChild(details, [2, 1]).innerHTML = data.main.pressure + " hpa";
    getKthChild(details, [3, 1]).innerHTML = data.main.humidity + "%";
    getKthChild(details, [4, 1]).innerHTML = "[" + data.coord.lat + ", " + data.coord.lon + "]";
}

async function set_header_info(url) {
    const loading = document.getElementById("header-loading");
    const info = document.getElementById("header-info");
    const details = document.getElementById("header-details");

    loading.style.display = "grid";
    info.style.display = details.style.display = "none";

    url = url + "&units=metric";
    const data = await get_json_data(url);
    getKthChild(info, [0]).innerHTML = data.name;
    getKthChild(info, [1, 0]).src = "https://openweathermap.org/img/wn/" + data.weather[0].icon + ".png";
    getKthChild(info, [1, 1]).innerHTML = Math.round(data.main.temp).toString() + "°C";

    set_details(details, data);

    loading.style.display = "none";
    info.style.display = details.style.display = "";
}

async function updateCitiesFromLocalStorage() {
    const cityNames = Array.from(document.getElementsByClassName("cities")[0].children);
    const screen_cities = [];
    cityNames.forEach(elem => screen_cities.push(elem.querySelector(".information h3").innerHTML));

    let cities = [];
    if (localStorage.getItem("cities") !== null) {
        cities = localStorage.getItem("cities").split(',');
    }

    for (const city of cities) {
        if (city !== "" && !screen_cities.includes(city)) {
            const genID = Math.random().toString();
            const code = await updateHTML(city, genID);
            if (code === 1) {
                document.getElementById(genID).remove();
            }
        }
    }
    cities = cities.concat(screen_cities);
    cities = cities.filter((city, pos) => cities.indexOf(city) === pos)
    localStorage.setItem("cities", cities.toString());
}

async function updateHTML(city, genID) {
    const t = document.getElementsByTagName("template")[0];
    const clone = t.content.cloneNode(true);
    clone.children[0].id = genID;
    const clone_info = clone.querySelector(".information");
    clone_info.children[0].innerHTML = city;
    clone_info.children[2].innerHTML = " downloading...";
    clone.querySelector(".loading").style.display = "grid";
    clone.querySelector(".details").style.display = "none";

    const ul = document.getElementsByClassName("cities")[0];
    await ul.insertBefore(clone, ul.childNodes[0]);

    const url = url_pref + "q=" + city + "&apiKey=" + apiKey + "&units=metric";
    const data = await get_json_data(url);

    if (data.cod !== 200) {
        return 1;
    }

    const cityElem = document.getElementById(genID);
    const info_info = cityElem.querySelector(".information");
    getKthChild(info_info, [1]).src = "https://openweathermap.org/img/wn/" + data.weather[0].icon + ".png";
    getKthChild(info_info, [2]).innerHTML = Math.round(data.main.temp) + "°C";

    const details = cityElem.querySelector(".details");
    set_details(details, data);

    cityElem.querySelector(".loading").style.display = "none";
    details.style.display = "";

    return 0;
}

const format = str => {
	str = str.toLowerCase();
    return str.replace(/(^|\s)\S/g, function(a) {return a.toUpperCase()});

}

async function addNewCity(event) {
    const genID = Math.random().toString();
    const city = format(event.target.children[0].value);

    let cities = [];
    if (localStorage.getItem("cities") !== null) {
        cities = localStorage.getItem("cities").split(',');
    }
    if (cities.includes(city)) {
        alert("Город '" + city + "' уже находится в списке");
        return
    }

    const code = await updateHTML(city, genID);
    if (code === 0) {
        cities.push(city);
        localStorage.setItem("cities", cities.toString());
    } else {
        alert("Не удаётся найти город '" + city + "'");
        document.getElementById(genID).remove();
    }
}

const removeCity = object => {
    const genID = object.parentElement.parentElement.id;
    const this_city = object.parentElement.querySelector(".information h3").innerHTML;

    document.getElementById(genID).remove();

    let cities = [];
    if (localStorage.getItem("cities") !== null) {
        cities = localStorage.getItem("cities").split(',');
    }
    cities = cities.filter(city => this_city !== city);
    localStorage.setItem("cities", cities.toString())
}
async function start() {
	//localStorage.setItem("cities", []);
    await updateLocation();
    document.getElementById("form").addEventListener("submit", async event => {
        event.preventDefault();
        await addNewCity(event);
        event.target.children[0].value = "";
    });
}

window.onload = start;