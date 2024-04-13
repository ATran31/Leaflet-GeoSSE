# Leaflet GeoSSE

A Leaflet plugin to enable real-time data updates using [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

## Events

The events published by the server must have a valid geojson feature in the `data` field.

The geojson feature's properties must include a field that uniquely identifies the feature. This identifier is used to facilitate replacement of the current feature with its updated instance when the server sends an update event.

### Example event from server:

```json
{
  "data": {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [125.6, 10.1]
    },
    "properties": {
      "featureId": 1,
      "name": "My Feature"
    }
  }
}
```

## Usage

Add the file to your map HTML head tag below LeafletJS.

```html
<!-- Insert below LeafletJs -->
<script
  type="text/javascript"
  src="https://www.unpkg.com/browse/leaflet-geosse@1.0.1/dist/Leaflet.GeoSSE.min.js"
></script>
```

### Initializing

Initialize same as any `L.geoJson` instance. You must pass in a `streamUrl` and `featureIdField` option to identify the event source and individual features respectively.

Initialize an empty layer when you don't care about history and only want to monitor events that are created after establishing connection to event stream.

```js
var sseLyr = L.geoSSE(null, {
  streamUrl: "https://my-site.com/stream",
  featureIdField: "featureId",
  // set other layer options...
});
```

Alternatively you can initialize with some existing data when you want to establish the initial state by loading previously created features on connection to event stream.

```js
var sseLyr = L.geoSSE('my-data.geojson', {
    streamUrl: 'https://my-site.com/stream'
    featureIdField: 'featureId'
    // set other layer options...
});
```

### Connecting To The Event Stream

The connection requires that you pass in a geojson property attribute that uniquely identifies the feature.

```js
// Connect to an event stream.
sseLyr.connectToEventStream();
```

### Standard Event Types

When a successful connection is established, by default the layer expects following types events:

- Create event
  > When a `create` event is received from the server, the feature is added.
- Update event
  > When an `update` event is received from the server, the feature is replaced. Update events are sent after any change to one or more feature properties.
- Delete event
  > When a `delete` event is received from the server, the feature is removed.

### Other Event Types

In addition to standard events, you can configure your event server to return any other type of events. For example, if your server will be sending `crash` events you can monitor and handle that event by attaching an event listener.

```js
// Listen for crash event and log data to console.
sseLyr.eventSource.addEventListener(
  "crash",
  function crashEvent(event) {
    console.log(event.data);
  },
  false
);
```

### Stop Monitoring A Specific Event Type

This will only stop monitoring the `crash` event. Note the second and third arguments to `removeEventListener` must match the listener function name and `useCapture` boolean that was entered in the `addEventListener` call above.

```js
// Stop listening for crash events.
sseLyr.eventSource.removeEventListener("crash", crashEvent, false);
```

### Stop Monitoring All Events

Disconnect from the source to stop listening to all events and close the connection to the server.

```js
sseLyr.disconnect();
```

### Switch to Another Stream

Switching streams just involves passing in a new stream url and unique id field to `switchStream()`.

```js
sseLyr.switchStream("https://some-other/stream", "otherFieldId");
```

If you want to remove all currently displayed features in your layer when switching streams simply add a boolean of `true` as the third argument. By default, all features that were loaded by the old stream will remain after connecting to the new stream.

```js
sseLyr.switchStream("https://some-other/stream", "otherFieldId", true);
```

# Working Example

To see the working example of this plugin locally

```bash
# install dependencies if needed
npm install -w examples

npm run dev -w examples
```

An example map will be available at `localhost:3000` where you can see point features being created, updated and deleted.
