# Premium Salon App User Story

Document status: Draft  
Audience: Junior developers, coding agents, product, and design  
Related PRD: `docs/salon-merchant-app-revamp-prd.md`  
Prepared on: 2026-06-10

## The Story We Are Building

Imagine a salon owner named Asha. She runs Glow Studio with three staff members, two chairs, a small product shelf, and a growing customer base. Before Salex, her work was scattered across WhatsApp chats, paper notes, memory, UPI screenshots, and staff phone calls. She could take appointments, but she could not easily see what happened in the business every day.

Salex already gives her the most important growth channel: customers can book through WhatsApp without downloading an app. The revamp turns that WhatsApp booking into a complete salon operating loop. Asha should open the Salex mobile app in the morning, understand her day in a few seconds, create appointments in one or two taps, convert finished appointments into bills, save every customer automatically, and later use those customer records for retention, loyalty, and campaigns.

The premium app should not feel like a complicated CRM. It should feel like a calm salon diary that also knows how to make bills, remember customers, track stock, and show reports.

The developer implementing this should always remember this product rule:

```text
The owner should never feel that Salex is asking for data just because software wants data.
Every field must help the owner book, bill, remember, remind, or grow.
```

## What We Already Have

Salex already has a working foundation. The existing merchant app has login, onboarding, business profile, business hours, services, staff, resources, bookings, booking status actions, manual booking creation, checkout-style completion, and revenue summaries. The backend already has `Business`, `Service`, `Staff`, `Resource`, `Booking`, `BookingItem`, `Customer`, `Person`, `BusinessCustomer`, `WhatsAppConversation`, WhatsApp queue processing, and shared-number WhatsApp booking.

The revamp should reuse this. Do not rebuild the booking engine from zero. Do not create a separate CRM database. The same `businessId` must remain the center of the product. Every appointment, customer, bill, product, package, attendance record, report, WhatsApp message, and premium feature belongs to the same existing Salex business.

When Asha upgrades to premium, Salex should not create a new salon account for her. It should unlock premium modules for the same business she already uses.

## What We Are Intentionally Not Building First

The reference screens contain many features, but the first premium revamp should avoid becoming heavy. We are not building custom booking flows per salon. Booking stays standard. Salons can configure services, staff, prices, working hours, reminders, packages, and rules, but they do not redesign the core booking journey.

We are not putting a full WhatsApp CRM inbox inside the mobile app first. The mobile app is for running the salon day. The future web workspace can handle campaigns, deep segmentation, and heavier CRM views.

We are not building SMS wallet as the core reminder system. Salex is WhatsApp-first. If SMS comes later, it is a fallback channel, not the main product.

We are not building a full accounting system with vendors, purchase orders, complex tax filing, and inventory accounting in v1. We only need simple bills, payments, dues, products, stock movements, and expenses.

We are not exposing a giant permission checkbox matrix to every owner in v1. We will use simple role presets first: Owner, Manager, Receptionist, and Staff. Granular permission editing can come later.

We are not requiring geofence attendance, product photos, staff certificates, salary rules, and commission rules in the first daily operating loop. Those are useful, but they should arrive after booking, billing, customers, and reports are reliable.

## The Premium Upgrade Moment

Asha is already using Salex for shared-number WhatsApp bookings. She opens the app and sees a small premium card in `More`, not a loud blocker on Home. The card says that premium unlocks billing, customer history, packages, inventory, reports, reminders, and later WhatsApp growth tools.

When she taps the premium card, the app explains the upgrade in salon language. It does not say “CRM automation suite.” It says that Salex will help her remember every customer, make bills faster, track repeat visits, and bring customers back.

After upgrade, the app does not ask her to start from zero. The backend already knows her `businessId`, services, staff, resources, hours, and bookings. Premium modules are activated for that same business. Existing services appear in the new billing flow. Existing staff appear in appointment filters. Existing bookings appear in the new timeline. Existing WhatsApp bookings start creating richer customer records.

From the developer perspective, premium unlock should be entitlement-based. The UI should check feature access before showing advanced modules. The data should still be business-scoped, even if a business is not premium yet.

## The New App Shape

When Asha opens the revamped mobile app, she sees five bottom tabs:

```text
Home
Appointments
Billing
Customers
More
```

Home is her daily command center. Appointments is her schedule. Billing is where money and invoices live. Customers is her salon memory. More contains advanced tools such as Services, Staff, Inventory, Expenses, Packages, Reports, Settings, and later WhatsApp Workspace.

This structure is important. Services and Staff are not primary tabs anymore because the owner does not edit services every hour. She checks appointments, makes bills, and looks up customers every day. Advanced setup belongs in More.

The current `HomeScreen`, `BookingsScreen`, `ServicesScreen`, `StaffManagementScreen`, `ResourceManagementScreen`, `ProfileScreen`, and `LedgerScreen` should be treated as reusable material. The revamp should reorganize the experience, not throw away working code.

## Asha Starts Her Day On Home

At 10:00 AM, Asha opens Salex. Home loads the selected business, today's appointments, today's invoices, customer activity, low stock alerts, and pending tasks.

The top of Home shows her salon name, today’s date, and a small account/menu button. Below it, she sees three simple cards. The first card says today’s sales. The second card says today’s appointments. The third card can show pending requests or new customers, depending on what needs attention. These cards should not be decorative. They should be tappable only when there is a useful destination.

Below the summary, she sees the most important part of Home: quick actions. The first row contains `New Bill` and `New Appt`. The second row contains `Attendance` and `Add Expense`. The third row contains `Inventory` and `Services`.

The `New Bill` button must be the easiest path for walk-in revenue. The `New Appt` button must be the easiest path to schedule work. These two are the highest priority actions and should be visible without scrolling on normal phones.

Below quick actions, Home shows today’s schedule. It should show the next few appointments in time order. If an appointment is pending from WhatsApp, the row should visibly need action. If an appointment is confirmed, it should look calm. If it is completed, it should show completion and billing status.

At the bottom of the Home content, Asha sees operational alerts. If stock is low, Salex shows one low-stock card. If attendance setup is missing, Salex can show one small setup reminder. If nothing needs attention, Salex says there are no alerts. Do not fill Home with empty modules.

The developer should think of Home as an aggregator, not as the owner of all business logic. Home reads from bookings, invoices, customers, inventory, attendance, and alerts. It should not calculate everything in the component forever. Important metrics should move to backend summary endpoints as the app grows.

## Asha Creates A Manual Appointment

A customer calls Asha and says, “Can I come at 5:30 for haircut?” Asha is on Home. She taps `New Appt`.

The app opens the appointment creation screen or drawer. The first field is customer, but it must not block her. The default state is `Walk-in / No customer selected`. If Asha wants to save the customer, she taps the customer field and searches by name or phone. If the customer does not exist, the search sheet shows `Add new customer`. Tapping it opens a small add customer form with only name and phone required. Email, birthday, gender, and notes stay optional.

Below customer, Asha sees service selection. The most frequently used services should appear first. If the salon has many services, a search input appears at the top of the service selector. Asha taps `Haircut`. The app immediately updates total duration and price. If she taps another service, Salex supports multi-service booking using the existing `BookingItem` idea.

Next, Asha chooses date and time. If she came from Home, the default date is today and the default time can be the next available slot. If she came from the Appointments timeline by tapping an empty slot, the selected date and time are already filled.

Staff is optional. The default value is `Any available staff`. If Asha wants a specific staff member, she opens the staff selector and taps the staff name. Resource is also optional and can stay hidden under an advanced allocation section. This continues the current resource/staff allocation model without forcing non-technical owners to understand capacity logic every time.

Status defaults to `Confirmed` for manual appointments. WhatsApp bookings may come in as `Pending` if owner approval is required. Notes are optional.

At the bottom, the save button is fixed and visible. It says `Save Appointment`. Next to it or above it, Salex shows the total amount and duration. Asha taps the button. The app checks availability using the existing availability logic, creates a `Booking`, creates `BookingItem` snapshots, links a `BusinessCustomer` if selected, and returns her to the place she started.

After save, Salex should show a simple success state and the appointment should immediately appear on Home and Appointments. If the appointment is for a known customer, the customer profile visit history should now include it.

## A WhatsApp Booking Arrives

Now a customer books through WhatsApp. The existing shared-number WhatsApp flow collects business, service, staff preference, and time. The booking engine creates or prepares a booking request for Asha’s business.

In the merchant app, Asha receives a push notification and Home shows a pending appointment row. The row should say enough for a fast decision: customer phone/name, service, requested time, and price.

Asha taps the row. The appointment detail opens. At the top, she sees the customer card with phone and call button. Below it, she sees service details, staff assignment, time, status, and notes. At the bottom, because the booking is pending, the primary action is `Confirm Booking`. A secondary action says `Reject`.

When she taps `Confirm Booking`, Salex updates the booking status using the existing booking status flow. The backend writes status history. The WhatsApp outbound system sends the customer a confirmation message. The booking row moves from pending to confirmed.

When she taps `Reject`, the app should ask for confirmation and optionally a reason later. The backend marks the booking rejected and WhatsApp sends a polite rejection or unavailable message.

The important developer rule is that WhatsApp and mobile must not create separate booking concepts. A WhatsApp appointment and a manually created appointment are both `Booking` records. Their `source` differs, but downstream billing, customer history, reports, and reminders should work the same.

## Asha Views The Appointment Timeline

Later in the day, Asha taps the `Appointments` bottom tab. This screen is different from the current revenue-style booking list. It should primarily help her understand the day’s schedule.

At the top, the screen title says `Appointments`. A `+ New` button is placed in the top-right. Below the title, there is a date selector. The default is today. Below that, there are compact filters for staff, status, and perhaps resource. These filters should be simple dropdowns, not a complicated analytics panel.

The main content is a vertical timeline. Each hour is visible on the left. Appointment cards sit beside the time they occupy. If two appointments overlap, the layout should make that obvious. If there is an empty slot, tapping it should open the New Appointment screen with that date and time already selected.

Asha taps a booking card at 5:30 PM. Appointment detail opens. The detail screen should be the same detail experience whether she came from Home, Appointments, Customer Profile, or WhatsApp notification.

The developer should avoid building separate detail components for every entry point. Use one appointment detail surface with state-driven actions.

## Asha Completes An Appointment And Makes A Bill

At 6:15 PM, the haircut is done. Asha opens the appointment detail. The booking is currently confirmed or in progress. At the bottom, the primary button says `Mark Completed -> Make Bill`.

This button is important because Salex should not treat appointment completion and payment as the same thing. In a real salon, the customer may add shampoo, buy a serum, use a package, get a discount, or pay partially. So the appointment should become a bill draft.

Asha taps `Mark Completed -> Make Bill`. The backend may first mark the booking as completed or in-progress-to-completed, depending on final state design. Then the app opens the New Bill screen with appointment services already added as bill items.

The Bill screen starts with customer. If the appointment already has a customer, the customer is prefilled. If the appointment was walk-in, the customer field remains optional.

The items section shows the services from the appointment. Asha can add more items with three buttons: `+ Service`, `+ Product`, and `+ Package`. The first release must support service items. Product and package can be added when those domains are ready, but the UI should be designed so they fit naturally.

Below items, Asha can apply a discount. Discount should be optional. Tax should be simple. If tax is not implemented yet, default to `No Tax` and keep the tax UI behind a future flag.

Then Asha chooses payment method. The first release should support Cash, UPI, and Other. Payment defaults to full payment. If partial payment is enabled, Asha can enter paid amount and Salex calculates due amount.

At the bottom, the summary shows subtotal, discount, tax, grand total, paid, and due. The primary button says `Generate Bill` or `Generate Invoice`.

When Asha taps it, Salex creates an `Invoice`, `InvoiceItem`s, and `Payment` records. It updates customer spend and due totals. If product inventory is enabled, it creates stock movements. If loyalty is enabled, it creates loyalty ledger entries. If WhatsApp reminders/receipts are enabled, Salex sends the customer a bill message.

After bill generation, Asha lands on a bill success screen or returns to the appointment detail showing `Billed` status. The appointment should no longer feel unfinished.

## Asha Creates A Direct Bill Without Appointment

Some customers walk in only to buy a product. Some pay for a package. Some get a service without a scheduled appointment. Asha should not be forced to create an appointment first.

From Home, she taps `New Bill`. The Bill screen opens with no appointment attached. Customer is optional. Items are empty. She taps `+ Service`, `+ Product`, or `+ Package`, depending on what is enabled. She chooses payment method and taps `Generate Bill`.

The backend creates an invoice with `bookingId` empty. If a customer is selected, the customer profile still updates. If no customer is selected, the invoice is treated as walk-in revenue.

This path is critical because it makes Salex useful at the counter, not just in the appointment calendar.

## Asha Looks Up A Customer

A customer named Riya calls and asks, “What did I do last time?” Asha taps the `Customers` bottom tab.

The top of Customers has a search field. The placeholder should say `Search by name or phone`. Below it, simple filters can show later: all, due, inactive, birthday, package active. In v1, search and sort are enough.

Asha types `Riya`. Customer rows appear. Each row shows name, phone, visit count, last visit date, and total spend or due. Asha taps Riya.

The customer profile opens. At the top, it shows name and phone with a call button. Below it, Salex shows total spend, total due, visits, and loyalty points if enabled. Then it shows past visits and bills. Notes appear below. Packages or memberships appear if the customer has any.

There should be two important actions on this profile: `Book Appointment` and `New Bill`. If Asha taps `Book Appointment`, the appointment screen opens with Riya prefilled. If she taps `New Bill`, the Bill screen opens with Riya prefilled.

This is how customer CRM stays useful without feeling like CRM software. The customer profile exists to help Asha remember and act quickly.

## Asha Adds A Customer Manually

Sometimes a customer calls before booking. Asha opens Customers and taps `+ Add`.

The Add Customer screen asks for full name and phone. Phone is required because WhatsApp and customer identity depend on it. Email, gender, birthday, and notes are optional. The save button is at the bottom.

When saved, the backend should create or reuse a `Person` by phone number, then create a `BusinessCustomer` for Asha’s business. This prevents duplicate global identities while still allowing each salon to have its own customer notes and preferences.

If the phone number already exists in the same business, Salex should show the existing profile instead of silently creating a duplicate.

## Asha Manages Services

Services are not a daily tab, but they are important. Asha opens `More`, then taps `Services`.

The existing `ServicesScreen` already supports service creation and editing. In the revamp, this screen should be simplified visually and connected to billing and booking. Each service row should show name, duration, price, and active/inactive state.

When Asha taps `+`, she enters service name, price, duration, and optional description. In later phases, service setup can include linked consumable products, tax group, staff eligibility, and online booking visibility. Those advanced fields should not be required in v1.

The output remains the existing `Service` model. The important change is that services now feed three places: WhatsApp booking, manual appointment creation, and bill creation.

## Asha Manages Staff

Asha opens `More`, then taps `Staff`.

The current staff management already supports name, phone, active state, and resource linking. In the revamp, the first staff screen should keep that simplicity. Staff rows show name, phone, active status, and today’s assigned appointments if available.

When Asha adds staff, the first form asks only name and phone. Below that, an `Advanced` section can later hold role, login access, working hours, salary, commission, and documents. Do not force those fields during basic setup.

If staff login is enabled in a later phase, the backend should not reuse the broad owner-only model. It should create a business membership with role and permissions. The staff profile and app login should be related but not confused.

## Asha Tracks Inventory Later, Not On Day One

Inventory is useful, but it should not block the first revamp release. When inventory is enabled, Asha opens `More`, then taps `Inventory`.

The Inventory screen starts with search and a `+ Add` button. If there are no products, the empty state says no products yet and offers Add Product. Tapping Add opens a sheet or screen where she chooses Product Category or Product.

When adding a product, Asha enters product name, category, product type, opening stock, low-stock alert, purchase price, selling price, tax group, and photo later. The product type matters. A product can be sold directly, like shampoo bottles, or consumed during services, like hair color or wax.

The first inventory implementation can skip photos and complex tax. It should focus on product name, category, type, selling price, opening stock, and low-stock alert.

When a retail product is added to a bill, stock decreases. When a consumable is linked to a service and that service is billed, stock can decrease later through service consumption rules. Low stock appears on Home as an alert.

## Asha Adds An Expense Quickly

From Home, Asha taps `Add Expense`.

The Add Expense screen is intentionally small. It asks for category, description, amount, and date. The default date is today. Category opens a simple picker with Supplies, Salaries, Marketing, Maintenance, and Other. The save button sits at the bottom.

When saved, the backend creates an expense record scoped to the business. Expenses later appear in Reports and Billing/Finance views.

This feature should not become accounting software. It exists because small salon owners need to remember cash going out.

## Asha Uses Packages And Loyalty After The Core Loop Works

Packages and loyalty are premium retention tools, but they should come after appointments, billing, and customer profiles are stable.

When packages are enabled, Asha opens `More`, then `Packages`. She taps `+ Add`. The form asks for package name, price, included services, and validity. Tax can default to no tax in early releases. When a customer buys a package, Salex creates a customer package record. When the customer uses one included service, Salex records redemption.

Loyalty should be even simpler. Asha should not configure complex point rules early. Salex can provide one default rule, such as points earned from paid invoices. Customer profile shows wallet points. Billing can optionally redeem points as discount later.

The developer should not build campaigns before these records are trustworthy. Campaigns need clean customers, visits, bills, packages, and loyalty data.

## Asha Checks Reports

At the end of the week, Asha opens `More`, then `Reports`.

The Reports screen is a menu of questions, not a dashboard full of charts. It should show Sales Summary, Customer Visits, Staff Commission later, Stock Report later, Expenses, and Appointment Summary.

When Asha taps Sales Summary, she chooses date range and sees total sales, paid amount, due amount, discounts, and payment method split. When she taps Customer Visits, she sees repeat customers, new customers, and top customers. When she taps Appointment Summary, she sees completed, pending, cancelled, and no-show numbers.

The current `LedgerScreen` already contains useful aggregation ideas. But as the product grows, reports should come from backend endpoints rather than being fully calculated in React Native from loaded bookings.

## Asha Gives Staff Limited Access Later

When Asha grows, she may want a receptionist to manage appointments but not see revenue reports. She may want staff to see their own appointments but not edit services.

This should not be the first premium release, but the architecture should be prepared. Asha opens `More`, then `Staff`, then chooses a staff member and enables login. Salex asks which role this person should have. The first options are Owner, Manager, Receptionist, and Staff.

If Asha chooses Receptionist, that person can create appointments, view customers, and make bills if allowed. If she chooses Staff, that person can see assigned appointments and mark attendance. The detailed checkbox matrix from the reference app can come later under Customize Permissions.

The backend should eventually use business-scoped membership and permissions. Do not rely forever on only `UserRole.OWNER` and `UserRole.STAFF`.

## The Future WhatsApp Premium Workspace

The mobile app should not become overwhelming. The WhatsApp CRM workspace should eventually live mainly on web. Asha can open it from mobile through `More -> WhatsApp Workspace`, but campaign creation, customer segmentation, and inbox-heavy workflows belong on a larger screen.

When web workspace is ready, Asha opens the web dashboard on desktop. It shows a QR code. She opens the Salex mobile app, taps `Connect desktop`, scans the QR code, approves the session, and the web dashboard opens without another password login.

This future workspace uses the same `businessId`, customer records, bookings, invoices, loyalty, and WhatsApp channel data. It is not a separate product database.

## How A Junior Developer Should Think While Implementing

The junior developer should implement from the daily loop outward. First make the owner able to run one day inside Salex. That means Home, Appointments, New Appointment, Appointment Detail, New Bill, Customers, and Customer Profile. Then build packages, loyalty, inventory, expenses, reports, staff permissions, and WhatsApp workspace.

Whenever the developer creates a screen, they should ask what the owner was doing one second before and what she wants to do one second after. If a field does not help that moment, hide it behind Advanced or postpone it.

Whenever the developer creates a backend model, they should scope it to `businessId`. If the record belongs to a customer, connect it to `BusinessCustomer`. If it came from WhatsApp, keep source metadata, but do not create a separate WhatsApp-only business object. If money moved, it should connect to invoice/payment. If stock moved, it should connect to stock movement. If a booking changed, it should write status history.

Whenever the developer creates a premium feature, they should think about entitlement. Free/shared-number salons may see booking basics. Premium salons get billing, customers, packages, inventory, reports, reminders, and eventually WhatsApp growth tools. The UI should not overwhelm non-premium users, but the data model should not fork into separate systems.

## The Final Owner Journey

The complete story should feel like this:

Asha opens Salex in the morning and sees what matters today. She taps New Appt when someone calls. WhatsApp bookings appear automatically. She confirms or rejects them. She sees her day on the appointment timeline. When a service finishes, she taps Mark Completed -> Make Bill. The bill is already filled from the appointment. She adds a product, applies discount if needed, takes UPI, and generates the bill. The customer profile updates automatically. If stock is low, Salex tells her. If she spent money on supplies, she adds an expense. At night, she checks reports and understands the day.

That is the product.

Not a complicated CRM. Not a custom flow editor. Not accounting software.

Salex should become the easiest way for a salon to turn WhatsApp demand into appointments, bills, customer memory, and repeat business.

