# GW2 Meta Planner

Rough prototype built with alpine.js.

There are some unscheduled metas available in the list (like private convergences, for example) that may be started on demand, but others that cannot be (like Sandswept Isles) are currently intentionally left out.

- Built around a CSS grid that represents a full daily reset cycle, with rows for 5 minute increments
- Data is managed in `data.json`, described by `schema.json`
- alpine.js used for "state management" and live updates (and localstorage)
