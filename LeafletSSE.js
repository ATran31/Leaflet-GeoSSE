var L.SSELyr = L.GeoJSON.extend({
    /*
    * Feature Layer class used to handle real-time reloading of
    * geojson layers.
    *
    * Extends L.GeoJSON class.
    */
    connectToEventServer: function(channelName, featureIdField){
        /*
        * Updates the layer features by connecting to the event server
        * and monitoring the stream on the specified channelName.
        *
        * Keyword Arguments:
        * featureIdField (required) - used to identify the feature to update/
        * replace on update events.
        */


        // set stream source
        let source = new EventSource(`${this.options.eventUrl}?channel=${channelName}`);


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
                this.connectToEventServer(channelName, featureIdField);
            }
        }

        this.eventSource = source;
    },
});