<template>
  <v-app>
    <v-app-bar app color="teal lighten-3">

      <h2 >Places bounds</h2>
    </v-app-bar>

    <v-main>

      <v-container fluid>

        <v-row justify="center" >
          <v-col
              cols="12"
              sm="6"

          >

            <v-combobox
                label="Enter location "
                :rules="rules"
                v-model="currentLocation"
                prepend-inner-icon="mdi-map-marker"
                outlined
                :items="savedLocations"
                ref="myComboBox"
                v-on:keyup.enter="save"
                :menu-props="{ minWidth: '350', maxHeight: '400' }"
            >

            </v-combobox>
          </v-col>
        </v-row>


        <v-row>
          <v-col
              cols="12"
              sm="12"
              justify="space-around">
            <v-alert

                prominent
                type="error"
                v-model="notFound"
            >
              The place you try to find doesn't exist or it is bad written. Check again
            </v-alert>
            <v-alert

                dense
                dark
                type="warning"
                v-model="warning"
            >
              The place/city you searched doesn't have any earthquakes registered
            </v-alert>
            <v-alert
                outlined
                type="success"
                v-model="found"
            >
              Earthquake(s) found
            </v-alert>

          </v-col>

        </v-row>


        <!--Where Google Map is displayed-->
        <v-container fluid class="grey lighten-5" style="align-content: center">
          <gmap-map
              :zoom="10"
              :center="center"
              style="width:100%;  height: 500px;
              margin-top:60px;"
          >
            <gmap-rectangle
                :bounds="bounds"
                :options="options"
            ></gmap-rectangle>
            <gmap-marker
                :key="index"
                v-for="(m, index) in resultEQ"
                :position="{lat: m.lat, lng: m.lng}"
                :icon="m.icon"
                @click="openMarker(m.id)"
                :clickable="true"


            >

              <gmap-info-window
                  v-if="!m.place"
                  :closeclick="true"
                  :opened="openedMarkerID === m.id"
                  @closeclick="openMarker(null)">
                <div>
                  <strong>Date-Time: </strong> {{m.datetime}}<br>
                  <strong> Depth: </strong>  {{m.depth}}<br>
                  <strong> Eqid: </strong>  {{m.eqid}}<br>
                  <strong> Latitude: </strong> {{m.lat}}<br>
                  <strong>  Magnitude: </strong> {{m.magnitude}}<br>
                  <strong> Src: </strong>  {{m.src}}<br>
                </div>
              </gmap-info-window>
            </gmap-marker>

          </gmap-map>
        </v-container>
      </v-container>

    </v-main>


    <div>

    </div>





  </v-app>

</template>

<script>
import axios from 'axios';


const googleMapsApiKey ='AIzaSyCFDAxukgIBt1uwkldvy7SMoR4efg6jMxk'
const usernameEarthquakes = 'daniel811815'


const today = new Date();
const date = (today.getFullYear()-1)+'-'+(today.getMonth()+1)+'-'+today.getDate();


export default {
  name: "MainPage",
  data: function () {
    return {
      center: {
        lat:40.7306,
        lng:-73.935242
      },
      bounds:{
        north: 0,
        east:  0,
        south: 0,
        west:  0

      },options:{
        strokeColor: "#32CD32",
        strokeOpacity: 0.8,
        strokeWeight: 1.8,
        fillColor: "#32CD32",
        fillOpacity: 0.25,
      },
      savedLocations: ['Mexico City','Santiago de Chile'],
      currentLocation: '',
      resultEQ:[],
      infoWinOpen: false,
      openedMarkerID: null,
      earthquakesLargest:[],
      warning:false,
      notFound:false,
      found:false,
      rules: [
        value => !!value || 'Required.'
      ]

    }

  },
  methods:{
    openMarker(id) {
      this.openedMarkerID = id
    },
    async getLangLong() {
      //Reseting values in other searches
      this.notFound = false;
      this.found = false;
      this.warning= false;
      //Getting the coordinates of the place searched
      try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${this.currentLocation}&key=${googleMapsApiKey}`
        )
        if(response.data.results[0].geometry.bounds!=null){
          this.result = response.data.results[0].geometry.bounds
        }else{
          this.result = response.data.results[0].geometry.viewport
        }
        console.log(this.savedLocations)


        //Moving to new location on Google Maps
        this.setCenter(response.data.results[0].geometry.location)

        //Setting bound
        this.setBounds(this.result)

        //Getting Earthquakes data with bounds data

      } catch (e) {
        this.notFound = true;
        this.errors.push(e)
      }
    },
    addLocationMarker() {

      //Marking locations that were found
      if (this.existingPlace) {
        const marker = {
          lat: this.existingPlace.geometry.location.lat(),
          lng: this.existingPlace.geometry.location.lng()
        };

        this.locationMarkers.push({ position: marker });
        this.locPlaces.push(this.existingPlace);
        //moving to the place
        this.center = marker;
        //resetting
        this.existingPlace = null;
      }
    },
    setBounds(b){
      //Giving bound to cuadriculate the area

      this.bounds.north=b.northeast.lat
      this.bounds.east=b.northeast.lng
      this.bounds.south=b.southwest.lat
      this.bounds.west=b.southwest.lng
    },
    setCenter(response){

      //Setting center of new place
      this.center.lat =response.lat;
      this.center.lng=response.lng;

      //making it a marker but of the place
      this.resultEQ.push({'lat':this.center.lat,'lng': this.center.lng,'place':true})


    },
    save(){
      //Saving places to keep a history of the searches that were made
      this.$refs["myComboBox"].blur();
      this.$nextTick(() => {
        //Calling functions to get long and lang
        console.log(this.currentLocation);
        this.getLangLong();
        //pushing new search to local memory
        this.savedLocations.push(this.currentLocation)
        //Finding earthquakes nearby
        this.findLargestEarthquakes()
        //setting it to null
        this.resultEQ=[]

      });
    },

    findLargestEarthquakes: async function () {

      //Giving as parameters all the world for finding Largest Earthquakes
      const response = await axios.get(
              ` http://api.geonames.org/earthquakesJSON?north=90&south=-90&east=180&west=-180&date=${date}&maxRows=350&username=${usernameEarthquakes}`
          )
      ;
      //And we take only the first 10 earthquakes
      for (let i = 0; i < 10; i++) {
        //Push
        this.earthquakesLargest.push(response.data.earthquakes[i])
      }

    }

  },

  mounted() {
    //Saving searches in local memory
    this.savedLocations = JSON.parse(localStorage.getItem("savedLocations")) || []
  },
  beforeMount: function () {
    //loading data about largest earthquakes
    if (this.earthquakesLargest.length==0) {
      this.findLargestEarthquakes();
      console.log(this.earthquakesLargest)
    }


  },
  watch:{
    //Keeping new search on local storage
    savedLocations(newValue) {
      localStorage.setItem("savedLocations", JSON.stringify(newValue));
    },



  }
}
</script>

<style scoped>

</style>
