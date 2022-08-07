const redis = require("redis");
const h3 = require("h3-js");


export class redisClient {
    private readonly params = { 'socket': { 'host': process.env.REDIS_HOST } };
    private readonly client = redis.createClient(this.params);

    constructor() {
        this.client.on("connect", () => {
            console.log('Redis client connected');
        });
        this.client.on("ready", () => {
            console.log('Redis client ready');
        });
        this.client.on("end", () => {
            console.log('Redis client disconnected');
        });
        this.client.on("reconnecting", () => {
            console.log('Redis client reconnecting');
        });
        this.client.on("error", function(error: any) {
            console.error(error);
        });
    }

    public async connect() {
        await this.client.connect();
    }

    public async ping() {
        await this.client.ping();
    }

    public async saveDeviceLocation(jsonStr: string): Promise<string> {
        const json = JSON.parse(jsonStr);
        var deviceId = json.deviceId;
        var dev_ts = json.timestamp;
        var srv_ts = json.server_timestamp;
        var wrk_ts = Date.now();
        var fv = json.firmwareVersion.split(".").join("_");
        var batt = json.battery;
        var gps_lat = json.gps_lat;
        var gps_lng = json.gps_lng;
        var gps_alt = json.gps_alt;
        var lnglat = gps_lng.toFixed(11) + "," + gps_lat.toFixed(11)
        
        var h3r0 = h3.geoToH3(gps_lat, gps_lng, 0);
        var h3r1 = h3.geoToH3(gps_lat, gps_lng, 1);
        var h3r2 = h3.geoToH3(gps_lat, gps_lng, 2);
        var h3r3 = h3.geoToH3(gps_lat, gps_lng, 3);
        var h3r4 = h3.geoToH3(gps_lat, gps_lng, 4);
        var h3r5 = h3.geoToH3(gps_lat, gps_lng, 5);
        var h3r6 = h3.geoToH3(gps_lat, gps_lng, 6);
        var h3r7 = h3.geoToH3(gps_lat, gps_lng, 7);
        var h3r8 = h3.geoToH3(gps_lat, gps_lng, 8);
        var h3r9 = h3.geoToH3(gps_lat, gps_lng, 9);
        var h3r10 = h3.geoToH3(gps_lat, gps_lng, 10);
        var h3r11 = h3.geoToH3(gps_lat, gps_lng, 11);
        var h3r12 = h3.geoToH3(gps_lat, gps_lng, 12);
        var h3r13 = h3.geoToH3(gps_lat, gps_lng, 13);
        var h3r14 = h3.geoToH3(gps_lat, gps_lng, 14);
        var h3r15 = h3.geoToH3(gps_lat, gps_lng, 15);
    
        var topic = json.topic;
        var seq = json.seq;

        var key : string = `DEVLOC:${deviceId}:${topic}`;
        var payload1 = {
          'deviceId': deviceId, 'topic': topic,
          'lnglat': lnglat, 'lng': gps_lng, 'lat': gps_lat, 'alt': gps_alt,
          'dts': dev_ts, 'sts': srv_ts, 'wts': wrk_ts, 'fv': fv, 'batt': batt, 'seq': seq,
          'h3r0': h3r0, 'h3r1': h3r1, 'h3r2': h3r2, 'h3r3': h3r3, 'h3r4': h3r4, 'h3r5': h3r5, 
          'h3r6': h3r6, 'h3r7': h3r7, 'h3r8': h3r8, 'h3r9': h3r9, 'h3r10': h3r10,
          'h3r11': h3r11, 'h3r12': h3r12, 'h3r13': h3r13, 'h3r14': h3r14, 'h3r15': h3r15
        };

        // "STREAMDEV:test-299212:lafleet/devices/location/+/streaming"
        var sk = key.replace("DEVLOC", "STREAMDEV");
        // BUG: In version 4.2.0 sending integer with fail with TypeError: Invalid argument type
        //var payload2 = {'dts': dev_ts, 'sts': srv_ts, 'wts': wrk_ts, 'rts': Date.now(), 'seq': seq};
        var payload2 = {'dts': dev_ts.toString(), 'sts': srv_ts.toString(),
            'wts': wrk_ts.toString(), 'rts': Date.now().toString(), 'seq': seq.toString()};
        

        let handleError1 = (error: any) => {
            console.error(`Failed to hSet key ${key} with payload ${JSON.stringify(payload1)}. ${error}`);
            throw "Failed to hSet " + key;
        };

        let handleError2 = (error: any) => {
            console.error(`Failed to xAdd key ${sk} with payload ${JSON.stringify(payload2)}. ${error}`);
            throw "Failed to xAdd " + sk;
        };

        var promise1 = this.client.hSet(key, payload1).catch(handleError1);
        var promise2 = this.client.xAdd(sk, "*", payload2).catch(handleError2);
        return promise1.then(promise2)
            .then(() => {
                console.log("Redis updated successfully");
                return "Success";
            }).catch((err: any) => {
                console.log("Redis failed to get updated");
                return "Failure";
            });
    }
}
