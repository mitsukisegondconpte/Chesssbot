# Overview

This is a full-stack chess application that combines a Telegram bot for chess gameplay with a web-based administration dashboard. The project provides a comprehensive chess platform where users can play against the Stockfish engine through Telegram, while administrators can monitor and manage the system through a modern React web interface.

The application features a complete chess ecosystem including user management, game tracking, tournament organization, ELO rating calculations, game analysis, and notification systems. The Telegram bot serves as the primary user interface for gameplay, while the web dashboard provides administrative oversight and analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Dark/light mode support with context-based theme provider
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database interactions
- **Database Provider**: Neon serverless PostgreSQL for cloud hosting
- **API Design**: RESTful endpoints organized by domain (users, games, tournaments, analytics)
- **Chess Engine**: Stockfish integration for AI gameplay and position analysis
- **Bot Framework**: Telegram Bot API for interactive chess gameplay

## Data Storage Solutions
- **Primary Database**: PostgreSQL with the following key schemas:
  - Users table with ELO ratings, game statistics, and profile information
  - Games table storing board states (FEN), move history (PGN), and game metadata
  - Tournaments table with participant management and bracket systems
  - Notifications table for user communication
  - Game analyses table for position evaluations and move classifications
- **Session Storage**: In-memory storage for active Telegram bot sessions
- **File Storage**: Temporary storage for chess board images and game exports

## Authentication and Authorization
- **Telegram Authentication**: Bot token-based authentication for Telegram users
- **User Identification**: Telegram user IDs as primary identifiers
- **Admin Access**: Owner ID-based administrative privileges
- **Session Management**: Telegram chat sessions with game state persistence

## Chess Engine Integration
- **Stockfish Engine**: External chess engine for move generation and analysis
- **Skill Levels**: Configurable difficulty from beginner to master level
- **Position Analysis**: Deep position evaluation with move classification
- **Game Analysis**: Post-game analysis with accuracy calculations and improvement suggestions

## External Dependencies

- **Telegram Bot API**: Core integration for user interaction and game interface
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connections
- **Stockfish Chess Engine**: AI opponent and analysis engine
- **Drizzle Kit**: Database migration and schema management
- **Cairo SVG**: Chess board rendering to PNG images for Telegram
- **React Query**: Client-side data fetching and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework

The architecture supports real-time chess gameplay through Telegram while providing comprehensive administrative tools through the web interface. The system is designed for scalability with serverless database hosting and modular service architecture.