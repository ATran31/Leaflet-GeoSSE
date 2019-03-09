from flask import Flask, Response
import json
import time

app = Flask(__name__)


@app.route("/stream")
def generate_stream():
    '''
    Repeatedly stream create, update, and delete events at 3 second interval until the server is stopped.
    '''
    create_obj = {}
    create_obj["type"] = "Feature"
    create_obj["geometry"] = {"type": "Point", "coordinates": [-77.0369, 38.9072]}
    create_obj["properties"] = {}
    create_obj["properties"]["post_id"] = 1
    create_obj["properties"]["lat"] = 38.9072
    create_obj["properties"]["lon"] = -77.0369

    update_obj = {}
    update_obj["type"] = "Feature"
    update_obj["geometry"] = {"type": "Point", "coordinates": [-118.2437, 34.0522]}
    update_obj["properties"] = {}
    update_obj["properties"]["post_id"] = 1
    update_obj["properties"]["lat"] = 34.0522
    update_obj["properties"]["lon"] = -118.2437

    events = {"create": create_obj, "update": update_obj, "delete": update_obj}

    def generate():
        while True:
            for k, v in events.items():
                yield "event: {}\n".format(k)
                yield "data: {}".format(json.dumps(v))
                yield "\n\n"
                time.sleep(5)

    return Response(generate(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
