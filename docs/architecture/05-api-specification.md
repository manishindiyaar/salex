# 5. API Specification

## REST API Specification

This specification details the API that the React Native Merchant App will use to communicate with the backend for managing a salon. Authentication is handled via a JWT provided by Clerk.

```yaml
openapi: 3.0.1
info:
  title: Salex Merchant API (Salon Vertical)
  description: API for the Salex Merchant App to manage salon bookings, services, and business profiles.
  version: 1.0.0
servers:
  - url: /api/v1
    description: API version 1

# Security Scheme for Clerk JWT
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []

paths:
  /businesses/me:
    get:
      summary: Get the current user's business
      description: Fetches the business profile associated with the authenticated user.
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Business'
        '404':
          description: Business not found for this user.

  /businesses/{businessId}:
    put:
      summary: Update business details
      description: Allows the owner to update their business profile (name, hours, etc.).
      parameters:
        - in: path
          name: businessId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BusinessUpdateInput'
      responses:
        '200':
          description: Business updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Business'

  /businesses/{businessId}/bookings:
    get:
      summary: Get bookings for a salon
      description: Fetches a list of today's and upcoming bookings for a salon.
      parameters:
        - in: path
          name: businessId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A list of bookings.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Booking'

  /bookings/{bookingId}/cancel:
    patch:
      summary: Cancel a booking
      description: Allows a merchant to cancel an existing booking.
      parameters:
        - in: path
          name: bookingId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Booking cancelled successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Booking'

  /businesses/{businessId}/services:
    get:
      summary: List services for a salon
      description: Fetches all services configured for a specific salon.
      parameters:
        - in: path
          name: businessId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A list of services.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Service'
    post:
      summary: Create a new service
      description: Adds a new service to a salon's offerings.
      parameters:
        - in: path
          name: businessId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServiceCreateInput'
      responses:
        '201':
          description: Service created successfully.