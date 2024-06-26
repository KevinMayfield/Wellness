import {MetaAthlete} from "./meta-athlete";
import {ActivityType} from "./activity-type";
import {PolylineMap} from "./polyline-map";
import {Stream, Zones} from "./stream";



export interface SummaryActivity {
  trimp?: number;
  zones: Zones[];
  stream?: Stream;
  suffer_score?: number;
  id: string;
  external_id: string;
  upload_id: number;
  athlete: MetaAthlete;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  elev_high: number;
  elev_low: number;
  type: ActivityType;
  start_date: Date;
  start_date_local: Date;
  timezone: string;
  start_latlng: number[];
  end_latlng: number[];
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  total_photo_count: number;
  map: PolylineMap;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  workout_type: number;
  average_speed: number;
  max_speed: number;
  has_kudoed: boolean;
  kilojoules : number;
  intensity: number;
  average_heartrate? : number;
  average_watts? : number;
  weighted_average_watts? : number;
  kcal? : number;
  max_heartrate?: number;
  device_watts?: boolean;
  average_cadence?: number;
  np? : number;

 // splits_metric?: any[];
 // splits_standard?: any[];
}
