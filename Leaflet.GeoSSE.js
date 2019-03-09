'use strict';

var GeoSSE = L.GeoJSON.extend({
    /*
    * Feature Layer class used to handle real-time reloading of
    * geojson layers via server sent events.
    *
    * Extends L.GeoJSON class.
    */
    connectToEventServer: function(){
        /*
        * Establishes connection to the event server and subscribes to the event stream.
        */

        let cls=this;

        if (typeof this.options.serverUrl === 'undefined'){
            // throw an error if no serverUrl is provided in options during initialization
            throw Error('Undefined event serverUrl.')
        } else {
            // set stream source
            let source = new EventSource(this.options.serverUrl);

            source.addEventListener('create', function createEvent(event) {
                /*
                * On create events, simply add the data. The expected data sent by this event is a
                * geojson feature.
                */
                let geojson = JSON.parse(event.data);
                cls.addData(geojson);
            }, false);

            source.addEventListener('update', function updateEvent(event) {
                /*
                * On update events, replace the existing feature based on featureId. The expected data sent by
                * this event is a single geojson feature.
                */
                let geojson = JSON.parse(event.data);
                for (let l of cls.getLayers()){
                    if (l.feature.properties[cls.options.featureIdField] === geojson.properties[cls.options.featureIdField]){
                        cls.removeLayer(l);
                        cls.addData(geojson);
                    }
                }
            }, false);

            source.addEventListener('delete', function deleteEvent(event) {
                /*
                * On delete events, remove the existing feature based on featureId. The expected data sent by
                * this event is a single geojson feature.
                */
                let geojson = JSON.parse(event.data);
                for (let l of cls.getLayers()){
                    if (l.feature.properties[cls.options.featureIdField] === geojson.properties[cls.options.featureIdField]){
                        cls.removeLayer(l);
                    }
                }
            }, false);

            // handle connection open event
            source.onopen = function(event){
                /*
                * Fired once when readyState changes from 0 (CONNECTING)
                * to 1 (CONNECTED). DOES NOT fire when the connection is
                * first established, actually fires when the first event
                * is received from server.
                *
                * DO NOT use 'onopen' event to test/confirm
                * successful connection to the event server. Instead make a
                * request to the event server and have it publish a
                * type='message' event. Then use source.onmessage to confirm you
                * successfully got the event (this method only works on Firefox).
                * Alternatively check source.readyState.
                */
            }

            // handle message event
            source.onmessage = function(event){
                /*
                * Generic 'message' event handler.
                * Can use this to confirm connection to event server
                * by making GET request to end point that publishes
                * a type='message' event.
                */

                //let data = JSON.parse(event.data);
                //alert(data.message);
            }

            // handle error event
            source.onerror = function(event){
                // reconnect if the connection is closed
                if (source.readyState === 2){
                    cls.connectToEventServer();
                }
                console.log(event.data);
            }

            this.eventSource = source;
        }
    },
    disconnect: function(){
        /*
        * Disconnect from the event server and unsubscribe from all events.
        */
        this.eventSource.close();
    },
    setServerUrl: function(newServerUrl){
        /*
        * Updates the event server url option.
        * Keyword Arguments:
        * newServerUrl (required) -- The url of the event server stream.
        */
        this.options.serverUrl = newServerUrl;
    },
    setFeatureIdField: function(fieldName){
        /*
        * Updates the featureIdField option used to uniquely identify individual features.
        * Keyword Arguments:
        * fieldName (required) -- The name of the field used to uniquely identify features.
        */
        this.options.featureIdField = fieldName;
    },
    switchStream: function(newStream, featureIdField, emptyLayer=false){
        /*
        * Disconnect from the current event stream and connect to a new event stream.
        * Keyword Arguments:
        * newStream (required) -- The url of the event stream.
        * featureIdField (required) -- Name of the field used to uniquely identify features.
        * emptyLayer (optional) -- Boolean indicating if all features should be removed before switching streams.
        * Defaults to false.
        */

        if (emptyLayer){
            this.clearLayers();
        }

        // update the options object
        this.setServerUrl(serverUrl);
        this.setFeatureIdField(featureIdField);

        // disconnect from the current stream
        this.disconnect();

        // connect to the new stream
        this.connectToEventServer();
    }
});

// factory function
L.geoSSE = function (data, options){
    return new GeoSSE(data, options);
}
