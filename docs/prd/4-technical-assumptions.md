# 4. Technical Assumptions

## Repository Structure: Monorepo

The project will be developed within a single monorepo, managed by **Turborepo**. This structure will contain the backend API, the React Native merchant app, and any shared packages (like `shared-types`), ensuring code and type consistency across the entire stack.

## Service Architecture

The backend will be built using a **Serverless Architecture**. The NestJS application will be deployed as serverless functions on Vercel. This approach is chosen for its automatic scalability, reliability, and cost-effectiveness, aligning with our core product principles.

## Testing Requirements

The project will adhere to a **Full Testing Pyramid** strategy to ensure high quality and reliability. This includes:
* **Unit Tests** for isolated functions and components (Jest & React Native Testing Library).
* **Integration Tests** for backend modules and API endpoints (Jest & Supertest).
* **End-to-End (E2E) Tests** for critical user flows in the merchant app (Maestro).

## Additional Technical Assumptions and Requests

The following technical stack decisions, finalized during the architectural planning phase, are considered foundational requirements for the project:

* **Platform:** The primary platform will consist of **Vercel** for hosting and serverless functions, and **Supabase** for the PostgreSQL database and file storage.
* **Authentication:** All user authentication and session management will be handled by **Clerk**.
* **Core Frameworks:** The merchant app will be built with **React Native**, and the backend API will be built with **NestJS**.
* **Database & ORM:** The database will be **PostgreSQL**, and all data access will be managed through the **Prisma** ORM for end-to-end type-safety.
* **Language:** **TypeScript** will be used for the entire stack (frontend, backend, and shared packages) to ensure code quality and consistency.