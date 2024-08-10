# GW2 Meta Planner

Rough prototype built with alpine.js.

There are some unscheduled metas that are not currently in the list, as they cannot be predictably started (like private convergences, for example).

- Built around a CSS grid that represents a full daily reset cycle, with rows for 5 minute increments
- Data is managed in `data.json`, described by `schema.json`
- alpine.js used for "state management" and live updates (and localstorage)
