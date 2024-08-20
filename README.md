# GW2 Meta Planner

## Development

Minimal file watching for CSS, JS, PHP/HTML, and JSON inside the `src` directory:

```sh
npm i
npm start
```

For live browser refresh, can use the Live Server extension in VS Code.

### Build

In addition to processing content, this command will also copy CSS/JS assets to the `public` directory

```sh
npm run build

# or
php build.php --assets
```

## Notes

### JS

Rather than storing the meta event data in JS itself, all of it exists as data attributes on each item in the actual DOM. Each one gets a unique ID which makes finding the one you need easy enough. Adding an item to a route copies the node and swaps out some attributes and content. For importing/adding/removing, everything is based off of the HTML ID to find the correct event item in the page with the format `event-{id}-{occurence}` (For example the second occurence of an event with id 3 would have an HTML ID of `event-3-2`).

#### Export Format

The export string is a simple condensed string of simple object representation of each meta event in the list. It can be described as `v{version}={eventdata}`, where each item in `eventdata` is separated by a `_` and has a format of `{id}:{offset}:{duration}:{isAlt}`.

The same ID format `{eventid}-{occurence}` is used in the export string, without the "event-". Additionally, custom events not on a timer will be prefixed with `c`. The prefix is used to handle those items a bit differently as their markup is not in the main table but inside `<template>`s at the end of the page.

### PHP

In `build.php`, the data is split up into two separate lists. Meta events with no scheduled times go into their own list as they are output at the very bottom of the page with slightly different markup.

### CSS

Most of the styles make use of native nesting and the colors are adjusted with `color-mix()`.

The main grid uses one big CSS grid, with a row for each minute, and a full 24 hour reset cycle. A full 24 hours makes it easy to show all events even with more irregular repeat times. Having a grid row for each minute makes it very easy to slide the beginning of events up or down using the `--time` and `--offset` custom properties, and the end of an event by using `--duration`. Note that `--duration` will always be a minimum of 5 due to spacing concerns. Any smaller than that and two lines of text for the event name will not fit with the other controls.

placing all items in the same grid container allows for easily sticking both vertical and horizontal items while scrolling.

the toggling of alternate route items and controls is done with a single class `mp-grid--alt-route`. It will hide any `.mp-route--alt` and `.mp-grid__alt-item` elements.
