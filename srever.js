`use strict`

const PORT = 3000;

const express = require('express');
const cors = require('cors'); 


const app = express(); 

app.use(cors());

app.get('/location',handleLocation);
// app.get('/weather',handleWeather);


function handleLocation(request, response){
    const getLocation =require('data/location.json');
    const cityLocation=request.query.city
    console.log("city  :", cityLocation)

    let location =new Location(cityLocation,getLocation)
  
    response.send(location);
}

function Location (city,data){
    this.search_query = city;
    this.formatted_query = data[0].display_name;
    this.latitude = data[0].lat;
    this.longitude = data[0].lon;

}


// function handleWeather(request,response){
//     const getWeather=require('data/weather.json');
//     const cityWeather=request.query.
//     console.log("cityWeather  :", cityWeather);

//     let currentWeather=

// }