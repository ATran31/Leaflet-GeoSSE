const express = require("express");
const path = require("path");
const app = express();

app.use("/static", express.static(path.join(__dirname, "../src/")));

const create_obj = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [-77.0369, 38.9072] },
  properties: {
    post_id: 1,
    lat: 38.9072,
    lon: -77.036,
    popup_text: "Create event",
  },
};

const update_obj = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [-118.2437, 34.0522] },
  properties: {
    post_id: 1,
    lat: 34.0522,
    lon: -118.2437,
    popup_text: "Update event",
  },
};

const add_create_obj = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [-106.3468, 56.1304] },
  properties: {
    post_id: 2,
    lat: 56.1304,
    lon: -106.3468,
    popup_text: "Add event",
  },
};

const add_update_obj = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [-102.5528, 23.6345] },
  properties: {
    post_id: 2,
    lat: 23.6345,
    lon: -102.5528,
    popup_text: "Update (via Add) event",
  },
};

let events = { create: create_obj, update: update_obj, delete: update_obj };
function* generate() {
  while (true) {
    for (const [event, geojson] of [
      ...Object.entries(events),
      ["add", add_create_obj],
      ["add", add_update_obj],
      ["remove", add_update_obj],
    ]) {
      const resp = `event: ${event}\ndata: ${JSON.stringify(geojson)}\n\n`;
      console.log("event: ", event);
      yield resp;
    }
  }
}
const generator = generate();

async function eventsHandler(request, response, next) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
  };
  response.writeHead(200, headers);

  response.on("close", () => {
    console.log("Connection closed.");
    clearInterval(interval);
    response.end();
  });

  const interval = setInterval(() => {
    const val = generator.next();
    response.write(val.value);
  }, 5000);
}

app.get("/stream", eventsHandler);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`GeoSSE server listening at http://localhost:${PORT}`);
});
