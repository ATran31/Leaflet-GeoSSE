"use strict";


/**
 * Feature Layer class used to handle real-time reloading of geojson layers via
 * server sent events.
 *
 * @extends L.GeoJSON class.
 */
const GeoSSE = L.GeoJSON.extend({
  /**
   * Establishes connection to the event server and subscribes to the event
   * stream.
   */
  connectToEventStream: function () {
    function addFeature(feature) {
      if (!(self.options.featureIdField || feature.id)) {
        return console.warn(
          "`featureIdField` option or Feature `id` field are required to add " +
          "a feature, so it can be updated or removed.", feature
        );
      }

      self.addData(feature);
    }

    function finderId({feature: {id}}) {
      return id === this.id
    }

    function finderIdField({feature: {properties}}) {
      const {featureIdField} = self.options;

      return properties[featureIdField] === this.properties[featureIdField];
    }

    function removeFeature(feature) {
      if (!(self.options.featureIdField || feature.id)) {
        return console.warn(
          "`featureIdField` option or Feature `id` field are required to " +
          "delete a feature.", feature
        );
      }

      const finder = self.options.featureIdField ? finderIdField : finderId;
      const layer = self.getLayers().find(finder, feature);

      if (layer) {
        self.removeLayer(layer);
      }
    }


    //
    // Event handlers
    //

    /**
     * On add events, replace the existing feature based on id. Expected data
     * sent by this event is a geojson Feature or FeatureCollection.
     */
    function add(event) {
      remove(event);

      const geojson = JSON.parse(event.data);

      if(geojson.type === "Feature") {
        return addFeature(geojson);
      }

      geojson.features.forEach(addFeature);
    }

    /**
     * On remove events, remove the existing feature based on id. The expected
     * data sent by this event is a single geojson Feature or FeatureCollection.
     */
    function remove(event) {
      const geojson = JSON.parse(event.data);

      if(geojson.type === "Feature") {
        return removeFeature(geojson);
      }

      geojson.features.forEach(removeFeature);
    }


    const self = this;

    if (typeof this.options.streamUrl === "undefined") {
      // throw an error if no streamUrl is provided in options during
      // initialization
      throw Error("Undefined event streamUrl.");
    }

    // set stream source
    const source = new EventSource(this.options.streamUrl);

    source.addEventListener("add", add, false);
    source.addEventListener("remove", remove, false);

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
   *
   * @param {string} newStreamUrl - The url of the event server stream.
   */
  setStreamUrl: function (newStreamUrl) {
    this.options.streamUrl = newStreamUrl;
  },

  /**
   * Updates the featureIdField option used to uniquely identify individual
   * features.
   *
   * @param {string} fieldName - The name of the field used to uniquely identify
   * features.
   */
  setFeatureIdField: function (fieldName) {
    this.options.featureIdField = fieldName;
  },

  /**
   * Disconnect from the current event stream and connect to a new event stream.
   *
   * @param {string} newStream - The url of the event stream.
   * @param {string} [featureIdField] - Name of the field used to uniquely
   * identify features.
   * @param {boolean} [emptyLayer] - Boolean indicating if all features should
   * be removed before switching streams. Defaults to false.
   */
  switchStream: function (newStream, featureIdField, emptyLayer = false) {
    if (emptyLayer) {
      this.clearLayers();
    }

    // update the options object
    this.setStreamUrl(newStream);
    if(featureIdField !== undefined) {
      this.setFeatureIdField(featureIdField);
    }

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
