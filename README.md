# Shift Tracker

A mobile-friendly shift and task management web app. Track your shift duration, manage daily tasks, plan ahead with a calendar, and review your shift history — all stored locally in your browser with no account or backend required.

---

## Features

### Shift Management
- **Start a shift** — live timer shows exactly how long you've been working
- **Check in** — log a progress snapshot at any point during your shift
- **End shift** — full summary with % complete, tasks done, tasks missed, check-in log, and total duration

### Task Management
- Add tasks with a title and category
- Check off tasks — logs the exact completion time
- Edit any task — change the title, category, or move it to a different day
- Delete tasks
- Filter tasks by **All**, **Pending**, or **Done**

### Categories
| Icon | Category |
|------|----------|
| ⚡ | Urgent |
| 🔄 | Routine |
| 📋 | Follow-up |
| 🏁 | Deadline |

### Calendar & Planning
- Full monthly calendar view
- Tap any day to see its tasks
- Add tasks to future days in advance
- Navigate forward and backward through months
- Task dots on each day — 🔵 blue = pending, 🟢 green = all done
- Copy all tasks from any day to today

### Rollover
- When ending a shift with unfinished tasks, choose to roll them over to tomorrow in one tap

### Storage
- All data saved locally via `localStorage`
- Persists between sessions — closing and reopening the app keeps everything
- Works fully offline after first load

---

## Deploy in 60 Seconds

### Vercel *(recommended)*
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EyasuTeshome/shifttracker)

1. Click the button above
2. Connect your GitHub account
3. Click **Deploy** — no settings to change

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/EyasuTeshome/shifttracker)

1. Click the button above
2. Connect your GitHub account
3. Click **Deploy site** — done

### GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `(root)`
4. Click **Save** — live in ~1 minute at `https://eyasuteshome.github.io/shifttracker`

### Local
Just open `index.html` in any browser — no server or install needed.

---

## Tech Stack

- **Vanilla HTML, CSS, JavaScript** — zero dependencies, zero build step
- **localStorage** — client-side persistence, works offline
- Single file (`index.html`) — easy to audit, fork, or embed

---

## Screenshots

| Today View | Calendar | Shift Summary |
|------------|----------|---------------|
| Task list with categories, filters, and shift timer | Monthly calendar with task dots | Full shift breakdown with rollover option |

---

## License

MIT — free to use, modify, and distribute.
