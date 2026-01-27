# VideoCardWrapper Integration Guide

## How to Add Video Backgrounds to Room Cards

This wrapper adds animated video-like backgrounds to your room cards **without modifying the original RoomDashboardCard component**.

### Step 1: Import the VideoCardWrapper

In your `App.js`, add this import at the top:

```javascript
import { VideoCardWrapper } from "./components/VideoCardWrapper";
```

### Step 2: Wrap Your RoomDashboardCard

Find the section where `RoomDashboardCard` is rendered (around line 199 in App.js) and wrap it:

**Before:**

```jsx
<RoomDashboardCard
  key={room.id}
  room={{...room, ...}}
  onSelect={handleRoomSelect}
  isSelected={selectedRoomId === room.id}
  showDetailedView={false}
/>
```

**After:**

```jsx
<VideoCardWrapper
  key={room.id}
  roomType={room.type}
  status={room.status}
>
  <RoomDashboardCard
    room={{...room, ...}}
    onSelect={handleRoomSelect}
    isSelected={selectedRoomId === room.id}
    showDetailedView={false}
  />
</VideoCardWrapper>
```

### Room Types Supported

The wrapper automatically applies different animated backgrounds based on `roomType`:

| Room Type    | Background Effect           |
| ------------ | --------------------------- |
| `cryo`       | Deep blue/purple icy effect |
| `cold`       | Cool blue tones             |
| `freeze`     | Teal/cyan theme             |
| `ambient`    | Warm orange/amber           |
| `controlled` | Purple/indigo default       |

### Status Effects

The wrapper also applies visual status overlays:

| Status     | Effect              |
| ---------- | ------------------- |
| `optimal`  | Subtle green pulse  |
| `warning`  | Amber warning pulse |
| `critical` | Red alert pulse     |

### Props

| Prop        | Type    | Required | Description                                |
| ----------- | ------- | -------- | ------------------------------------------ |
| `roomType`  | string  | No       | Type of room (cryo, cold, freeze, ambient) |
| `status`    | string  | No       | Room status (optimal, warning, critical)   |
| `children`  | node    | Yes      | The RoomDashboardCard component            |
| `className` | string  | No       | Additional CSS classes                     |
| `darkMode`  | boolean | No       | Enable dark mode variant                   |

### Features Included

1. **Animated Gradient Background** - Smooth flowing gradients
2. **Floating Particles** - 12 animated particles rising
3. **Wave Effects** - 3 layered waves
4. **Data Stream Lines** - Horizontal scanning lines
5. **Status Pulse Overlays** - Visual feedback based on status
6. **Hover Effects** - Enhanced animations on hover
7. **Reduced Motion Support** - Respects user preferences
8. **Responsive Design** - Adapts to screen size
