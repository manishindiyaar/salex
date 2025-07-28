# 16. Testing Strategy

Our strategy is based on the Testing Pyramid, which emphasizes a healthy mix of different types of tests.

## Testing Pyramid

We will write many fast, isolated unit tests, a good number of integration tests to check how parts work together, and a few high-level end-to-end tests for critical user flows.

```plaintext
          / \
         / _ \      <-- E2E Tests (Few, Slow, High-level)
        / ___ \
       / ----- \    <-- Integration Tests (More, Medium speed)
      / _______ \
     / _________ \  <-- Unit Tests (Lots, Fast, Isolated)
    /_____________\



Test Organization
Frontend Tests (apps/merchant-app)

Tools: Jest & React Native Testing Library.

Unit Tests: For individual components (atoms, molecules) and utility functions. Test files will be located alongside the component (e.g., PrimaryButton.test.tsx).

Integration Tests: For complete screens, testing the interaction between multiple components (e.g., a form organism and its button).

Backend Tests (apps/api)

Tools: Jest & Supertest.

Unit Tests: For services in isolation. Dependencies like the Prisma client will be mocked.

Integration Tests: For controllers and modules. These will test the full HTTP request/response flow for an endpoint against a test database, without calling real external APIs.

E2E (End-to-End) Tests

Tool: Maestro.

Scope: We will write E2E tests for the most critical "happy path" user flows only, such as:

Merchant Sign-In.

Viewing the Booking Dashboard.

Cancelling a Booking.

These tests will run the real React Native app against a full staging environment.

Test Examples
These examples provide a concrete pattern for developers to follow.

Frontend Component Test (PrimaryButton.test.tsx)

TypeScript

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from './PrimaryButton';

describe('PrimaryButton', () => {
  it('renders the button with the correct text', () => {
    const { getByText } = render(<PrimaryButton>Click Me</PrimaryButton>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls the onPress handler when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <PrimaryButton onPress={onPressMock}>Pressable</PrimaryButton>
    );
    fireEvent.press(getByText('Pressable'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
Backend API Test (bookings.controller.integration.spec.ts)

TypeScript

import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Assuming a main AppModule
import { ClerkAuthGuard } from '../src/modules/auth/clerk-auth.guard';

describe('BookingsController (Integration)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(ClerkAuthGuard).useValue({ canActivate: () => true }) // Mocking auth
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/GET businesses/:id/bookings', () => {
    return request(app.getHttpServer())
      .get('/businesses/some-business-id/bookings')
      .expect(200);
      // Further assertions on the response body would go here
  });

  afterAll(async () => {
    await app.close();
  });
});
E2E Test (signInFlow.yaml for Maestro)

YAML

appId: "com.salex.merchant"
---
- launchApp
- tapOn: "Sign In Button"
- tapOn: "Email Address Field"
- inputText: "merchant@test.com"
- tapOn: "Password Field"
- inputText: "password123"
- tapOn: "Submit Button"
- assertVisible: "Today's Bookings"