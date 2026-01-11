# Product Overview

Salex is a mobile-first business management platform designed for small to medium-sized service businesses in India, starting with salons. The platform solves operational challenges around appointment booking and queue management through WhatsApp integration.

## Core Value Proposition
- **For Merchants**: Simple business management app (React Native) to handle bookings, services, and analytics
- **For Customers**: Frictionless booking experience through WhatsApp (3 clicks or less)
- **Key Differentiator**: App-less customer experience via WhatsApp Cloud API integration

## Architecture Pattern
- **Aggregator Model**: Central platform connecting merchants and customers
- **Mobile-First**: React Native merchant app with WhatsApp customer interface
- **Serverless Backend**: NodeJs and ExpressJS with Supabase PostgreSQL
- **Authentication**: Phone OTP supabase JWT signed Auth for merchants.
## Current Status
The project is in active development with:
- Backend API endpoints tested and functional but it is in deprecated no more use cuz it used NestJS but i want NodeJs and ExpressJS.
- React Native frontend with UI/UX complete
- Focus on frontend-backend integration for production readiness

## Target Users
- **Primary**: Small salon owners managing appointments and queues
- **Secondary**: Customers booking services through WhatsApp
- **Geographic Focus**: India (Mumbai region deployment)