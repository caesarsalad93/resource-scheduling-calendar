# Resource Scheduling Calendar

## Overview

A read-only resource scheduling calendar for convention/expo events. Displays events by resource (called "Panels") in a grid layout with day-view display. Panels appear as column headers with their daily events displayed below in time slots. Supports category-based color coding and saved view presets. Data syncs from Airtable to PostgreSQL to avoid API rate limits.

## Important Documentation

- **DEBUGGING_NOTES.md** - Critical debugging lessons and quirks discovered during development. READ THIS FIRST if troubleshooting issues.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: shadcn/ui components built on Radix UI primitives
- Follows "new-york" style variant from shadcn/ui
- Custom Tailwind configuration with CSS variables for theming
- Component library includes dialogs, forms, calendars, and interactive elements

**Design Philosophy**: 
- Inspired by Linear, Google Calendar, and Notion
- Focus on information clarity, efficient data scanning, and consistent interaction patterns
- Typography uses Inter or SF Pro with defined hierarchy (page titles at 24px, event titles at 13px)
- Spacing system based on Tailwind units (2, 3, 4, 6, 8)

**State Management**:
- TanStack Query (React Query) for server state management
- Local React state for UI interactions
- Custom hooks pattern for reusable logic

**Routing**: Wouter for lightweight client-side routing

**Key Features**:
- Calendar grid with day/week/month views
- Resource sidebar for filtering and navigation
- Event creation and editing dialogs
- Theme toggle supporting light/dark modes
- Drag-and-drop scheduling interface

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API architecture with `/api` prefix for all application routes

**Development Features**:
- Hot module replacement via Vite in development
- Runtime error overlay for debugging
- Request logging middleware tracking duration and responses

**Data Layer**: 
- Storage abstraction interface (`IStorage`) for CRUD operations
- In-memory storage implementation (`MemStorage`) for development/testing
- UUID-based resource identification

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`)

**Schema Design**:
- **Panels Table**: Stores schedulable resources (convention panels, booths, stages)
  - Fields: id (UUID), name, type, color, location
  - Types: Autograph, Exclusive, Panel, Cart, Media
- **Events Table**: Stores scheduling entries
  - Fields: id (UUID), title, panelId (foreign key), startTime, endTime, description, color, category, location
  - Categories: autograph, exclusive, panel, cart, media, miscellaneous

**Airtable Integration**:
- Data syncs from Airtable via `POST /api/sync/airtable`
- Requires: AIRTABLE_API_TOKEN (secret), AIRTABLE_BASE_ID (env var)
- Clears and reloads all data on each sync
- Times are parsed as local time (Z suffix stripped)

**Validation**: Zod schemas derived from Drizzle table definitions for runtime type safety

**Migration Strategy**: Uses drizzle-kit with migrations stored in `/migrations` directory

### External Dependencies

**Database**: 
- PostgreSQL via Neon serverless driver
- Connection configured through `DATABASE_URL` environment variable
- Session storage using `connect-pg-simple` for Express sessions

**Third-Party UI Libraries**:
- Radix UI component primitives (accordion, dialog, dropdown, popover, etc.)
- Embla Carousel for carousel interactions
- date-fns for date manipulation
- Lucide React for icons
- cmdk for command palette functionality

**Form Handling**:
- React Hook Form for form state management
- Hookform resolvers with Zod for validation
- Type-safe form schemas

**Styling**:
- Tailwind CSS with custom configuration
- PostCSS for processing
- CSS variables for dynamic theming
- class-variance-authority (cva) for component variants
- clsx and tailwind-merge for conditional classes

**Development Tools**:
- TypeScript for type safety
- ESBuild for production builds
- Replit-specific plugins for development environment integration
- tsx for TypeScript execution in development