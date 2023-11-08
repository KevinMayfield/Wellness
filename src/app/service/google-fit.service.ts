import {EventEmitter, Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {LocalService} from "./local.service";
import {JwtHelperService} from "@auth0/angular-jwt";
import {StravaService} from "./strava.service";

@Injectable({
  providedIn: 'root'
})
export class GoogleFitService {
  private redirect: string | undefined;
  private accessToken = undefined;
  tokenChange: EventEmitter<any> = new EventEmitter();
  private refreshingToken = false;
  constructor(private http: HttpClient,
              private strava: StravaService,
              private localStore: LocalService) { }

  public getSteps(){
    this.getAPISteps().subscribe(result => {
      console.log(result)
    })
  }
  getAPISteps() {
    const headers = this.getAPIHeaders();
    console.log(this.strava.getFromDate().getTime())
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate'
      let body = {
        "aggregateBy": [{
          "dataTypeName": "com.google.step_count.delta",
          "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
        }],
        "bucketByTime": { "durationMillis": 86400000 },
        "startTimeMillis": this.strava.getFromDate().getTime(),
        "endTimeMillis": this.strava.getToDate().getTime()
      }
    return this.http.post<any>(url , body, { headers} );
  }

    clearLocalStore() {

    }
  getAPIHeaders(): HttpHeaders {

    let headers = new HttpHeaders(
    );

    headers = headers.append('Authorization', 'Bearer ' + this.getAccessToken());
   // headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return headers;
  }
  getAccessToken() {
    let tolkien = this.localStore.getData('googleFitToken')
    if (tolkien !== undefined && tolkien !== '') {

      const token: any = JSON.parse(tolkien);

      const helper = new JwtHelperService();

      if (token !== undefined && token !== null ) {
        if (this.isTokenExpired(token)) {
          this.accessToken = undefined;
          this.getRefreshToken();
          return undefined;
        }
        this.accessToken = token.access_token;
        // @ts-ignore
        return this.accessToken;
      }
    }
    return undefined;
  }

  authorise(routeUrl: string) {
    if (routeUrl.substring(routeUrl.length - 1, 1) === '/') {
      routeUrl = routeUrl.substring(0, routeUrl.length - 1);
    }
    this.redirect = routeUrl;
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?'
        + 'redirect_uri=' + routeUrl
        + '&prompt=consent'
        + '&response_type=code'
        + '&client_id='+ environment.googleClientId
        + '&state=google'
        + '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.activity.read+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.body.read+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.nutrition.read+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.oxygen_saturation.read+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.sleep.read&access_type=offline';

  }

  getOAuth2AccessToken(authorisationCode: any, routeUrl: string) {

    /*
    code=4%2F0AfJohXkeCEACrNTYUFRt66Rwm6WwNsV2TY8WqOI6E6AiUTM2q0NMU9FB8SDRKYUMvZhvwg
    &redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground
    &client_id=407408718192.apps.googleusercontent.com
    &client_secret=************
    &scope=
    &grant_type=authorization_code
     */
    let headers = new HttpHeaders(
    );
    headers = headers.append('content-type', 'application/x-www-form-urlencoded');
    const url = 'https://oauth2.googleapis.com/token';
    const bodge = 'code=' + authorisationCode
            + '&redirect_uri=' + routeUrl
        + '&client_id=' + environment.googleClientId
        + '&client_secret=' + environment.googleClientSecret
        + '&scope='
        + '&grant_type=authorization_code'
        ;

    this.http.post<any>(url, bodge, { headers} ).subscribe(
        token => {
          console.log('google Access Token');
          this.setAccessToken(token);
        },
        (err) => {
          console.log(err);
        }
    );
  }
  setAccessToken(token: any): void {
    // Create an expires at ..... don't know when we got the token
    let timeObject = new Date();
    const milliseconds = token.expires_in * 1000; // 10 seconds = 10000 milliseconds
    timeObject = new Date(timeObject.getTime() + milliseconds);
    token.expires_at = Math.round(timeObject.getTime() / 1000)
    console.log('new GoogleFit accessToken')
    this.localStore.saveData('googleFitToken', JSON.stringify(token));
    this.accessToken = token.access_token;
    this.tokenChange.emit(token);
  }

  private isTokenExpired(
      token: any,
      offsetSeconds?: number
  ): boolean {

    if (!token || token === '') {
      return true;
    }
    const date = this.getTokenExpirationDate(token);

    offsetSeconds = offsetSeconds || 0;

    if (date === null) {
      return false;
    } else {
      return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
    }
  }
  private getTokenExpirationDate(
      decoded: any
  ): Date | null {

    if (!decoded || !decoded.hasOwnProperty('expires_at')) {
      // Invalid format
      console.log(decoded)
      console.log('removed googleFitToken - getTokenExpiration date')
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.expires_at);
    return date;
  }
  public getRefreshToken() {
    if (this.refreshingToken) {
      // console.log('already inprogress refreshing token');
      return ; }
    this.refreshingToken = true;
    var googleFitToken = this.localStore.getData('googleFitToken')
    if (googleFitToken !== null) {
      console.log('googleFit refreshing token');
      const token: any = JSON.parse(googleFitToken);

      const url = 'https://oauth2.googleapis.com/token';
      if (token !== undefined && token.refresh_token !== undefined) {

        /*
        client_secret=************
        &grant_type=refresh_token
        &refresh_token=1%2F%2F04JuzbiKSOKVSCgYIARAAGAQSNwF-L9Ir-1AGn6Nz4xz3-nFqZcBri21DFhJXuD9V9coX3SMFg4neN0fGZXozJiM4sukG1Xk-hWA
        &client_id=407408718192.apps.googleusercontent.com
         */
        const bodge = 'client_secret=' + environment.googleClientSecret
             + '&grant_type=refresh_token'
            + '&refresh_token=' + token.refresh_token
            + '&client_id=' + environment.googleClientId;
        let headers = new HttpHeaders(
        );
        headers = headers.append('content-type', 'application/x-www-form-urlencoded');
        this.http.post<any>(url, bodge, {headers}).subscribe(
            accesstoken => {

              console.log(accesstoken);
              this.setAccessToken(accesstoken);
              this.refreshingToken = false;
            },
            (err) => {
              console.log(err);
            }
        );
      } else {
        console.log('googleFitToken refresh token - missing');
        console.log(token)
      }
    } else {
      console.log('googleFitToken token - missing');
    }
  }


}
