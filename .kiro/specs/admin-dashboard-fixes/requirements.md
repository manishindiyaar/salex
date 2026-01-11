# Requirements Document

## Introduction

This document specifies the requirements for fixing multiple issues in the Admin Dashboard and its integration with the Merchant App. The issues include broken API endpoints, incorrect API parameter naming, missing audit logging, and lack of business deactivation enforcement in the Merchant App.

## Glossary

- **Admin_Dashboard**: The web-based administrative interface for platform management
- **Merchant_App**: The React Native mobile application used by business owners
- **API_Server**: The Express.js backend serving both Admin Dashboard and Merchant App
- **Business**: A merchant entity registered on the platform
- **Subscription**: The billing plan associated with a Business
- **Audit_Log**: A record of administrative actions for compliance tracking
- **Deactivation**: The state where a Business is marked inactive by an admin

## Requirements

### Requirement 1: Dashboard Statistics Display

**User Story:** As an admin, I want to view platform statistics on the dashboard, so that I can monitor overall platform health and activity.

#### Acceptance Criteria

1. WHEN an admin navigates to the Dashboard page, THE Admin_Dashboard SHALL fetch and display total businesses count
2. WHEN an admin navigates to the Dashboard page, THE Admin_Dashboard SHALL fetch and display active businesses count
3. WHEN an admin navigates to the Dashboard page, THE Admin_Dashboard SHALL fetch and display total revenue
4. WHEN an admin navigates to the Dashboard page, THE Admin_Dashboard SHALL fetch and display total bookings count
5. IF the stats API returns an error, THEN THE Admin_Dashboard SHALL display a user-friendly error message
6. WHEN stats are loading, THE Admin_Dashboard SHALL display a loading indicator

### Requirement 2: Subscription Plan Change

**User Story:** As an admin, I want to change a business's subscription plan, so that I can upgrade or downgrade their access to features.

#### Acceptance Criteria

1. WHEN an admin selects a new plan and provides a reason, THE Admin_Dashboard SHALL send the correct plan parameter to the API
2. WHEN the plan change API succeeds, THE API_Server SHALL update the subscription plan in the database
3. WHEN the plan change API succeeds, THE API_Server SHALL create an audit log entry recording the change
4. WHEN the plan change succeeds, THE Admin_Dashboard SHALL refresh the business details to show the updated plan
5. IF the plan change fails, THEN THE Admin_Dashboard SHALL display the error message from the API
6. THE API_Server SHALL validate that the plan value is one of BASIC, PRO, or CUSTOM

### Requirement 3: Business Deactivation Toggle

**User Story:** As an admin, I want to activate or deactivate a business, so that I can manage platform access for policy violations or account issues.

#### Acceptance Criteria

1. WHEN an admin toggles business status, THE API_Server SHALL update the isActive field in the database
2. WHEN an admin toggles business status, THE API_Server SHALL create an audit log entry recording the change
3. WHEN the toggle succeeds, THE Admin_Dashboard SHALL refresh to show the updated status
4. IF the toggle fails, THEN THE Admin_Dashboard SHALL display the error message from the API

### Requirement 4: Deactivated Business Enforcement in Merchant App

**User Story:** As a platform operator, I want deactivated businesses to see a suspension notice in the Merchant App, so that they understand their account status and cannot perform business operations.

#### Acceptance Criteria

1. WHEN a business is deactivated, THE Merchant_App SHALL display a prominent "Account Suspended" banner
2. WHILE a business is deactivated, THE Merchant_App SHALL prevent creating new bookings
3. WHILE a business is deactivated, THE Merchant_App SHALL display a message instructing the user to contact admin
4. WHEN a deactivated business attempts to access features, THE Merchant_App SHALL show the suspension notice instead
5. WHEN a business is reactivated, THE Merchant_App SHALL remove the suspension banner and restore normal functionality

### Requirement 5: Templates Page Display

**User Story:** As an admin, I want to view and manage niche templates, so that I can configure business category defaults.

#### Acceptance Criteria

1. WHEN an admin navigates to the Templates page, THE Admin_Dashboard SHALL fetch and display all templates
2. WHEN templates are loading, THE Admin_Dashboard SHALL display a loading indicator
3. IF the templates API returns an error, THEN THE Admin_Dashboard SHALL display a user-friendly error message
4. WHEN templates are displayed, THE Admin_Dashboard SHALL show template name, niche, and business count

### Requirement 6: System Health Page Display

**User Story:** As an admin, I want to view system health status, so that I can monitor the operational status of platform services.

#### Acceptance Criteria

1. WHEN an admin navigates to the System Health page, THE Admin_Dashboard SHALL fetch and display service health status
2. WHEN health data is loading, THE Admin_Dashboard SHALL display a loading indicator
3. IF the health API returns an error, THEN THE Admin_Dashboard SHALL display a user-friendly error message
4. WHEN health data is displayed, THE Admin_Dashboard SHALL show status for Database, Supabase, WhatsApp API, and API Server

### Requirement 7: Audit Log Display

**User Story:** As an admin, I want to view audit logs, so that I can track administrative actions for compliance and troubleshooting.

#### Acceptance Criteria

1. WHEN an admin navigates to the Audit Logs page, THE Admin_Dashboard SHALL fetch and display audit log entries
2. WHEN audit logs are loading, THE Admin_Dashboard SHALL display a loading indicator
3. IF the audit logs API returns an error, THEN THE Admin_Dashboard SHALL display a user-friendly error message
4. WHEN audit logs are displayed, THE Admin_Dashboard SHALL show admin name, action, entity type, and timestamp
5. WHEN an admin action is performed (toggle status, change plan, record payment), THE API_Server SHALL create an audit log entry
