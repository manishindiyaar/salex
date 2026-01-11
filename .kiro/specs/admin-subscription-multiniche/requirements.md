# Requirements Document

## Introduction

This specification defines the Admin Dashboard, Subscription Management System, and Multi-Niche Feature Module architecture for the Salex platform. The system enables platform operators to manage businesses, enforce subscription tiers, and dynamically configure features based on business category (niche). The architecture follows a modular "building blocks" approach where features are pre-built modules that can be assigned to businesses based on their niche template or individual configuration.

## Glossary

- **Admin_Dashboard**: Web-based control panel for Salex platform operators to manage businesses, subscriptions, and system configuration
- **Subscription**: A business's paid plan that determines feature access and billing cycle
- **Niche_Template**: Pre-configured combination of feature modules, terminology, and defaults for a specific business category (e.g., Clinic, Salon, Spa)
- **Feature_Module**: A discrete, self-contained capability that can be enabled/disabled per business (e.g., appointment_booking, walk_in_queue, prescription_management)
- **Business_Category**: The type of service business (SALON, CLINIC, SPA, FITNESS, etc.)
- **Terminology_Config**: Dynamic labels used throughout the app based on business category (e.g., "Chair" vs "Room", "Stylist" vs "Doctor")
- **Plan_Tier**: Subscription level (BASIC, PRO, CUSTOM) that determines available features
- **Admin_User**: Platform operator with elevated privileges to manage the system
- **Feature_Access_Service**: Backend service that checks if a business can access a specific feature

## Requirements

### Requirement 1: Admin Authentication and Authorization

**User Story:** As a platform operator, I want to securely log into the Admin Dashboard, so that I can manage businesses and platform settings.

#### Acceptance Criteria

1. WHEN an admin user visits the Admin Dashboard login page, THE Admin_Dashboard SHALL display an email/password login form
2. WHEN an admin user submits valid credentials, THE Admin_Dashboard SHALL authenticate via Supabase Auth and redirect to the dashboard
3. WHEN an admin user submits invalid credentials, THE Admin_Dashboard SHALL display an error message and remain on the login page
4. WHILE an admin user is authenticated, THE Admin_Dashboard SHALL include the JWT token in all API requests
5. WHEN an unauthenticated request is made to admin API endpoints, THE API SHALL return a 401 Unauthorized response
6. WHEN a non-admin user attempts to access admin endpoints, THE API SHALL return a 403 Forbidden response
7. THE Admin_User model SHALL support roles: SUPER_ADMIN, ADMIN, SUPPORT with different permission levels

---

### Requirement 2: Business Management in Admin Dashboard

**User Story:** As a platform operator, I want to view and manage all businesses on the platform, so that I can monitor activity and handle support issues.

#### Acceptance Criteria

1. WHEN an admin views the businesses list, THE Admin_Dashboard SHALL display all businesses with name, plan, status, payment status, and last activity
2. WHEN an admin searches for a business, THE Admin_Dashboard SHALL filter results by business name, phone number, or routing code
3. WHEN an admin filters by plan or status, THE Admin_Dashboard SHALL show only matching businesses
4. WHEN an admin clicks on a business, THE Admin_Dashboard SHALL display detailed information including bookings, revenue, resources, and staff
5. THE Admin_Dashboard SHALL display platform-wide statistics including total businesses, active count, revenue, and booking metrics
6. WHEN an admin exports business data, THE Admin_Dashboard SHALL generate a CSV file with selected fields

---

### Requirement 3: Business Status Toggle

**User Story:** As a platform operator, I want to toggle a business's active status, so that I can suspend businesses with overdue payments or policy violations.

#### Acceptance Criteria

1. WHEN an admin toggles a business to inactive, THE System SHALL set isActive=false in the database
2. WHEN a business is inactive and a customer attempts WhatsApp booking, THE WhatsApp_Router SHALL respond with "This business is temporarily unavailable"
3. WHEN a business is inactive, THE Merchant_App SHALL display a prominent "Account Suspended" banner
4. WHEN a business is inactive, THE System SHALL block new booking creation but preserve existing bookings
5. WHEN an admin toggles a business to active, THE System SHALL restore full functionality immediately
6. THE Admin_Dashboard SHALL require confirmation before toggling business status
7. THE System SHALL log all status toggle actions with admin ID, timestamp, and reason

---

### Requirement 4: Subscription Model and Plan Tiers

**User Story:** As a platform operator, I want to manage subscription plans for businesses, so that I can monetize the platform and control feature access.

#### Acceptance Criteria

1. THE System SHALL support three plan tiers: BASIC (₹500/month), PRO (₹1,500/month), CUSTOM (₹3,000+/month)
2. WHEN a new business is created, THE System SHALL create a Subscription record with TRIAL status and 7-day trial period
3. WHEN a trial expires without payment, THE System SHALL transition subscription status to EXPIRED
4. WHEN payment is recorded, THE System SHALL transition subscription status to ACTIVE and set billing period
5. WHEN a subscription enters GRACE period (7 days after due date), THE System SHALL send reminder notifications
6. WHEN GRACE period expires without payment, THE System SHALL transition to EXPIRED and restrict features
7. THE Subscription model SHALL track: plan, status, trialEndsAt, currentPeriodStart, currentPeriodEnd, cancelledAt

---

### Requirement 5: Feature Access Control

**User Story:** As a platform operator, I want features to be restricted based on subscription plan, so that businesses are incentivized to upgrade.

#### Acceptance Criteria

1. THE Feature_Access_Service SHALL check business isActive status before allowing any feature access
2. THE Feature_Access_Service SHALL check subscription status (TRIAL or ACTIVE) before allowing feature access
3. WHEN a BASIC plan business attempts WhatsApp booking, THE System SHALL deny access and suggest upgrade
4. WHEN a PRO plan business attempts to use own WhatsApp number, THE System SHALL deny access and suggest Custom plan
5. THE System SHALL enforce the following feature matrix:
   - BASIC: walk_in_booking, service_management, resource_management, staff_management, basic_analytics
   - PRO: All BASIC + whatsapp_booking, customer_history, automated_reminders, advanced_analytics
   - CUSTOM: All PRO + own_whatsapp_number, website_widget, custom_branding, api_access
6. WHEN checking feature access, THE Feature_Access_Service SHALL return a clear reason if access is denied

---

### Requirement 6: Manual Payment Recording

**User Story:** As a platform operator, I want to manually record payments received via GPay/UPI, so that I can track revenue and activate subscriptions.

#### Acceptance Criteria

1. WHEN an admin records a payment, THE Admin_Dashboard SHALL capture: amount, payment method, transaction reference, period dates, and notes
2. WHEN a payment is recorded, THE System SHALL create a PaymentRecord and update subscription status to ACTIVE
3. WHEN a payment is recorded, THE System SHALL set currentPeriodEnd based on the plan's billing cycle (30 days)
4. THE Admin_Dashboard SHALL display payment history for each business with all recorded payments
5. THE Admin_Dashboard SHALL show total platform revenue with filtering by date range
6. THE PaymentRecord model SHALL track: subscriptionId, amount, currency, paymentMethod, transactionRef, periodStart, periodEnd, recordedBy

---

### Requirement 7: Niche Template Configuration

**User Story:** As a platform operator, I want to configure niche templates in the Admin Dashboard, so that new business categories can be added without code changes.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a list of all niche templates with their configuration
2. WHEN an admin creates a niche template, THE System SHALL store: code, displayName, icon, terminology, enabledModules, defaultServices, defaultHours, messageTemplates
3. WHEN an admin edits a niche template, THE System SHALL update the configuration and apply to new businesses of that category
4. THE Terminology_Config SHALL include mappings for: resource, resourcePlural, staff, staffPlural, service, servicePlural, booking, bookingPlural, customer, customerPlural
5. WHEN a business selects a category during onboarding, THE System SHALL apply the corresponding niche template's defaults
6. THE System SHALL support at minimum: SALON, BEAUTY_PARLOR, SPA, CLINIC, FITNESS, OTHER categories

---

### Requirement 8: Feature Module System

**User Story:** As a platform operator, I want to enable/disable specific feature modules for individual businesses, so that I can customize the experience beyond niche templates.

#### Acceptance Criteria

1. THE System SHALL define feature modules as discrete capabilities: appointment_booking, walk_in_queue, resource_management, staff_management, prescription_management, class_scheduling, membership_system, package_deals
2. WHEN a niche template is applied, THE System SHALL enable the template's default modules for the business
3. WHEN an admin overrides a module for a specific business, THE BusinessModuleConfig SHALL store the override
4. THE Feature_Access_Service SHALL check both plan restrictions AND module enablement before granting access
5. THE Admin_Dashboard SHALL display enabled modules per business with toggle controls
6. WHEN a module is disabled for a business, THE Merchant_App SHALL hide the corresponding UI components

---

### Requirement 9: Dynamic Terminology in Merchant App

**User Story:** As a merchant, I want the app to use terminology appropriate for my business type, so that the interface feels natural and relevant.

#### Acceptance Criteria

1. WHEN a business has category CLINIC, THE Merchant_App SHALL display "Rooms" instead of "Chairs" for resources
2. WHEN a business has category CLINIC, THE Merchant_App SHALL display "Doctors" instead of "Staff" for staff members
3. WHEN a business has category CLINIC, THE Merchant_App SHALL display "Appointments" instead of "Bookings"
4. THE Merchant_App SHALL use a useCategoryConfig hook to retrieve terminology based on business category
5. THE Merchant_App SHALL apply terminology consistently across all screens: onboarding, dashboard, management screens
6. WHEN terminology is updated in a niche template, THE Merchant_App SHALL reflect changes on next app launch

---

### Requirement 10: Dynamic Onboarding Flow

**User Story:** As a new merchant, I want the onboarding flow to be customized for my business type, so that setup is relevant and efficient.

#### Acceptance Criteria

1. WHEN a merchant selects business type during onboarding, THE Merchant_App SHALL load the corresponding niche template
2. WHEN displaying resource setup, THE Merchant_App SHALL use the template's resource terminology (e.g., "How many rooms do you have?")
3. WHEN displaying staff setup, THE Merchant_App SHALL use the template's staff terminology (e.g., "Add your doctors")
4. WHEN displaying service setup, THE Merchant_App SHALL pre-populate with the template's default services
5. WHEN displaying hours setup, THE Merchant_App SHALL pre-fill with the template's default hours
6. THE Onboarding flow SHALL only show steps relevant to the enabled modules for that niche

---

### Requirement 11: WhatsApp Message Customization

**User Story:** As a platform operator, I want WhatsApp messages to be customized per business category, so that customer communication feels appropriate.

#### Acceptance Criteria

1. WHEN a customer initiates a WhatsApp conversation, THE System SHALL use the business's niche template welcome message
2. WHEN displaying services in WhatsApp, THE System SHALL use the template's service terminology
3. WHEN confirming a booking via WhatsApp, THE System SHALL use terminology appropriate to the business category
4. THE Niche_Template SHALL store message templates for: welcome, serviceList, bookingConfirmation, reminder, cancellation
5. WHEN a message template contains placeholders, THE System SHALL substitute with actual business/booking data

---

### Requirement 12: Subscription Display in Merchant App

**User Story:** As a merchant, I want to see my subscription status in the app, so that I know my plan and when payment is due.

#### Acceptance Criteria

1. THE Merchant_App Profile screen SHALL display current plan name and status
2. WHEN subscription status is TRIAL, THE Merchant_App SHALL show days remaining in trial
3. WHEN subscription status is GRACE, THE Merchant_App SHALL show a warning banner with payment instructions
4. WHEN subscription status is EXPIRED, THE Merchant_App SHALL show a prominent alert with contact information
5. THE Merchant_App SHALL display next billing date for ACTIVE subscriptions
6. WHEN a feature is restricted by plan, THE Merchant_App SHALL show an upgrade prompt with plan comparison

---

### Requirement 13: Admin Dashboard System Health

**User Story:** As a platform operator, I want to monitor system health from the Admin Dashboard, so that I can quickly identify and resolve issues.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display health status for: API Server, Database, WhatsApp API, Supabase
2. WHEN a service is unhealthy, THE Admin_Dashboard SHALL display a red indicator and error details
3. THE Admin_Dashboard SHALL provide quick actions: Clear Cache, Sync WhatsApp, View Logs
4. THE Admin_Dashboard SHALL display key metrics: requests/minute, error rate, average response time
5. THE /v1/admin/health endpoint SHALL return status of all dependent services

---

### Requirement 14: Audit Logging

**User Story:** As a platform operator, I want all admin actions to be logged, so that I can track changes and investigate issues.

#### Acceptance Criteria

1. WHEN an admin toggles business status, THE System SHALL log the action with adminId, businessId, previousStatus, newStatus, reason, timestamp
2. WHEN an admin records a payment, THE System SHALL log the action with adminId, subscriptionId, amount, timestamp
3. WHEN an admin modifies a niche template, THE System SHALL log the action with adminId, templateId, changes, timestamp
4. WHEN an admin overrides a business module, THE System SHALL log the action with adminId, businessId, moduleCode, enabled, timestamp
5. THE Admin_Dashboard SHALL provide an audit log viewer with filtering by admin, action type, and date range
