# Commercial Real Estate Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a commercial real estate platform built with Next.js 15, TypeScript, and Tailwind CSS. The platform connects brands looking for commercial spaces with property owners who have spaces to list.

## Architecture Guidelines
- Use Next.js App Router (app directory structure)
- TypeScript for type safety
- Tailwind CSS for styling with modern design patterns
- Component-based architecture with reusable components
- Server-side rendering and API routes for backend functionality

## Key Features to Implement
1. **User Authentication & Roles**
   - Brand users (seeking properties)
   - Property owners (listing properties)
   - Admin dashboard

2. **Property Management**
   - Property listings with photos, details, pricing
   - Advanced search and filtering
   - Property comparison tools
   - Saved favorites

3. **User Dashboards**
   - Brand dashboard: saved properties, inquiries, requirements
   - Owner dashboard: manage listings, inquiries received, analytics

4. **Communication System**
   - Inquiry system between brands and owners
   - Messaging/chat functionality
   - Contact management

## Coding Standards
- Use functional components with hooks
- Follow TypeScript strict mode
- Implement proper error handling and loading states
- Use semantic HTML and accessibility best practices
- Mobile-first responsive design
- Clean, readable code with proper naming conventions

## File Structure
- `/src/app` - App router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions, API clients, database connections
- `/src/types` - TypeScript type definitions
- `/src/hooks` - Custom React hooks
