`use strict`;

require('dotenv').config();
// const PORT = 3000;
const PORT = process.env.PORT;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const app = express();

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log('PG PROBLEM!!!') );

app.use(cors());


//end points
app.get('/location',handleLocation);
app.get('/weather',handleWeather);
app.get('/Parks',handleParks);
app.get('/movies',handlemovies);
app.get('/movies',handlemovies);
app.get('/yelp',handleyelp);

app.use('*', notFoundHandler); // 404 not found url

app.use(errorHandler);

function notFoundHandler(request, response) {
  response.status(404).send('requested API is Not Found!');
}

function errorHandler(err, request, response, next) {
  response.status(500).send('something is wrong in server');
}



// let loc=[];
// let lonn=0;
// let latt=0;

// const mylocation={};

function handleLocation(request, response){
//   const getLocation =require('./data/location.json');

  const cityLocation=request.query.city;

  // let data=checkData(cityLocation);
  // console.log(checkData(cityLocation));
  // response.send(data);

  let searching=`SELECT * FROM locations WHERE search_query=$1`;
  let location=[cityLocation];

  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityLocation}&format=json&limit=1`;
  return client.query(searching,location).then(result=>{
    if(result.rowCount){
      // console.log(result.rows[0]);
      response.send(result.rows[0]);
    }else {
      superagent.get(url).then(res=>{
        const locationData = res.body[0];
        const location = new Location(cityLocation, locationData);
        let SQL=`INSERT INTO locations(search_query, formatted_query, latitude, longitude)VALUES($1,$2,$3,$4)`;
        let Values = [location.search_query, location.formatted_query, location.latitude, location.longitude];
        client.query(SQL, Values).then(result => {
          // console.log(result);
          // response.send(result.rows);
        });
        response.send(location);
      });
    }
  });

  // superagent.get(url).then(res=> {

  //   const locationData = res.body[0];

  //   const location = new Location(cityLocation, locationData);
  //   mylocation.lat=locationData.latitude;
  //   mylocation.lon=locationData.longitude;
  //   response.send(location);

  // }).catch((err)=> {
  //   console.log('ERROR IN LOCATION API');
  //   console.log(err);
  // });

}
// function checkData(city){

// }
function Location (city,data){
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
//   loc.push(this);
}

function handleWeather(request,response){
//   console.log(loc);
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  //   console.log('lat',latt);
  //   console.log('lon',lonn);
  //   console.log(request.query);
  let key = process.env.WEATHER_API_KEY;
  //   console.log(key);
  //   console.log(mylocation.lat);
  //   console.log(mylocation.lon);
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;

  superagent.get(url).then(res=> {
    let currentWeather=[];
    // console.log(res.body.data);
    res.body.data.map(element => {
      currentWeather.push(new Weather(element));
      return currentWeather;
    });
    response.send(currentWeather);
  });

  //   const getWeather=require('./data/weather.json');
  // const cityWeather=request.query.
  // console.log("cityWeather  :", cityWeather);


}
function Weather(weath){
  this.forecast=weath.weather.description;

  this.datetime=weath.valid_date;
}


function handleParks(request,response){
  let key = process.env.PARKS_API_KEY;
  let qu=request.query.search_query;
  const url = `https://developer.nps.gov/api/v1/parks?parkCode=${qu}&api_key=${key}`;
  superagent.get(url).then(data=> {

    let currentParks=[];
    let parks=data.body.data.slice(0,11);
    // console.log(parks);
    currentParks= parks.map(element=> new Parks(element));
    // console.log(currentParks);
    response.send(currentParks);
  }).catch((err)=> {
    console.log('ERROR IN Parks API');
    console.log(err);
  });

}
function Parks(data){
  this.name=data.fullName;
  this.address=Object.values(data.addresses[0]).join(',');
  this.fee =data.entranceFees[0].cost;
  this.description=data.description;
  this.url=data.url;
}

function handlemovies(request,response){
  let arrayOFMovies=[];
  let key = process.env.MOVIE_API_KEY;
  // const url=`https://api.themoviedb.org/3/movie/550?api_key=da735d1206c20c177c63a737bdb7678e`;
  // const url =`https://api.themoviedb.org/3/movie/top_rated?api_key=${key}&query=${request.query.city}`;
  const url =`https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${request.query.search_query}&language=en-US`;
  superagent.get(url).then(data=> {
    let movies=data.body.results;
    movies.forEach(element=>{
      arrayOFMovies.push(new Movies(element));
    });
    response.send(arrayOFMovies);
  }).catch((err)=> {
    console.log('ERROR IN movies API');
    console.log(err);
  });
}


function Movies(data){
  this.title=data.title;
  this.overview=data.overview;
  this.average_votes=data.vote_average;
  this.total_votes=data.vote_count;
  this.image_url=`https://image.tmdb.org/t/p/w500${data.poster_path}`;
  this.popularity=data.popularity;
  this.released_on=data.release_date;
}

function handleyelp(request,response){
  let page=request.query.page;
  console.log(page);
  console.log('handleyelp',request.query);
  let arrayOFYelp=[];
  let key = process.env.YELP_API_KEY;
  const url =`https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${request.query.latitude}&longitude=${request.query.longitude}&limit=20`;

  superagent.get(url).set('Authorization',`Bearer ${key}`).then(data=>{
    arrayOFYelp=data.body.businesses.map(element=>{return new Yelp(element);});
    // console.log(arrayOFYelp);
    response.send(arrayOFYelp.slice((page-1)*5,page*5));
  });
}
function Yelp(data){
  this.name=data.name;
  this.image_url=data.image_url;
  this.price=data.price;
  this.rating=data.rating;
  this.url=data.url;
}
client.connect().then(()=> {
  console.log('connected');
  //listener
  app.listen(PORT, ()=> console.log(`App is running on ${PORT}`));
});


