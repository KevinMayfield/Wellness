import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as echarts from "echarts";
import {EChartsOption, EChartsType} from "echarts";

@Component({
  selector: 'app-scatter-graph',
  templateUrl: './scatter-graph.component.html',
  styleUrls: ['./scatter-graph.component.scss']
})
export class ScatterGraphComponent implements AfterViewInit, OnInit {

  @Input()
  set setData(data: any[]) {
    this.data = data
    this.setOptions()
  }
  data: any[]
      // @ts-ignore
      | undefined


  @Input()
  set yMin(yMin: number){
    this.min = yMin
    this.setOptions()
  }

  @Input()
  set yMax(yMax: number){
    this.max = yMax
  }
  min: number | undefined
  max: number | undefined


  // @ts-ignore
  option: EChartsOption

  @Input()
  height = "300px"

  ngAfterViewInit() {
    this.doChartSetup()
  }

  doChartSetup() {

  }
  setOptions() {

      this.option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        xAxis: {
          type: 'time'
        },
        series: this.data,
        legend: {
          data: [],
          left: 'center',
          bottom: 10
        }
      }
      this.option.yAxis = {
        min: this.min,
        max: this.max
      }
      if (this.data !== undefined) {
        this.data.forEach(data => {
          // @ts-ignore
          this.option.legend.data.push(data.name)
        })
      }
  }

  ngOnInit(): void {
    this.doChartSetup()
  }
}
