import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {Parameters, QuestionnaireResponse, ValueSetExpansionContains} from "fhir/r4";
import {HttpClient} from "@angular/common/http";
import {SmartService} from "../service/smart.service";
import {DomSanitizer} from "@angular/platform-browser";
import {StravaService} from "../service/strava.service";
import {hrZone, pwrZone} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatSort, Sort} from "@angular/material/sort";
import {ActivityType} from "../models/activity-type";
import {EPRService} from "../service/epr.service";
import {ActivityDay, ActivitySession} from "../models/activity-day";
import {MatDatepickerInputEvent} from "@angular/material/datepicker";

@Component({
  selector: 'app-resting-metabolic-rate',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ActivityComponent implements OnInit{
    height: number | undefined;
    weight: number | undefined;
    rmr: number | undefined;
    dailyEnergy: number | undefined
    age: any;
    exerciseLevel: number = 0;
    exerciseDurationTotal: number = 0;
    zoneHR: hrZone | undefined
    zonePWR: pwrZone | undefined
    administrativeGenders: ValueSetExpansionContains[] | undefined;
    administrativeGender :ValueSetExpansionContains | undefined
    activityArray : ActivityDay[] = []
    activities : SummaryActivity[] = []
    powerActivities: SummaryActivity[] = [];
    legendHR = true;
    exerciseIntenses: ValueSetExpansionContains[] = [
        {
            code: 'very-light',
            display: 'Very light training (low intensity or skill based training)'
        },
        {
            code: 'moderate',
            display: 'Moderate-intensity training (approx 1 h daily)'
        },
        {
            code: 'moderate-high',
            display: 'Moderate-high-intensity training (approx 1-3 h daily)'
        },
        {
            code: 'very-high',
            display: 'Very high-intensity training (> 4 h daily)'
        }
    ]
    exerciseIntense :ValueSetExpansionContains | undefined

    exerciseFrequencies: ValueSetExpansionContains[] = [
        {
            code: '1.2',
            display: 'Mostly inactive or sedentary (mainly sitting)'
        },
        {
            code: '1.3',
            display: 'Fairly active (include walking and exercise 1-2 x week)'
        },
        {
            code: '1.4',
            display: 'Moderate active (exercise 2-3 x weekly)'
        },
        {
            code: '1.5',
            display: 'Active (exercise hard more than 3 x weekly)'
        },
        {
            code: '1.7',
            display: 'Very active (exercise hard daily)'
        }
    ]
    exerciseFrequency :ValueSetExpansionContains | undefined
   protected readonly Math = Math;
    maximumHR: undefined | number;

    // @ts-ignore
    dataSourceHR: MatTableDataSource<SummaryActivity> ;
    // @ts-ignore
    dataSourceKJ: MatTableDataSource<SummaryActivity> ;
    @ViewChild('hrSort') hrSort: MatSort | null | undefined;
    @ViewChild('pwrSort') pwrSort: MatSort | null | undefined;
    @ViewChild('paginatorHR',) paginatorHR: MatPaginator | undefined;
    @ViewChild('paginatorKJ',) paginatorKJ: MatPaginator | undefined;
    displayedColumnsHR = ['date', 'type',
        'heart',
        'avghr', 'peakhr','duration', 'kcal', 'cadence']
    displayedColumnsKJ = ['date', 'type',
        "power",'avgpwr','avghr',
        'duration',"kcal",  "cadence"]

    opened: boolean = true;
    hasPowerData: boolean = false;
    endDate: Date = new Date();
    selectedTabIndex: any;
    constructor(
        private http: HttpClient,
        private epr: EPRService,
        private smart: SmartService,
        private strava: StravaService,
        protected sanitizer: DomSanitizer,
        private _liveAnnouncer: LiveAnnouncer) {
       // this.sanitizer.bypassSecurityTrustHtml("<mat-icon>local_pizza</mat-icon>")

    }
    calculate() {
        if (this.age !== undefined && this.age !== this.epr.person.age) {
            this.epr.setAge(this.age)
        }
        if (this.height !== undefined && this.height !== this.epr.person.height) {
            this.epr.setHeight(this.height)
        }
        if (this.zonePWR === undefined && this.epr.person.ftp !== undefined) {
            let ftp =this.epr.person.ftp
            this.zonePWR = {
                calculated : true,
                ftp: this.epr.person.ftp,
                z1: {
                    min: 0,
                    max: Math.round(0.55 * ftp)
                },
                z2: {
                    min: Math.round(0.55 * ftp) + 1,
                    max:Math.round(0.76 * ftp)
                },
                z3: {
                    min: Math.round(0.76 * ftp) + 1,
                    max:Math.round(0.88 * ftp)
                },
                z4: {
                    min: Math.round(0.88 * ftp) + 1,
                    max:Math.round(0.95 * ftp)
                },
                z5: {
                    min: Math.round(0.95 * ftp) + 1,
                    max:Math.round(1.06 * ftp)
                },
                z6: {
                    min: Math.round(1.06 * ftp) + 1,
                    max: Math.round(1.2 * ftp)
                },
                z7: {
                    min: Math.round(1.2 * ftp) + 1
                },
            }
        }
        if (((this.epr.person.hrzones === undefined || this.epr.person.hrzones.calculated)) && this.age !== undefined) {
            let zone = 220 - this.age
            if (zone !== undefined) {
                this.epr.setHRZone( {
                    calculated: true,
                    maximumHR: this.round(zone),
                    z1: {
                        min: Math.round(zone * 0.5),
                        max: Math.round(zone * 0.6)
                    },
                    z2: {
                        min: Math.round(zone * 0.6),
                        max: Math.round(zone * 0.7)
                    },
                    z3: {
                        min: Math.round(zone * 0.7),
                        max: Math.round(zone * 0.8)
                    },
                    z4: {
                        min: Math.round(zone * 0.8),
                        max: Math.round(zone * 0.9)
                    },
                    z5: {
                        min: Math.round(zone * 0.9),
                        max: Math.round(zone * 1.0)
                    }
                })
            }

        }
        if (this.administrativeGenders !== undefined && this.epr.person.sex !== undefined) {
            for (var gender of this.administrativeGenders) {

                if (gender.code === 'male' && this.epr.person.sex === 'M') {
                    this.administrativeGender = gender
                }
                if (gender.code === 'female' && this.epr.person.sex === 'F') {
                    this.administrativeGender = gender
                }
            }
        }
        if (this.weight != undefined
            && this.height != undefined
            && this.administrativeGender !== undefined) {
            this.rmr = (this.weight * 10) + (6.25 * this.height)
            if (this.administrativeGender.code == 'male') {
                this.rmr = this.rmr - (5 * this.age) + 5
            } else {
                this.rmr = this.rmr - (5 * this.age) - 16
            }
            if (this.exerciseFrequency !== undefined) {
                // @ts-ignore
                this.dailyEnergy = this.rmr * (+this.exerciseFrequency.code)
            }
        }
    }

    ngOnInit(): void {

        this.http.get(this.smart.epr + '/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender').subscribe(result => {
            this.administrativeGenders = this.smart.getContainsExpansion(result)
        })


        this.zoneHR = this.epr.person.hrzones
        this.epr.zoneChange.subscribe(zone => {
            console.log('hr zone change')
            this.zoneHR = zone
        })
        if (this.epr.person.age !== undefined) {
            this.age = this.epr.person.age
        }
        if (this.epr.person.height !== undefined) {
            this.height = this.epr.person.height
        }
        if (this.epr.person.weight !== undefined) {
            this.weight = this.epr.person.weight
        }
        if (this.height !== undefined || this.weight !== undefined) {
            this.opened = false
            this.calculate()
        }
        this.getStrava()
        this.strava.tokenChange.subscribe(()=> {

            this.getStrava()
        })

        this.strava.loaded.subscribe(activity => {

            var today = this.strava.getToDate()
            var activityDate = new Date(activity.start_date)
            var diffDays = this.epr.getDateAbs(today) - this.epr.getDateAbs(activityDate);

            if (activity.kcal !== undefined) {

                var act : ActivityDay = {
                    duration: (activity.elapsed_time + this.activityArray[this.strava.duration - diffDays].duration),
                    kcal: (this.activityArray[this.strava.duration - diffDays].kcal + activity.kcal),
                    sessions: this.activityArray[this.strava.duration - diffDays].sessions,
                    day: activityDate
                }
                if (activity.average_heartrate !== undefined) {
                    if (this.activityArray[this.strava.duration - diffDays].average_heartrate !== undefined) {

                        // @ts-ignore
                        act.average_heartrate = ((activity.average_heartrate * activity.elapsed_time) + (this.activityArray[this.strava.duration - diffDays].average_heartrate * this.activityArray[this.strava.duration - diffDays].duration)) / (this.activityArray[this.strava.duration - diffDays].duration + activity.elapsed_time)
                    } else {
                        act.average_heartrate = activity.average_heartrate
                    }
                }
                // @ts-ignore
                if (activity.max_heartrate !== undefined && (this.activityArray[this.strava.duration - diffDays].hr_max === undefined || (this.activityArray[this.strava.duration - diffDays].hr_max < activity.max_heartrate))) {
                    act.hr_max = activity.max_heartrate
                }


                var session : ActivitySession = {
                    name: activity.name,
                    activity: activity
                }
                if (activity.zones !== undefined && (this.epr.person.hrzones === undefined || this.epr.person.hrzones?.calculated)) {
                    this.getZone(activity)
                }
                if (activity.type !== undefined) session.type = activity.type
                act.sessions.push(session)
                this.activityArray[this.strava.duration - diffDays] = act
                this.exerciseLevel = 0
                this.exerciseDurationTotal = 0
                for(let activity of this.activityArray) {
                    // be a bit generous on amount of exercise for calculation
                    if (activity.duration > (40 * 60)) {
                        this.exerciseLevel++
                        this.exerciseDurationTotal = this.exerciseDurationTotal + activity.duration
                    }
                }

                this.setSelectAnswers()
                // supports activity detail
                this.activities.push(activity)
                if (activity.device_watts) {
                    this.hasPowerData = true
                    this.powerActivities.push(activity)
                    this.dataSourceKJ = new MatTableDataSource<SummaryActivity>(this.powerActivities.sort((a,b) =>{
                        if (a.start_date < b.start_date) {
                            return 1;
                        }

                        if (a.start_date > b.start_date) {
                            return -1;
                        }

                        return 0;
                    }));
                }
                // force a change
                var tempAct: any[] = []
                for (let temp of this.activityArray) tempAct.push(temp)
                this.activityArray = tempAct

                this.dataSourceHR = new MatTableDataSource<SummaryActivity>(this.activities.sort((a,b) =>{
                    if (a.start_date < b.start_date) {
                        return 1;
                    }

                    if (a.start_date > b.start_date) {
                        return -1;
                    }

                    return 0;
                }));
                this.setSortHR()
                this.setSortPWR()
            }

        })
        this.smart.patientChangeEvent.subscribe(patient => {
                this.age = this.smart.age

            this.setSelectAnswers()
                var parameters: Parameters = {
                    "resourceType": "Parameters",

                    "parameter": [
                        {
                            "name": "subject",
                            "valueReference": {
                                "reference": "Patient/" + patient.id
                            }
                        },
                        {
                            "name": "questionnaireRef",
                            "valueReference": {
                                "reference": "Questionnaire/b1132517-9aea-4968-910b-ccfa3889c33a"
                            }
                        }
                    ]
                }

                // @ts-ignore
                this.http.post(this.smart.epr + '/Questionnaire/$populate', parameters).subscribe(result => {

                    if (result !== undefined) {

                        var parameters = result as Parameters
                        if (parameters.parameter !== undefined) {

                            for (var parameter of parameters.parameter) {
                                if (parameter.name === 'response') {

                                    var questionnaireResponse = parameter.resource as QuestionnaireResponse
                                    if (questionnaireResponse.item !== undefined) {

                                        for (var item of questionnaireResponse.item) {
                                            if (item.linkId === '9832470915833') {
                                                // @ts-ignore
                                                this.height = item.answer[0].valueQuantity.value
                                            }

                                            if (item.linkId === '81247982689') {
                                                // @ts-ignore
                                                this.weight = item.answer[0].valueQuantity.value
                                            }
                                            if (item.linkId === '7761181498456') {
                                                // @ts-ignore
                                                this.waist = item.answer[0].valueQuantity.value
                                            }
                                        }
                                    }
                                }
                            }

                            this.calculate()
                        }
                    }
                })
            }
        )
    }

    ngAfterViewInit(): void {

        if (this.hrSort !== undefined && this.hrSort !== null) {
            this.hrSort.sortChange.subscribe((event) => {

            });

            if (this.dataSourceHR !== undefined) this.dataSourceHR.sort = this.hrSort;
        } else {

        }
        if (this.pwrSort !== undefined && this.pwrSort !== null) {
            this.pwrSort.sortChange.subscribe((event) => {

            });

            if (this.dataSourceKJ !== undefined) this.dataSourceKJ.sort = this.pwrSort;
        } else {

        }

    }
    setSortPWR() {
        if (this.dataSourceKJ !== undefined) {
            // @ts-ignore
            this.dataSourceKJ.sort = this.pwrSort
            if (this.paginatorKJ !== undefined && this.dataSourceKJ !== undefined) this.dataSourceKJ.paginator = this.paginatorKJ

            this.dataSourceKJ.sortingDataAccessor = (item: any, property) => {
                switch (property) {
                    case 'date': {
                        try {
                            return item.start_date
                        } catch (e) {
                            console.log(item.start_date)
                            return new Date(item.start_date)
                        }
                        return 0;
                    }
                    case 'duration': {
                        return item.elapsed_time
                    }
                    case 'avghr': {
                        return item.average_heartrate
                    }
                    case 'avgpwr': {
                        return item.weighted_average_watts
                    }
                    case 'kcal': {
                        return item.kcal
                    }
                    case 'cadence': {
                        return item.average_cadence
                    }
                    default: {
                        return 0
                    }
                }
            };
        }
    }
    setSortHR() {

        // @ts-ignore
        this.dataSourceHR.sort = this.hrSort
        if (this.paginatorHR !== undefined) this.dataSourceHR.paginator = this.paginatorHR

        this.dataSourceHR.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'date': {
                    if (item.start_date !== undefined) {
                        try {
                        return item.start_date
                        }
                        catch (e) {
                            console.log(item.start_date)
                            return new Date(item.start_date)
                        }
                    }
                    return 0;
                }
                case 'duration': {
                   return item.elapsed_time
                }
                case 'type': {
                    return item.type
                }
                case 'Z1': {
                    return this.getZoneHRDuration(item,1)
                }
                case 'Z2': {
                    return this.getZoneHRDuration(item,2)
                }
                case 'Z3': {
                    return this.getZoneHRDuration(item,3)
                }
                case 'Z4': {
                    return this.getZoneHRDuration(item,4)
                }
                case 'Z5': {
                    return this.getZoneHRDuration(item,5)
                }
                case 'avghr': {
                    return item.average_heartrate
                }
                case 'peakhr': {
                    return item.max_heartrate
                }
                case 'kcal': {
                    return item.kcal
                }
                default: {
                    return 0
                }
            }
        };
    }

    getStrava(){
        // token changed so clear results
        this.activityArray = []
        this.activities = []
        this.powerActivities = [];
        for(var i= 0;i<=this.strava.duration;i++) this.activityArray.push({ duration:0,kcal: 0, sessions: []})
        this.strava.getAthlete().subscribe(athlete => {
            if (athlete.weight !== undefined) this.weight = athlete.weight
            this.epr.setPerson(athlete)
            this.strava.getActivities()
        })
    }
    setSelectAnswers() {
        if (this.smart.patient !== undefined) {
            if (this.administrativeGenders !== undefined) {
                for (var gender of this.administrativeGenders) {

                    if (gender.code === this.smart.patient.gender) {
                        this.administrativeGender = gender
                    }
                }
            }
        }

        if (this.exerciseLevel > 0) {
            let level = Math.round(this.exerciseLevel * 7 / (this.strava.duration+1))
            let duration = this.exerciseDurationTotal / this.exerciseLevel / 60

            for(let pal of this.exerciseFrequencies) {
                if (pal.code == '1.2' && level < 1) this.exerciseFrequency = pal
                if (pal.code == '1.3' && level >= 1 && level <= 2 ) this.exerciseFrequency = pal
                if (pal.code == '1.4' && level > 2 && level <= 3 ) this.exerciseFrequency = pal
                if (pal.code == '1.5' && level > 3 && level <= 6 ) this.exerciseFrequency = pal
                if (pal.code == '1.6' && level > 6  ) this.exerciseFrequency = pal
            }
            var pal = 'very-light'
            if (level >= 4) {
                if (duration>50) pal = 'moderate'
                if (duration>65) pal = 'moderate-high'
                if (duration>180) pal = 'very-high'
            }
            for (let intense of this.exerciseIntenses) {
                if (intense.code === pal) {

                    this.exerciseIntense = intense
                }
            }
            this.calculate()
        }
    }
    round(val : number | undefined) {
        if (val == undefined) return undefined
        return Math.round(val)
    }

    perKgKCal(number: number): number | undefined {
       return this.epr.perKgKCal(number)
    }
    perKgMl(number: number): number | undefined {
        return this.epr.perKgMl(number)
    }


    pizza(kcal: number | undefined) {
      return this.epr.pizza(kcal)
    }


    slicesPerHour(kcal: number | undefined, elapsed_time: number) {
        if (elapsed_time === undefined || elapsed_time == 0) return undefined
        if (kcal === undefined) return undefined
        return Math.round((kcal * (elapsed_time)/3600)/28)/10
    }
    slices(kcal: number | undefined) {
        if (kcal === undefined) return undefined
        return Math.round(kcal/28)/10
    }



    announceSortChange(sortState: Sort) {
        if (sortState.direction) {
            this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
        } else {
            this._liveAnnouncer.announce('Sorting cleared');
        }
    }


    dayOfWeek(number: number) {
        var now = this.strava.getToDate();
        var from = this.strava.getToDate();
        from.setDate(now.getDate() - this.strava.duration + number );
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return days[ from.getDay() ];
    }

    getBackgroundHR(heartrate: number | undefined) {
        return this.epr.getBackgroundHR(heartrate)
    }
    getBackgroundPWR(watts: number | undefined) {
        return this.epr.getBackgroundPWR(watts)
    }

    getType(type: ActivityType | undefined) {
        return this.strava.getType(type)
    }

    getNames(activity: ActivityDay) {
        var result = ''
        for (var session of activity.sessions) result = result + ' ' + session.name
        return result
    }

    getZoneHRDuration(activity: any, number: number) {
        if (activity === undefined || activity.zones == undefined || activity.zones.length == 0) return undefined
      //  console.log(activity.zones.length)
        for (let zone of activity.zones) {
            if (zone.type ==='heartrate') {
                if (zone.distribution_buckets.length>4) return zone.distribution_buckets[number-1].time
            } else {
                console.log(zone.type)
            }
        }
        return undefined
    }
    getZoneKJDuration(activity: any, number: number) {
        if (activity === undefined || activity.zones == undefined || activity.zones.length == 0) return undefined
        //  console.log(activity.zones.length)
        for (let zone of activity.zones) {
            if (zone.type ==='power') {
                if (zone.distribution_buckets.length>4) return zone.distribution_buckets[number].time
            } else {
          //      console.log(zone.type)
            }
        }
        return undefined
    }



    getZone(activity: any) {
        if (activity === undefined || activity.zones == undefined || activity.zones.length == 0) return
        for (let zone of activity.zones) {
            if (zone.type ==='heartrate') {

                var hrzones : hrZone = {
                    calculated: false,
                    maximumHR: Math.round(1.034 * zone.distribution_buckets[4].min)
                }
                hrzones.z1 = {
                    min : zone.distribution_buckets[0].min,
                    max: zone.distribution_buckets[0].max
                }
                hrzones.z2 = {
                    min : zone.distribution_buckets[1].min,
                    max: zone.distribution_buckets[1].max
                }
                hrzones.z3 = {
                    min : zone.distribution_buckets[2].min,
                    max: zone.distribution_buckets[2].max
                }
                hrzones.z4 = {
                    min : zone.distribution_buckets[3].min,
                    max: zone.distribution_buckets[3].max
                }
                hrzones.z5 = {
                    min : zone.distribution_buckets[4].min,
                    max: zone.distribution_buckets[4].max
                }

                this.epr.setHRZone(hrzones)
            } else {
                console.log(zone.type)
            }
        }
    }

    viewPA() {
        window.open("https://build.fhir.org/ig/HL7/physical-activity/measures.html", "_blank")
    }



    viewPower() {
        window.open("https://power-meter.cc/", "_blank")
    }

    addEvent(change: string, event: MatDatepickerInputEvent<Date>) {

        while (this.endDate.getDay() !=6) {
            this.endDate.setDate(this.endDate.getDate() +1);
        }
        this.strava.setToDate(this.endDate)
        this.getStrava()
    }

    tabChanged(event: Event) {
        console.log(event)
        console.log(this.selectedTabIndex)
    }
    duration(time: number ) {
        return this.epr.duration(time)
    }

    onClick() {
        this.opened = !this.opened
    }
}