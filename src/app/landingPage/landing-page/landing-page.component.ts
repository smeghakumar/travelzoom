import { Component, OnInit, forwardRef } from '@angular/core';
import { LandingService } from '../landing.service';
import {Observable} from 'rxjs';
import {NgbTypeaheadConfig} from '@ng-bootstrap/ng-bootstrap';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import { ValueConverter } from '@angular/compiler/src/render3/view/template';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  providers: [LandingService, NgbTypeaheadConfig]
})
export class LandingPageComponent implements OnInit {
  title = 'travelApp';
  landingPageService=null;
  public locations = []
  public trainData = []
  public covidData = []
  public showWeatherAndCovidData = false;
  public subscribeTrainText = "Subscribe Trains";
  public weatherDetails:any;
  public isCollapsed = false;
  public originModel: any;
  public destinationModel: any;
  public originPostCodeModel:any;
  public destinationPostCodeModel: any;
  public validationMessage: string;
  public postCodes: string[] = [];
  public noTrainData = true;
  public restaurants: any[] = [];
  public supermarkets: any[] = [];
  public tourism: any[] = [];

  constructor(landingService: LandingService, config: NgbTypeaheadConfig, private toastr: ToastrService) { 
    this.landingPageService = landingService;
    this.isCollapsed = false;
    config.showHint = true;
  }

  locationSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.locations.filter(location => {
          if(location.stationCode.toLowerCase().indexOf(term.toLocaleLowerCase()) !== -1
           ||  location.stationName.toLowerCase().indexOf(term.toLocaleLowerCase()) !== -1){
            return true;
          }
          return false;
        }).splice(0, 10))
    )

    postalCodeSearch= (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.postCodes.filter(post => {
          if(post.toLowerCase().indexOf(term.toLocaleLowerCase()) !== -1){
            return true;
          }
          return false;
        }).splice(0, 10))
    )

    formatter = (value: any) => value.stationCode + ' - ' + value.stationName;
    inputFormatter = (value: any) => value.stationCode + ' - ' + value.stationName;
    
    postCodeformatter = (value: any) => value
    inputPostCodeFormatter = (value: any) => value

    
    public barChartOptions: ChartOptions = {
      responsive: true,
    };
    public barChartLabels: Label[] = [];
    public barChartType: ChartType = 'bar';
    public barChartLegend = true;
    public barChartPlugins = [];
    
  
    public barChartData: ChartDataSets[] = [];
    
    ngOnInit() {
    const self = this;
      this.landingPageService.getLocations().subscribe(data => {
           this.locations = data,
           data.forEach(element => {
            element.postCode.forEach(post =>{
              self.postCodes.push(post);
            });         
           });
        },
        
        error => console.log('Exception while fetching locations: ', error)
      );

      this.barChartLabels = [];
      this.barChartData = [];
      this.landingPageService.fetchCovidData().subscribe(data => {
         this.covidData = data;
         let areaNames =  [];
         let cases = [];

         data.forEach(covid => {
          areaNames.push(covid.areaName);
          cases.push(covid.cumulative);
         });
        
         this.barChartLabels = areaNames;
         this.barChartData = [
          { data: cases, label: 'Total Covid Cases' }
        ]
      });
      this.isCollapsed = false;
  }

  public fetchTravelData(origin: any,destination: any,travelDate: any, originPostCode: any, 
    destinationPostCode: any){
    this.validationMessage = '';
    if((origin == '' || origin == null) && (originPostCode == '' || originPostCode == null)){
      this.validationMessage = this.validationMessage + 'Source cannot be empty.'
    } 

    if((destination == '' || destination == null) && (destinationPostCode == '' || destinationPostCode == null)){
      this.validationMessage = this.validationMessage + ' Destination cannot be empty.'
    }
    if(travelDate == '' || travelDate == null){
      this.validationMessage = this.validationMessage + ' Travel date cannot be empty.'
    }
    
    if ((origin == destination) && origin != null && origin != '' && destination != null && destination != '') {
      this.validationMessage = this.validationMessage + 'Origin and destination cannot be same.'
    }

    if ((originPostCode == destinationPostCode) && originPostCode != null && originPostCode != '' 
    && destinationPostCode != null && destinationPostCode != '') {
      this.validationMessage = this.validationMessage + 'Origin and destination postal code cannot be same.'
    }
   
    if (this.validationMessage !== '') {
      this.toastr.error(this.validationMessage);
      return;
    }

    let originCode = '';
    let originType = 'L'
    if (origin != '' && origin != null){
      originCode = origin.split(' - ')[1];
    } else {
      originCode = this.getCodeFromPostalCode(originPostCode);  
      originType = 'P'
    }

    let destinationCode = '';
    let destType = 'L';
    let travelDestination = '';
    if (destination != '' && destination != null){
      destinationCode = destination.split(' - ')[0];
      travelDestination = destination.split(' - ')[1];
    } else {
      destinationCode = this.getCodeFromPostalCode(destinationPostCode);
      travelDestination = this.getCodeFromPostalCode(destinationPostCode);    
      destType = 'P'
    }

    this.showWeatherAndCovidData = true;
    this.isCollapsed = true;

    let locationMaps = new Map();
    locationMaps.set('Waterloo', 'London Waterloo');
    locationMaps.set('Basingstoke', 'Basingstoke');
    locationMaps.set('Woking', 'Woking');
    locationMaps.set('St Pancras International', 'London St Pancras (Int)');
    locationMaps.set('Leeds', 'Leeds');
    let originOriginalValue = locationMaps.get(originCode);
    let destinationOriginalValue = locationMaps.get(travelDestination);

    this.landingPageService.fetchTrainData(originOriginalValue,destinationOriginalValue,travelDate,originType,destType)
     .subscribe(
      data => {
        this.trainData = data;
        this.noTrainData = data.length == 0
        this.showWeatherAndCovidData = true;
      },
      error => console.log('oops', error)
  );
 
  this.landingPageService.fetchWeatherDetails(destinationOriginalValue, travelDate).subscribe(
    data => {
      this.weatherDetails = data;
      this.weatherDetails['visibility'] = (this.weatherDetails['visibility']/1000).toFixed(1);
      this.weatherDetails['temperature'] = (this.weatherDetails['temperature']).toFixed(1); 
    },
    error => console.log('Error fetching weather details : ', error)
  );

  this.landingPageService.fetchAttractionSpots(destinationOriginalValue).subscribe(
    data => {
      this.restaurants = data['restaurant'];
      this.supermarkets = data['supermarket'];
      this.tourism = data['tourism'];
    },
    error => console.log('Error fetching weather details : ', error)
  );
}

getCodeFromPostalCode(code: string): any{
  let stationCode = '';
  this.locations.forEach(element => {
    element.postCode.forEach(post =>{
      if (code == post){
        stationCode = element.stationName;
        return; 
      }
    });         
   });
   return stationCode
}

getdestinationFromPostalCode(code: string): any{
  let stationName= '';
  this.locations.forEach(element => {
    element.postCode.forEach(post =>{
      if (code == post){
        stationName = element.stationName;
        return; 
      }
    });         
   });
   return stationName;
}

showWeather(){
    this.isCollapsed = !this.isCollapsed;
  }
}

interface WeatherDetails {
  cityName: any,
  temperature: any,
  temp_min: any,
  temp_max: any,
  feelsLike: any,
  humidity: any,
  weather: any,
  clouds: any,
  windSpeed: any,
  visibility: any
}

interface Locations {
  stationCode: any,
  stationName: any,
  postalCode: any[]
}

interface TrainData {
  trainNumber: String;
  origin: String;
  destination: String;
  eta: String;
  etd: String;
  duration: string;
}

