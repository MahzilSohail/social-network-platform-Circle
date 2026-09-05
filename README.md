# Circle — Social Network Platform

A front-end social networking platform built with plain HTML, CSS, and JavaScript — no frameworks, no backend server, and no build step. Just open `index.html` in a browser.

## Project Structure

```
SocialNetwork/
├── images/          # Post images (dashboard.png, desk.png, etc.)
├── index.html       # Page structure / markup
├── style.css        # All styling, including light & dark themes
├── script.js        # App logic, state, and real-time layer
└── .hintrc          # Linting configuration (webhint)
```

## Features

- **User profiles** — avatar, bio (editable), friends count, posts count, and a profile modal that respects each user's privacy setting.
- **Posts** — create posts with text and/or an image, edit or delete your own posts.
- **Comments** — add comments on any visible post; delete your own comments (or any comment on your own post).
- **Likes** — like/unlike posts, with a live like count.
- **Friend requests** — send, accept, decline, or cancel friend requests; remove existing friends.
- **Direct messages** — one-on-one chat between friends, with unread badges and a conversation list.
- **Notifications** — likes, comments, friend requests, and friend acceptances all generate a notification with a bell dropdown and unread badge.
- **Privacy settings** — control who can see your profile (Public / Friends / Only Me) and set a default audience for new posts (also overridable per-post).
- **Multimedia sharing** — attach an image to any post from the composer.
- **Saved posts** — bookmark posts and filter the feed to show only what you've saved.
- **Light & dark mode** — toggle from the top bar; the choice is remembered on your next visit.
- **Online presence** — a green dot shows which friends are currently active.
- **Typing indicator** — see when someone is typing a comment on a post, live.
- **Real-time updates** — implemented with the browser's `BroadcastChannel` API plus `localStorage` as a shared local "database." Every action (like, comment, message, friend request, etc.) is broadcast instantly to every other open tab.

## Running It

1. Keep `index.html`, `style.css`, `script.js`, and the `images/` folder together in the same directory.
2. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox).
3. No installation, server, or build step is required.

### Trying the real-time features

Open `index.html` in **two browser tabs**, and in each tab use the "Viewing as" switcher in the top bar to select a different demo user. Then like a post, send a comment, or send a friend request in one tab — it will appear instantly in the other, along with a toast notification, demonstrating the same publish/subscribe pattern a real WebSocket server would drive.

## How Real-Time Updates Work

In production, this feature would be powered by a `WebSocket` (or Socket.io) connection to a backend server that persists data in a database and pushes events to every connected client:

```js
const socket = new WebSocket("wss://api.circle.app/socket");
socket.onmessage = (e) => applyEvent(JSON.parse(e.data));
socket.send(JSON.stringify({ type: "like", postId }));
```

Since this project has no backend, the same event-driven contract is implemented client-side:

- **`localStorage`** acts as the shared "database" — every mutation (a new post, like, comment, message, etc.) is written here.
- **`BroadcastChannel`** acts as the "WebSocket" — after saving, the app broadcasts a `sync` event to every other open tab of the same page, which reloads the data and re-renders instantly.

This keeps the same architecture and event flow as a real backend, so swapping in an actual WebSocket server later is a drop-in replacement of the `RealtimeSocket` object in `script.js`.

## Demo Data

The app seeds itself with five demo users (including "Mahzil Sohail" as the default logged-in account), a handful of posts, an existing friendship, a pending friend request, and a short message thread — so every feature can be explored immediately without any setup.

## Notes

- All data is stored locally in the browser (`localStorage`); nothing is sent to a server.
- If the data model ever changes, the storage key in `script.js` (`DB_KEY`) should be bumped (e.g. `circle_db_v4` → `circle_db_v5`) so old cached data doesn't conflict with the new structure."# Social-Network-Platform-Circle" 
