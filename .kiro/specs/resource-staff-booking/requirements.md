# Requirements Document

## Introduction

This feature implements a comprehensive Resource (Chairs/Rooms) and Staff Management system for Salex. It enables salon owners to configure their physical resources (chairs, beds, rooms) and staff members during business onboarding, with intelligent automatic allocation for bookings from any source (WhatsApp, manual, walk-in). The system ensures that bookings are always assigned to available resources and staff, preventing double-bookings and capacity conflicts.

## Glossary

- **Resource**: A physical bookable unit (chair, bed, room, station) where services are performed
- **Staff**: An employee who performs services (stylist, therapist, barber)
- **Booking**: An appointment that occupies a Resource and optionally a Staff member for a time period
- **Allocation**: The assignment of a Resource and Staff to a Booking
- **Capacity**: The maximum number of concurrent bookings a business can handle (determined by min(active_resources, active_staff))
- **Utilization**: The percentage of time a Resource or Staff is booked
- **Auto-Assignment**: Automatic selection of the best available Resource and Staff for a booking
- **Manual-Assignment**: Owner explicitly selects Resource and/or Staff for a booking

## Requirements

### Requirement 1: Resource Management

**User Story:** As a salon owner, I want to configure my physical resources (chairs/rooms), so that the system can track and allocate them for bookings.

#### Acceptance Criteria

1. WHEN a business is created, THE System SHALL prompt the owner to configure their resources during onboarding
2. WHEN an owner adds a resource, THE System SHALL require a name and allow optional description
3. WHEN an owner creates multiple resources, THE System SHALL auto-generate names (Chair 1, Chair 2, etc.) if not provided
4. THE System SHALL allow owners to activate or deactivate resources without deleting them
5. WHEN a resource has active bookings, THE System SHALL prevent deactivation until bookings are completed or reassigned
6. THE System SHALL enforce unique resource names within a business
7. WHEN listing resources, THE System SHALL show utilization statistics for each resource

### Requirement 2: Staff Management

**User Story:** As a salon owner, I want to manage my staff members, so that I can assign them to bookings and track their schedules.

#### Acceptance Criteria

1. WHEN a business is created, THE System SHALL prompt the owner to add staff members during onboarding
2. WHEN an owner adds a staff member, THE System SHALL require a name and allow optional phone number
3. THE System SHALL allow owners to activate or deactivate staff without deleting them
4. WHEN a staff member has active bookings, THE System SHALL prevent deactivation until bookings are completed or reassigned
5. THE System SHALL enforce unique staff names within a business
6. WHEN listing staff, THE System SHALL show utilization statistics for each staff member
7. THE System SHALL allow staff to be optionally linked to specific resources (e.g., "Raj always uses Chair 1")

### Requirement 3: Capacity Validation

**User Story:** As a salon owner, I want the system to validate my configuration, so that I don't have more resources than staff can handle.

#### Acceptance Criteria

1. WHEN resources and staff are configured, THE System SHALL calculate effective capacity as min(active_resources, active_staff)
2. WHEN effective capacity is zero, THE System SHALL warn the owner and prevent booking creation
3. IF staff count is less than resource count, THEN THE System SHALL display a warning suggesting to add more staff or reduce resources
4. IF resource count is less than staff count, THEN THE System SHALL display a warning suggesting to add more resources
5. WHEN capacity changes due to deactivation, THE System SHALL recalculate and warn if capacity drops below active bookings

### Requirement 4: Automatic Booking Allocation

**User Story:** As a salon owner, I want bookings to be automatically assigned to available resources and staff, so that I don't have to manually manage every booking.

#### Acceptance Criteria

1. WHEN a booking is created without explicit resource/staff selection, THE System SHALL auto-assign the best available resource and staff
2. THE Auto-Assignment Algorithm SHALL prioritize resources and staff with lowest utilization (load balancing)
3. WHEN a staff member is linked to a specific resource, THE System SHALL prefer assigning them together
4. WHEN no resources are available for the requested time, THE System SHALL reject the booking with a clear message
5. WHEN no staff are available for the requested time, THE System SHALL reject the booking with a clear message
6. THE System SHALL use database transactions to prevent race conditions during allocation
7. WHEN a booking comes from WhatsApp, THE System SHALL auto-assign and include resource/staff names in the confirmation message

### Requirement 5: Manual Booking Allocation

**User Story:** As a salon owner, I want to manually select resources and staff for bookings, so that I have control when needed.

#### Acceptance Criteria

1. WHEN creating a booking manually, THE System SHALL show available resources and staff for the selected time
2. THE Owner SHALL be able to select a specific resource from the available list
3. THE Owner SHALL be able to select a specific staff member from the available list
4. IF the selected resource or staff becomes unavailable, THEN THE System SHALL show an error and suggest alternatives
5. WHEN editing a booking, THE System SHALL allow changing the assigned resource and staff

### Requirement 6: Business Onboarding Configuration

**User Story:** As a new salon owner, I want a guided setup process for resources and staff, so that my business is properly configured before accepting bookings.

#### Acceptance Criteria

1. WHEN a new business is created, THE System SHALL guide the owner through a multi-step onboarding wizard
2. THE Onboarding Wizard SHALL include steps for: Business Info → Resources Setup → Staff Setup → Services Setup → Review
3. WHEN the owner specifies number of chairs, THE System SHALL auto-create resources with default names
4. WHEN the owner adds staff, THE System SHALL optionally allow linking staff to specific resources
5. THE System SHALL validate configuration completeness before allowing booking creation
6. IF onboarding is incomplete, THEN THE System SHALL show a setup completion banner with remaining steps
7. THE System SHALL allow owners to skip optional steps and complete them later

### Requirement 7: Booking Display with Allocation

**User Story:** As a salon owner, I want to see which resource and staff are assigned to each booking, so that I can manage my salon efficiently.

#### Acceptance Criteria

1. WHEN displaying a booking, THE System SHALL show the assigned resource name and staff name
2. WHEN displaying the timeline view, THE System SHALL organize bookings by resource (columns) and time (rows)
3. THE Timeline View SHALL show staff assignments within each booking block
4. WHEN a walk-in customer arrives, THE System SHALL show available resources and staff in real-time
5. THE System SHALL provide a quick-book feature that auto-assigns and creates a booking in one tap

### Requirement 8: WhatsApp Booking Integration

**User Story:** As a customer booking via WhatsApp, I want to receive confirmation with my assigned chair/staff, so that I know where to go when I arrive.

#### Acceptance Criteria

1. WHEN a WhatsApp booking is confirmed, THE System SHALL include the resource name in the confirmation message
2. WHEN a WhatsApp booking is confirmed, THE System SHALL include the staff name in the confirmation message
3. IF the customer has a preferred staff member, THEN THE System SHALL attempt to assign that staff if available
4. WHEN sending booking reminders, THE System SHALL include resource and staff information

### Requirement 9: Resource-Staff Linking (Optional)

**User Story:** As a salon owner, I want to optionally link staff to specific resources, so that certain staff always use certain chairs.

#### Acceptance Criteria

1. THE System SHALL allow optional linking of a staff member to a specific resource
2. WHEN a staff member is linked to a resource, THE Auto-Assignment Algorithm SHALL prefer assigning them together
3. THE System SHALL allow multiple staff to be linked to the same resource (for shift coverage)
4. THE System SHALL allow a staff member to be linked to multiple resources
5. WHEN the linked resource is unavailable, THE System SHALL fall back to any available resource

### Requirement 10: Availability Checking

**User Story:** As a salon owner, I want to check availability before creating bookings, so that I can find open slots quickly.

#### Acceptance Criteria

1. WHEN checking availability, THE System SHALL return all available resources and staff for the requested time
2. THE Availability Response SHALL include utilization data for each available resource and staff
3. THE System SHALL suggest the optimal resource-staff combination based on load balancing
4. WHEN multiple time slots are requested, THE System SHALL return availability for each slot
5. THE System SHALL support checking availability for a specific resource or staff member
