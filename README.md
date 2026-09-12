# MMM-Screencast
A module to cast to the [MagicMirror²](https://github.com/MichMich/MagicMirror/). Currently, only YouTube casting is supported. Hopefully, I will have time to add more casting options.

**NOTE: MMM-Screencast has been updated to deal with new support, please pull from master to ensure that you have the most up-to-date version. Thanks!**

## Using the module

* Navigate to the modules directory via the follow command: `cd MagicMirror/modules`
* Clone the module from github: `git clone https://github.com/kevinatown/MMM-Screencast.git`
* Navigate to the MMM-Screencast directory: `cd MMM-Screencast`
* Install the dependencies: `npm install`
* Add the following configuration to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
		module: 'MMM-Screencast',
		position: 'bottom_right', // This position is for a hidden <div /> and not the screencast window
		config: {
			position: 'bottomRight',
			height: 300,
			width: 500,
		}
        }
    ]
}
```

## Configuration options for MMM-Screencast

| Option    | Description
|---------- |-----------
| `position`| *Required* The position of the screencast window. <br>**Options:** `['bottomRight', 'bottomCenter', 'bottomLeft', 'center',  'topRight', 'topCenter', 'topLeft']` <br>**Type:** `string` <br>**Note:** This module config actual sets the location, not the magic mirror position config. **NOTE**
| `x`       | *Optional* (**required if y is used**) Window's left offset from screen. Takes precedence over `position`. <br>**Type:** `number` (pixels)
| `y`       | *Optional* (**required if x is used**) Window's left offset from screen. Takes precedence over `position`. <br>**Type:** `number` (pixels)
| `height`  | *Required* Height of the screencast window. <br>**Type:** `number` (pixels)
| `width`   | *Required* Width of the screencast window. <br>**Type:** `number` (pixels)
| `castName`| *Optional* The title to display in your device's cast list. <br>**Type** `string` defalt `os.hostname`
| `port`    | *Optional* A port to run the dialserver on **Type** `number` default `8569`
| `useIPv6` | *Optional* Forces `http` to use the unassigned IPv6 address `::/0` **Type** `booelan` default `false`
| `idleTimeoutSeconds` | *Optional* Auto-closes the cast window if playback is paused or stalled (currentTime not advancing) for this many seconds. <br>**Type:** `number` default `180` (3 min)
| `maxSessionHours` | *Optional* Unconditional hard cap: closes the cast window after this many hours regardless of playback activity (covers autoplay chains that outlive the sender). <br>**Type:** `number` default `12`|

## Notifications
MMM-Screencast can communicate with other modules through notifications.

### Emmited Notifications
These notifications are emitted by MMM-Screencast.

| Notification | Payload   | Description
|------------- |-----------|------------
| `MMM-Screencast:START-DIAL` | `{ port: <ORT_USED> }`  | Emitted when the DIAL server is running and the port it can be found on. The cast icon should be visible in your app now.
| `MMM-Screencast:LAUNCH-APP` | `{ app: <APP_NAME>, state: <APP_STATE> }` | Emitted when an app is intializing
| `MMM-Screencast:RUN-APP` | `{ app: <APP_NAME>, state: <APP_STATE> }` | Emitted when the app is intialized and running
| `MMM-Screencast:STOP-APP` | `{ app: <APP_NAME>, state: <APP_STATE> }` | Emitted when the app is stopped.
| `MMM-Screencast:CONFIG-ERROR` | `{ message: <MESSAGE_ABOUT_ERROR>}` | Emitted when there is an issue with the config.

### Listening Notifications
These are the notifications that can be sent to MMM-Screencast in order to control it in some way.

| Notification | Expected Payload | Description
|------------- |------------------|------------
| `MMM-Screencast:CLOSE` | none | This informs MMM-Screencast to close the currently running app. 

## Troubleshooting: device doesn't show up / stuck cast state

If the Pi stops showing up as a cast target, or a cast fails to start, the
DIAL server's internal state can get stuck after an interrupted or crashed
cast attempt (e.g. the sender disconnects mid-cast, or the app process dies
unexpectedly). Symptoms: the device is no longer listed in the sender app's
cast picker, or `GET /dial/apps/YouTube` on the module's port keeps reporting
a state other than `stopped` even though nothing is casting.

**Fix:** restart MagicMirror to reset the DIAL server's in-memory state:

```bash
pm2 restart MagicMirror
```

If that doesn't bring the device back (e.g. after a long-running session, or
if the network stack itself seems wedged), a full reboot of the device
clears everything and has reliably resolved it:

```bash
sudo reboot
```

You can check the current app state directly without waiting for the sender
app to refresh its list:

```bash
curl -s http://localhost:8569/dial/apps/YouTube
```

A healthy, idle server reports `<state>stopped</state>`.



## Screenshots

<p align="middle">
<img src="/screenshots/screenshot.png" width="400">
<img src="/screenshots/screenshot1.png" width="400">
<img src="/screenshots/screenshot2.jpg" width="400">
</p>

## Special Thanks and Contributors!
* [@Podgrade](https://github.com/Podgrade) - for the user agent fix
* [@Poolitzer](https://github.com/Poolitzer) - for the screenshots
* [@goldyfruit](https://github.com/goldyfruit) - for the autoclose PR

