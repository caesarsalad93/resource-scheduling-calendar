# Resource Scheduling Calendar - Design Guidelines

## Design Approach

**Selected Approach**: Design System with Modern Productivity Influences

Drawing inspiration from Linear's clean interface, Google Calendar's functional layout, and Notion's data flexibility. Focus on clarity, efficiency, and seamless interaction patterns that prioritize usability over decoration.

**Core Principles**:
- Information clarity over visual embellishment
- Efficient scanning and quick comprehension
- Purposeful use of space for data density
- Consistent, predictable interaction patterns

---

## Typography System

**Font Family**: Inter or SF Pro from Google Fonts CDN

**Hierarchy**:
- Page Titles: 24px/32px, semibold (600)
- Section Headers: 18px/24px, semibold (600)
- Resource Labels: 14px/20px, medium (500)
- Event Titles: 13px/18px, medium (500)
- Time Labels: 12px/16px, regular (400)
- Meta Information: 11px/14px, regular (400)

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 3, 4, 6, 8**
- Tight spacing: p-2, gap-2
- Standard spacing: p-4, gap-4, m-4
- Generous spacing: p-6, p-8
- Section separation: mb-8, mt-6

**Grid Structure**:
- Calendar grid uses CSS Grid for precise time-slot alignment
- Main container: max-w-full with controlled padding
- Sidebar (resource list): Fixed width 200-240px
- Calendar area: flex-1 with horizontal scroll for overflow

---

## Component Library

### Navigation & Controls
- **Top Toolbar**: Fixed header with view switcher (Day/Week/Month), date navigation arrows, "Today" button, and primary "Create Event" action
- **View Controls**: Segmented button group for switching between calendar views
- **Date Picker**: Dropdown calendar for quick navigation to specific dates

### Resource Management
- **Resource Sidebar**: Vertical list showing all resources with avatars/icons, names, and optional status indicators
- **Resource Header Row**: Each resource gets a dedicated row in the calendar grid
- **Add Resource Button**: Positioned at bottom of sidebar with subtle ghost button style

### Calendar Grid
- **Time Column**: Fixed-width column on left showing time slots (hourly/30min intervals)
- **Grid Cells**: Each cell represents a time slot for a specific resource
- **Grid Lines**: Subtle borders (opacity 10-15%) creating clear delineation between slots
- **Current Time Indicator**: Vertical red line showing current moment in time-based views

### Event Components
- **Event Block**: Rounded rectangle (4px radius) spanning appropriate time duration
- **Event Title**: Truncated with ellipsis, tooltip on hover showing full details
- **Event Metadata**: Small icons or badges for category, duration, or status
- **Event Actions**: Hidden by default, revealed on hover with edit/delete icons

### Forms & Modals
- **Create/Edit Event Modal**: Centered overlay with form fields for event details (title, resource, start/end time, description)
- **Resource Creation Dialog**: Compact form for adding new resources
- **Confirmation Dialogs**: Simple alert-style modals for destructive actions

### Data Display
- **Empty States**: Friendly illustrations with "No events scheduled" messaging and quick-add buttons
- **Loading States**: Skeleton screens matching calendar grid structure
- **Conflict Indicators**: Warning badges when events overlap for same resource

---

## Interaction Patterns

**Drag & Drop**:
- Events draggable to different time slots or resources
- Visual preview showing where event will land
- Snap-to-grid behavior for clean alignment

**Event Creation**:
- Click empty grid cell to quick-create event at that time/resource
- Double-click for detailed event creation modal

**Calendar Navigation**:
- Click resource name to filter/highlight that resource's events
- Horizontal scroll for week/month views with many resources
- Keyboard shortcuts: Arrow keys for date navigation, N for new event

---

## Responsive Behavior

**Desktop (1024px+)**:
- Full grid layout with sidebar
- Multiple resources visible simultaneously

**Tablet (768-1023px)**:
- Collapsible sidebar
- Reduced number of visible resources, horizontal scroll enabled

**Mobile (<768px)**:
- Stack to single-resource view
- Bottom sheet for resource switching
- Simplified day/week views only
- Event details open in full-screen modal

---

## Visual Hierarchy

**Primary Focus**: Calendar grid and events
**Secondary Elements**: Toolbars, navigation controls
**Tertiary Elements**: Resource metadata, time labels

**Emphasis Techniques**:
- Event blocks have slightly elevated shadow (subtle)
- Selected/active resource row has background tint
- Current day column highlighted with subtle background
- Hover states use opacity shifts (80-90%) not color changes

---

## Images

This application does NOT require a hero image. It's a utility application focused on data visualization and scheduling efficiency. All visual interest comes from the calendar interface itself and the organized presentation of scheduling data.