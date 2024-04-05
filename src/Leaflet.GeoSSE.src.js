"use strict";


/**
 * Feature Layer class used to handle real-time reloading of geojson layers via
 * server sent events.
 *
 * Extends L.GeoJSON class.
 */
const GeoSSE = L.GeoJSON.extend({
  /**
   * Establishes connection to the event server and subscribes to the event
   * stream.
   */
  connectToEventStream: function () {
    /**
     * On create events, simply add the data. The expected data sent this event
     * is a geojson feature.
     */
    function createEvent(event) {
      const geojson = JSON.parse(event.data);

      self.addData(geojson);
    }

    /**
     * On update events, replace the existing feature based on featureId. The
     * expected data sent by this event is a single geojson feature.
     */
    function updateEvent(event) {
      const geojson = JSON.parse(event.data);

      for (let l of self.getLayers()) {
        if (
          l.feature.properties[featureIdField] ===
          geojson.properties[featureIdField]
        ) {
          self.removeLayer(l);
          self.addData(geojson);
        }
      }
    }

    /**
     * On delete events, remove the existing feature based on featureId. The
     * expected data sent by this event is a single geojson feature.
     */
    function deleteEvent(event) {
      const geojson = JSON.parse(event.data);

      for (let l of self.getLayers()) {
        if (
          l.feature.properties[featureIdField] ===
          geojson.properties[featureIdField]
        ) {
          self.removeLayer(l);
        }
      }
    }

    const self = this;
    const {featureIdField} = this.options;

    if (typeof this.options.streamUrl === "undefined") {
      // throw an error if no streamUrl is provided in options during
      // initialization
      throw Error("Undefined event streamUrl.");
    }

    if (typeof featureIdField === "undefined") {
      throw Error("Undefined featureIdField option.");
    }

    // set stream source
    const source = new EventSource(this.options.streamUrl);

    source.addEventListener("create", createEvent, false);
    source.addEventListener("update", updateEvent, false);
    source.addEventListener("delete", deleteEvent, false);

    /**
     * handle connection open event
     *
     * Fired once when readyState changes from 0 (CONNECTING) to 1 (CONNECTED).
     * DOES NOT fire when the connection is first established, actually fires
     * when the first event is received from server.
     *
     * DO NOT use 'onopen' event to test/confirm successful connection to the
     * event server. Instead make a request to the event server and have it
     * publish a type='message' event. Then use source.onmessage to confirm you
     * successfully got the event (this method only works on Firefox).
     * Alternatively check source.readyState.
     */
    source.onopen = function (event) {};

    /**
     * Generic 'message' event handler.
     *
     * Can use this to confirm connection to event server by making GET request
     * to end point that publishes a type='message' event.
     */
    source.onmessage = function (event) {
      //const data = JSON.parse(event.data);
      //alert(data.message);
    };

    /**
     * handle error event
     */
    source.onerror = function (event) {
      // reconnect if the connection is closed
      if (source.readyState === 2) {
        self.connectToEventStream();
      }
    };

    this.eventSource = source;
  },

  /**
   * Disconnect from the event server and unsubscribe from all event streams.
   */
  disconnect: function () {
    this.eventSource.close();
  },

  /**
   * Updates the event stream url option.
   * Keyword Arguments:
   * newStreamUrl (required) -- The url of the event server stream.
   */
  setStreamUrl: function (newStreamUrl) {
    this.options.streamUrl = newStreamUrl;
  },

  /**
   * Updates the featureIdField option used to uniquely identify individual
   * features.
   *
   * Keyword Arguments:
   * fieldName (required) -- The name of the field used to uniquely identify
   * features.
   */
  setFeatureIdField: function (fieldName) {
    this.options.featureIdField = fieldName;
  },

  /**
   * Disconnect from the current event stream and connect to a new event stream.
   *
   * Keyword Arguments:
   * newStream (required) -- The url of the event stream.
   * featureIdField (required) -- Name of the field used to uniquely identify
   * features.
   * emptyLayer (optional) -- Boolean indicating if all features should be
   * removed before switching streams. Defaults to false.
   */
  switchStream: function (newStream, featureIdField, emptyLayer = false) {
    if (emptyLayer) {
      this.clearLayers();
    }

    // update the options object
    this.setStreamUrl(newStream);
    this.setFeatureIdField(featureIdField);

    // disconnect from the current stream
    this.disconnect();

    // connect to the new stream
    this.connectToEventStream();
  }
});

/**
 * factory function
 */
L.geoSSE = function (data, options) {
  return new GeoSSE(data, options);
};

export default GeoSSE;
