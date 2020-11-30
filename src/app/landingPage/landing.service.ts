import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { retry, catchError } from 'rxjs/operators';
import { throwError, from, Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private locations = [];
  private trainData = [];
  private covidData = [];

  constructor(private httpClient: HttpClient) { }
  
  getLocations(){
     return this.httpClient.get('/api/myTravel/locations/stations');
  }

  fetchAttractionSpots(destination: string) {
    let api = '/api/myTravel/locations/attractionspots?';
     api = api +  'city=' + destination;
     return this.httpClient.get(api);
      
  }

  fetchTrainData(origin: string,destination: string,travelDate: string, originType: string,destType: string) {
      let api = '/api/myTravel/locations/stations/trains?';
      api = api + 'origin=' + origin + '&originType=' + originType + '&destination=' + destination + 
      '&destType=' + destType + '&travelDate=' + travelDate;
      return this.httpClient.get(api);
  }

  fetchWeatherDetails(location: any, date: any) {
    let api = '/api/myTravel/locations/forecast?';
    api = api + 'city=' + location + '&date=' + date;
    return this.httpClient.get(api);
  }

  fetchCovidData(){
    return this.httpClient.get('/api/myTravel/locations/covid/areaname');
  }
}



