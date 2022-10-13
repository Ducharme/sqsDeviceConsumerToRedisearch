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
        try {
            console.debug(`Received sqs message "${jsonStr}"`);
            const json = JSON.parse(jsonStr);
            const deviceId = json.deviceId;
            const streamId = json.streamId;
            const state = json.state;
            const dev_ts = json.timestamp;
            const srv_ts = json.server_timestamp;
            const wrk_ts = Date.now();
            const fv = json.firmwareVersion.split(".").join("_");
            const batt = json.battery;
            const gps_lat = json.gps_lat;
            const gps_lng = json.gps_lng;
            const gps_alt = json.gps_alt;
            const lnglat = gps_lng.toFixed(11) + "," + gps_lat.toFixed(11)
            
            const h3r0 = h3.geoToH3(gps_lat, gps_lng, 0);
            const h3r1 = h3.geoToH3(gps_lat, gps_lng, 1);
            const h3r2 = h3.geoToH3(gps_lat, gps_lng, 2);
            const h3r3 = h3.geoToH3(gps_lat, gps_lng, 3);
            const h3r4 = h3.geoToH3(gps_lat, gps_lng, 4);
            const h3r5 = h3.geoToH3(gps_lat, gps_lng, 5);
            const h3r6 = h3.geoToH3(gps_lat, gps_lng, 6);
            const h3r7 = h3.geoToH3(gps_lat, gps_lng, 7);
            const h3r8 = h3.geoToH3(gps_lat, gps_lng, 8);
            const h3r9 = h3.geoToH3(gps_lat, gps_lng, 9);
            const h3r10 = h3.geoToH3(gps_lat, gps_lng, 10);
            const h3r11 = h3.geoToH3(gps_lat, gps_lng, 11);
            const h3r12 = h3.geoToH3(gps_lat, gps_lng, 12);
            const h3r13 = h3.geoToH3(gps_lat, gps_lng, 13);
            const h3r14 = h3.geoToH3(gps_lat, gps_lng, 14);
            const h3r15 = h3.geoToH3(gps_lat, gps_lng, 15);
        
            const topic = json.topic;
            const seq = json.seq;

            // Topic contains the name of the device (no more '+')
            // lafleet/devices/location/client-19797601/streaming
            // Replace the name of the device back to its '+'
            var top = topic.replace(deviceId, '+');
            // "DEVLOC:client-19797601:lafleet/devices/location/+/streaming"
            var key : string = `DEVLOC:${deviceId}:${top}`;

            // BUG: In version 4.2.0+ sending integer with fail with TypeError: Invalid argument type
            // For payload1 fields should have their .toString() removed when bug is fixed
            var payload1 = {
                'deviceId': deviceId, 'topic': top, 'streamId': streamId.toString(), 'state': state, 'lnglat': lnglat,
                'lng': gps_lng.toString(), 'lat': gps_lat.toString(), 'alt': gps_alt.toString(),
                'dts': dev_ts.toString(), 'sts': srv_ts.toString(), 'wts': wrk_ts.toString(),
                'fv': fv, 'batt': batt.toString(), 'seq': seq.toString(),
                'h3r0': h3r0, 'h3r1': h3r1, 'h3r2': h3r2, 'h3r3': h3r3, 'h3r4': h3r4, 'h3r5': h3r5, 
                'h3r6': h3r6, 'h3r7': h3r7, 'h3r8': h3r8, 'h3r9': h3r9, 'h3r10': h3r10,
                'h3r11': h3r11, 'h3r12': h3r12, 'h3r13': h3r13, 'h3r14': h3r14, 'h3r15': h3r15
            };

            // "STREAMDEV:client-19797601:lafleet/devices/location/+/streaming"
            var sk = key.replace("DEVLOC", "STREAMDEV");
            // BUG: In version 4.2.0+ sending integer with fail with TypeError: Invalid argument type
            // For payload2 fields should have their .toString() removed when bug is fixed
            var payload2 = {'streamId': streamId.toString(), 'state': state, 'dts': dev_ts.toString(), 'sts': srv_ts.toString(),
                'wts': wrk_ts.toString(), 'rts': Date.now().toString(), 'seq': seq.toString(),
                'lng': gps_lng.toString(), 'lat': gps_lat.toString(), 'alt': gps_alt.toString(), 'h3r15': h3r15};
            
            var promise1 = this.client.hSet(key, payload1)
                .then(() => {console.debug(`Succeeded to hSet key ${key} with payload ${JSON.stringify(payload1)}`)})
                .catch((error: any) => {console.error(`Failed to hSet key ${key} with payload ${JSON.stringify(payload1)} -> ${error}`)});
            var promise2 = this.client.xAdd(sk, "*", payload2)
                .then(() => {console.debug(`Succeeded to xAdd key ${sk} with payload ${JSON.stringify(payload2)}`)})
                .catch((error: any) => {console.error(`Failed to xAdd key ${sk} with payload ${JSON.stringify(payload2)} -> ${error}`);});

            return promise1.then(promise2)
                .then(() => { console.log("Redis updated successfully"); return "Success"; })
                .catch((err: any) => { console.error("Redis failed to get updated"); return "Failure"; });
        } catch (ex) {
            console.error(`Failed to process message "${jsonStr} -> ${ex}"`);
            return new Promise<string>(() => {return ""});
        }
    }
}
