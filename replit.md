# Resource Scheduling Calendar

## Overview

A resource scheduling calendar application that enables visualization and management of events across multiple resources. The system provides a grid-based interface for scheduling appointments, meetings, room bookings, and task assignments. Built with a modern React frontend using shadcn/ui components and an Express backend, with data persistence using Drizzle ORM.

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
- **Resources Table**: Stores schedulable entities (doctors, rooms, technicians)
  - Fields: id (UUID), name, type, color
- **Events Table**: Stores scheduling entries
  - Fields: id (UUID), title, resourceId (foreign key), startTime, endTime, description, color, category

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