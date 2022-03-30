import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import * as VueGoogleMaps from "vue2-google-maps" //package for Maps




Vue.config.productionTip = false


Vue.use(VueGoogleMaps,{
  load: {
    key: "AIzaSyCFDAxukgIBt1uwkldvy7SMoR4efg6jMxk",
    libraries: "places,drawing,visualization"
  }
});

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
