import {Component, Input} from '@angular/core';
import {Observations} from "../../models/observations";
import {ScaleType} from "@swimlane/ngx-charts";
import {curveBasis, curveCatmullRom} from 'd3-shape';

@Component({
  selector: 'app-body-measures',
  templateUrl: './body-measures.component.html',
  styleUrls: ['./body-measures.component.scss']
})
export class BodyMeasuresComponent {
  measures :Observations[] = []
  weights: any[] | undefined
  muscle: any[] | undefined

  fats: any[] | undefined
  hydration: any[] | undefined
  @Input() set observations(measure: Observations[]) {

    this.measures = measure
    this.refreshActivity()
  }

  showXAxisLabel = false;
  showYAxisLabel = true;
  timeline: boolean = false;
  colorSeries = {
    domain: [ '#7aa3e5','#5AA454','#CFC0BB', '#E44D25',  '#a8385d', '#aae3f5']
    , group: ScaleType.Ordinal, name: "", selectable: false
  };
  weightMin= 99999;
  weightMax= 0;
  muscleMin= 99999;
  muscleMax= 0;
  fatMin= 99999;
  fatMax= 0;
  hydrationMin= 99999;
  hydrationMax= 0;

  avgWeight = 0
  avgFat = 0
  avgMuscle = 0
  avgHydration = 0
  //curve = curveBasis
  curve = curveCatmullRom
  schemeType: ScaleType = ScaleType.Linear;

  private refreshActivity() {
    this.weights = []
    this.muscle = []
    this.fats = []
    this.hydration = []
    var weights: any[] = [
      {
        name: 'Body Weight',
        series: []
      }]
    var muscle: any[] = [
      {
        name: 'Muscle Mass',
        series: []
      }]
    var fats: any[] = [
      {
        name: 'Fat Mass',
        series: []
      }]
    var hydration: any[] = [
      {
        name: 'Body Water',
        series: []
      }]
    this.measures.forEach(observations => {
        if (observations.weight !== undefined) {
          if (observations.weight < this.weightMin) this.weightMin = observations.weight
          if (observations.weight > this.weightMax) this.weightMax = observations.weight
          let weight = {
            name: observations.day,
            value: observations.weight
          }
          weights[0].series.push(weight)
        }
        if (observations.muscle_mass !== undefined) {
          if (observations.muscle_mass < this.muscleMin) this.muscleMin = observations.muscle_mass
          if (observations.muscle_mass > this.muscleMax) this.muscleMax = observations.muscle_mass
          let weight = {
            name: observations.day,
            value: observations.muscle_mass
          }
          muscle[0].series.push(weight)
        }
      if (observations.fat_mass !== undefined) {
        if (observations.fat_mass < this.fatMin) this.fatMin = observations.fat_mass
        if (observations.fat_mass > this.fatMax) this.fatMax = observations.fat_mass
        let weight = {
          name: observations.day,
          value: observations.fat_mass
        }
        fats[0].series.push(weight)
      }
      if (observations.hydration !== undefined) {
        if (observations.hydration < this.hydrationMin) this.hydrationMin = observations.hydration
        if (observations.hydration > this.hydrationMax) this.hydrationMax = observations.hydration
        let weight = {
          name: observations.day,
          value: observations.hydration
        }
        hydration[0].series.push(weight)
      }
    })
    this.muscle = muscle
    this.hydration = hydration
    this.weights = weights
    this.fats = fats
    var sum = 0
    muscle[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgMuscle = sum / muscle[0].series.length
    sum = 0
    weights[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgWeight = sum / weights[0].series.length
    sum = 0
    fats[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgFat = sum / fats[0].series.length
    sum = 0
    hydration[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgHydration = sum / hydration[0].series.length
  }

  getLast(series: any[] | undefined) {
      if (series == undefined) return undefined
      if (series.length === 0 ) return undefined
      var latest : any = undefined
      series[0].series.forEach((entry : any) => {
        if (latest == undefined) latest = entry
        else if (latest.name < entry.name) {
          console.log(entry)
          latest = entry
        }
      })
    if (latest !== undefined) return latest.value
    return undefined
  }
  round2DP(value : number) {
    return Math.round(value * 100) / 100
  }
  round1DP(value : number) {
    return Math.round(value * 10) / 10
  }
}