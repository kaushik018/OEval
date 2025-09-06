# ObjectiveEval - Software Evaluation Platform

## Overview

ObjectiveEval is a SaaS platform for evaluating software applications based on objective metrics only. The system provides performance benchmarking, integration analysis, and reliability monitoring without relying on subjective user reviews. The platform focuses on measurable data including API response times, uptime statistics, supported integrations, and technical compatibility assessments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Session-based authentication integrated with Replit's OAuth system

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **File Structure**: Monorepo structure with shared schema between client and server

### Database Layer
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Design**: 
  - Users table for authentication
  - Applications table for tracked software
  - Performance metrics, integration analysis, and reliability metrics tables
  - Session storage for authentication state

### Authentication & Authorization
- **Provider**: Replit OAuth integration using OpenID Connect
- **Session Management**: Server-side sessions with secure HTTP-only cookies
- **Security**: CSRF protection and secure session configuration

### Core Services Architecture
- **Benchmark Service**: Automated performance testing with multiple test types (response time, load testing, stress testing)
- **AI Service**: OpenAI integration for documentation analysis and integration detection
- **Reliability Service**: Continuous uptime monitoring with configurable intervals
- **Storage Service**: Centralized data access layer with type-safe operations

### Key Design Patterns
- **Repository Pattern**: Storage service abstracts database operations
- **Service Layer**: Business logic separated into dedicated service classes
- **Shared Schema**: Common TypeScript types shared between frontend and backend
- **Type Safety**: End-to-end type safety using Drizzle ORM and shared interfaces

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migrations and schema management

### Authentication Services
- **Replit OAuth**: Primary authentication provider
- **OpenID Connect**: Standard authentication protocol implementation

### AI/ML Services
- **OpenAI API**: GPT models for documentation analysis and integration detection
- **Natural Language Processing**: Automated parsing of technical documentation

### Development & Deployment
- **Replit Platform**: Hosting and development environment
- **Vite**: Frontend build tooling and development server
- **TypeScript**: Type checking and compilation

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form management and validation

### Monitoring & Reliability
- **Built-in Uptime Monitoring**: Custom implementation for continuous service monitoring
- **Performance Benchmarking**: Custom test runners for API response times and load testing
- **Status Page Integration**: Automated collection from public service status pages